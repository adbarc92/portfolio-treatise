// Style gate over BUILT OUTPUT (dist/). Fail-closed: unreadable dist, or any
// class or custom property used in markup with no rule behind it → exit 1.
//
// This gate exists because the same defect shipped three times in one day and
// no existing check saw any of it. `/writing/projects` rendered `.card`, `.tag`
// and `.tags`; `/writing/eidos` rendered those plus `--color-accent`,
// `--color-text-muted` and `--font-mono`. None of them had a single rule
// anywhere. Nothing failed: not the build, not `npm test`, not the content
// gate — because every one of them is valid HTML and valid CSS. They were
// invisible until eight tags on one entry rendered wide enough to clip.
//
// A stylesheet cannot be checked against markup by reading either one alone,
// which is why this walks the emitted pages rather than the source.
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Classes emitted by a library's own markup, which carry their styling by other
 * means and are not expected to have a rule in this repo's CSS.
 *
 * `line` is Shiki's per-line wrapper inside `<pre><code>`; every token it holds
 * carries an inline `style`, so the wrapper needs no rule of its own. Adding an
 * entry here is a claim that something else styles it — say where.
 */
export const NOT_OURS = new Set(["line"]);

/** Astro's scoping attribute, not an authored class. */
const ASTRO_SCOPE = /^astro-/;

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/**
 * Every class and custom property the emitted pages actually use, and everything
 * the emitted CSS actually defines.
 *
 * @param {string[]} files absolute paths of built files
 * @returns {{deadClasses: Map<string,Set<string>>, deadTokens: Map<string,Set<string>>}}
 */
export function audit(files) {
  const htmlFiles = files.filter((f) => f.endsWith(".html"));
  const cssFiles = files.filter((f) => f.endsWith(".css"));

  let css = cssFiles.map((f) => readFileSync(f, "utf8")).join("\n");
  /** @type {Map<string,Set<string>>} */
  const usedClasses = new Map();
  /** @type {Map<string,Set<string>>} */
  const usedTokens = new Map();

  for (const f of htmlFiles) {
    const src = readFileSync(f, "utf8");
    // Scoped <style> blocks are emitted inline, so they define rules too.
    for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += "\n" + m[1];

    for (const m of src.matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/)) {
        if (!c || ASTRO_SCOPE.test(c) || NOT_OURS.has(c)) continue;
        if (!usedClasses.has(c)) usedClasses.set(c, new Set());
        usedClasses.get(c).add(f);
      }
    }
  }

  // A token referenced anywhere — stylesheet or inline style — must resolve.
  const allText = css + "\n" + htmlFiles.map((f) => readFileSync(f, "utf8")).join("\n");
  for (const m of allText.matchAll(/var\((--[\w-]+)\)/g)) {
    if (!usedTokens.has(m[1])) usedTokens.set(m[1], new Set());
  }

  const definedClasses = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const definedTokens = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

  /** @type {Map<string,Set<string>>} */
  const deadClasses = new Map();
  for (const [c, where] of usedClasses) if (!definedClasses.has(c)) deadClasses.set(c, where);
  /** @type {Map<string,Set<string>>} */
  const deadTokens = new Map();
  for (const [t, where] of usedTokens) if (!definedTokens.has(t)) deadTokens.set(t, where);

  return { deadClasses, deadTokens };
}

function main() {
  const dist = fileURLToPath(new URL("../dist", import.meta.url));
  const selftest = process.argv.includes("--selftest");

  /** @type {string[]} */
  let files;
  try {
    files = walk(dist);
  } catch {
    console.error("style gate: dist/ unreadable — build first. Failing closed.");
    process.exit(1);
  }
  if (files.filter((f) => f.endsWith(".html")).length === 0) {
    console.error("style gate: no HTML in dist/ — failing closed rather than passing an empty scan.");
    process.exit(1);
  }

  if (selftest) {
    // Prove the gate catches its own canary before it is trusted with the real
    // scan — the same contract content-gate.mjs honours.
    const tmp = path.join(dist, "__style-gate-canary.html");
    writeFileSync(tmp, '<html><body><p class="definitely-not-a-real-class-xyz" style="color:var(--definitely-not-a-token-xyz)">x</p></body></html>');
    let caught;
    try {
      const r = audit(walk(dist));
      caught = r.deadClasses.has("definitely-not-a-real-class-xyz") && r.deadTokens.has("--definitely-not-a-token-xyz");
    } finally {
      rmSync(tmp, { force: true });
    }
    if (!caught) {
      console.error("style gate: SELFTEST FAILED — the canary was not detected. The gate is not trustworthy.");
      process.exit(1);
    }
    console.log("style gate: selftest passed (canary class and token both caught)");
    return;
  }

  const { deadClasses, deadTokens } = audit(files);
  let bad = false;

  for (const [c, where] of deadClasses) {
    bad = true;
    const pages = [...where].map((f) => f.slice(dist.length).split(path.sep).join("/"));
    console.error(`style gate: class .${c} is used but has no CSS rule — ${pages.slice(0, 3).join(", ")}`);
  }
  for (const t of deadTokens.keys()) {
    bad = true;
    console.error(`style gate: custom property ${t} is referenced but never defined`);
  }

  if (bad) {
    console.error("style gate: markup references styling that does not exist — build fails");
    process.exit(1);
  }
  console.log("style gate: clean — every class and custom property in the emitted pages resolves");
}

main();
