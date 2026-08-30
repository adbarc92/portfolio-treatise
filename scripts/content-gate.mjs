// Content gate over BUILT OUTPUT (dist/). Fail-closed on every path:
// an empty term list, unreadable dist, or any hit → exit 1.
// Terms are committed here, not secret: the retracted-claims list (Hard Rule 2)
// and the banned vocabulary from the design system.
// This gate formerly also scanned an EMBARGO_TERMS secret for Alex's LLC name.
// That embargo lifted on 2026-08-29 and the secret scan was removed with it;
// the mangling-resistant matcher is kept, because a retracted claim can be
// reintroduced with a hyphen or a zero-width joiner just as easily.
// The matcher is exported and covered by content-gate.test.mjs; --selftest
// remains so CI can prove the canary in the same shell that runs the scan.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const RETRACTED = [
  "Firefox",
  "Chrome Web Store",
  "16-agent",
  "Redis",
  "Tenzy",
];
export const BANNED_VOCABULARY = [
  "passionate", "cutting-edge", "blazingly", "seamless", "delightful", "crafting",
];
export const COMMITTED = [...RETRACTED, ...BANNED_VOCABULARY];

// The two lists have different scopes, and conflating them produces false positives.
// A retracted claim is a factual assertion: it must not appear in ANY emitted text.
// Banned vocabulary is a rule about the prose a reader sees, so it is scanned only
// over reader-facing output. Vendor bundles are full of these words as identifiers —
// React's attribute table contains `case"seamless":` — and failing a deploy on
// React's internals protects nobody from anything.
export const ALL_TEXT_EXT = new Set([".html", ".js", ".css", ".xml", ".txt", ".json", ".svg", ".webmanifest"]);
export const PROSE_EXT = new Set([".html", ".xml", ".txt"]);

// strip whitespace, hyphens/underscores, soft hyphen, zero-width chars, word joiner
export const normalize = (s) =>
  s.toLowerCase().replace(/[\s\-_\u00AD\u200B-\u200D\u2060]/g, "");

/** Terms present in `text`, matched literally or with word-joiners stripped. */
export function findTerms(text, terms) {
  const lower = text.toLowerCase();
  const squeezed = normalize(text);
  return terms.filter(
    (term) => lower.includes(term.toLowerCase()) || squeezed.includes(normalize(term))
  );
}

function* walk(dir, exts) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p, exts);
    else if (exts.has(path.extname(p))) yield p;
  }
}

export function scan(distDir, terms, exts = ALL_TEXT_EXT, label = "retracted/banned") {
  const failures = [];
  for (const file of walk(distDir, exts)) {
    for (const term of findTerms(readFileSync(file, "utf8"), terms))
      failures.push(`${file}: ${label} term "${term}" present`);
  }
  return failures;
}

/** The gate as CI runs it: each list over the output it actually governs. */
export function scanAll(distDir) {
  return [
    ...scan(distDir, RETRACTED, ALL_TEXT_EXT, "retracted"),
    ...scan(distDir, BANNED_VOCABULARY, PROSE_EXT, "banned"),
  ];
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain && process.argv.includes("--selftest")) {
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
} else if (isMain) {
  const distDir = path.resolve(process.argv[2] ?? "dist");
  if (COMMITTED.length === 0) {
    console.error("content gate: no terms configured — a gate that checks nothing fails the build");
    process.exit(1);
  }
  let failures;
  try {
    failures = scanAll(distDir);
  } catch (e) {
    console.error(`content gate: cannot scan ${distDir}: ${e.message}`);
    process.exit(1);
  }
  if (failures.length > 0) {
    for (const f of failures) console.error(`content gate: ${f}`);
    process.exit(1);
  }
  console.log(
    `content gate: clean (${RETRACTED.length} retracted over all output, ` +
      `${BANNED_VOCABULARY.length} banned over prose)`
  );
}
