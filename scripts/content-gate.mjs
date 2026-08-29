// Content gate over BUILT OUTPUT (dist/). Fail-closed on every path:
// an empty term list, unreadable dist, or any hit → exit 1.
// Terms are committed here, not secret: the retracted-claims list (Hard Rule 2)
// and the banned vocabulary from the design system.
// This gate formerly also scanned an EMBARGO_TERMS secret for Alex's LLC name.
// That embargo lifted on 2026-08-29 and the secret scan was removed with it;
// the mangling-resistant matcher is kept, because a retracted claim can be
// reintroduced with a hyphen or a zero-width joiner just as easily.
// --selftest proves the matcher catches a planted term, including one
// mangled with case, hyphens, and zero-width joiners.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const RETRACTED = [
  "Firefox",
  "Chrome Web Store",
  "16-agent",
  "Redis",
  "Tenzy",
];
const BANNED_VOCABULARY = [
  "passionate", "cutting-edge", "blazingly", "seamless", "delightful", "crafting",
];
const COMMITTED = [...RETRACTED, ...BANNED_VOCABULARY];
const TEXT_EXT = new Set([".html", ".js", ".css", ".xml", ".txt", ".json", ".svg", ".webmanifest"]);

// strip whitespace, hyphens/underscores, soft hyphen, zero-width chars, word joiner
const normalize = (s) =>
  s.toLowerCase().replace(/[\s\-_\u00AD\u200B-\u200D\u2060]/g, "");

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (TEXT_EXT.has(path.extname(p))) yield p;
  }
}

function scan(distDir, terms) {
  const failures = [];
  for (const file of walk(distDir)) {
    const raw = readFileSync(file, "utf8");
    const lower = raw.toLowerCase();
    const squeezed = normalize(raw);
    for (const term of terms) {
      if (lower.includes(term.toLowerCase()) || squeezed.includes(normalize(term)))
        failures.push(`${file}: retracted/banned term "${term}" present`);
    }
  }
  return failures;
}

if (process.argv.includes("--selftest")) {
  // canary: the gate must catch a planted term, plain and mangled
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(path.join(tmpdir(), "content-canary-"));
  try {
    writeFileSync(path.join(dir, "plain.html"), "contains ContentCanaryTerm here");
    writeFileSync(path.join(dir, "mangled.html"), "contains Content\u200BCanary_Term here");
    writeFileSync(path.join(dir, "clean.html"), "nothing to see");
    const hits = scan(dir, ["contentcanaryterm"]);
    if (hits.length !== 2) {
      console.error(`content gate SELFTEST FAILED: expected 2 canary hits, got ${hits.length}`);
      process.exit(1);
    }
    if (scan(dir, []).length !== 0) {
      console.error("content gate SELFTEST FAILED: clean fixture produced hits");
      process.exit(1);
    }
    console.log("content gate selftest passed: canary caught plain and mangled");
    process.exit(0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const distDir = path.resolve(process.argv[2] ?? "dist");
if (COMMITTED.length === 0) {
  console.error("content gate: no terms configured — a gate that checks nothing fails the build");
  process.exit(1);
}
let failures;
try {
  failures = scan(distDir, COMMITTED);
} catch (e) {
  console.error(`content gate: cannot scan ${distDir}: ${e.message}`);
  process.exit(1);
}
if (failures.length > 0) {
  for (const f of failures) console.error(`content gate: ${f}`);
  process.exit(1);
}
console.log(`content gate: clean (${COMMITTED.length} committed terms)`);
