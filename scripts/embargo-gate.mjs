// Embargo gate over BUILT OUTPUT (dist/). Fail-closed on every path:
// missing EMBARGO_TERMS, unreadable dist, or any hit → exit 1.
// Secret terms come only from the EMBARGO_TERMS env var (comma-separated);
// they are never committed and never echoed on a hit (index only).
// The retracted-claims list (Hard Rule 2) is not secret and lives here.
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

function scan(distDir, secretTerms) {
  const failures = [];
  for (const file of walk(distDir)) {
    const raw = readFileSync(file, "utf8");
    const lower = raw.toLowerCase();
    const squeezed = normalize(raw);
    secretTerms.forEach((term, i) => {
      if (lower.includes(term.toLowerCase()) || squeezed.includes(normalize(term)))
        failures.push(`${file}: EMBARGO_TERMS[${i}] present (term not echoed)`);
    });
    for (const term of [...RETRACTED, ...BANNED_VOCABULARY]) {
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
  const dir = mkdtempSync(path.join(tmpdir(), "embargo-canary-"));
  try {
    writeFileSync(path.join(dir, "plain.html"), "contains EmbargoCanaryTerm here");
    writeFileSync(path.join(dir, "mangled.html"), "contains Emb-argo\u200BCanary_Term here");
    writeFileSync(path.join(dir, "clean.html"), "nothing to see");
    const hits = scan(dir, ["embargocanaryterm"]);
    if (hits.length !== 2) {
      console.error(`embargo gate SELFTEST FAILED: expected 2 canary hits, got ${hits.length}`);
      process.exit(1);
    }
    if (scan(dir, []).length !== 0) {
      console.error("embargo gate SELFTEST FAILED: clean fixture produced hits");
      process.exit(1);
    }
    console.log("embargo gate selftest passed: canary caught plain and mangled");
    process.exit(0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const distDir = path.resolve(process.argv[2] ?? "dist");
const termsRaw = process.env.EMBARGO_TERMS ?? "";
const terms = termsRaw.split(",").map((t) => t.trim()).filter(Boolean);
if (terms.length === 0) {
  console.error("embargo gate: EMBARGO_TERMS is not set — a gate that cannot run fails the build");
  process.exit(1);
}
let failures;
try {
  failures = scan(distDir, terms);
} catch (e) {
  console.error(`embargo gate: cannot scan ${distDir}: ${e.message}`);
  process.exit(1);
}
if (failures.length > 0) {
  for (const f of failures) console.error(`embargo gate: ${f}`);
  process.exit(1);
}
console.log(`embargo gate: clean (${terms.length} secret terms, ${RETRACTED.length + BANNED_VOCABULARY.length} committed terms)`);
