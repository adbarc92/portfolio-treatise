// Extracts Halyard's release state machine from its actual definitions
// (src/halyard/coordinator/state-machine.ts) and emits plate JSON:
// { states, transitions, failsafe } plus provenance. Fail-closed: any
// parse or validation problem throws — never emits a guessed structure.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoDir =
  process.env.HALYARD_REPO ??
  path.resolve(here, "../../../../INFRASTRUCTURE/halyard");
const sourceFile = "src/halyard/coordinator/state-machine.ts";

const raw = readFileSync(path.join(repoDir, sourceFile), "utf8");

// Strip comments, then parse the LEGAL_TRANSITIONS object literal with a
// strict `key: ["str", ...]` grammar — no eval, and any residue the grammar
// does not cover (a computed value, a renamed shape) throws instead of
// silently dropping. ponytail: text-level extraction, not a TS parse;
// upgrade path: import via tsx if the literal ever stops being pure data.
const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
const m = stripped.match(/LEGAL_TRANSITIONS[^=]*=\s*(\{[\s\S]*?\})\s*;/);
if (!m) throw new Error(`extractor: LEGAL_TRANSITIONS not found in ${sourceFile}`);
const graph = {};
const entryRe = /["']?([\w$]+)["']?\s*:\s*\[([^\]]*)\]/g;
for (const [, key, list] of m[1].matchAll(entryRe)) {
  graph[key] = [...list.matchAll(/["']([^"']+)["']/g)].map(([, s]) => s);
}
const residue = m[1].replace(entryRe, "").replace(/[{}\s,]/g, "");
if (residue !== "" || Object.keys(graph).length === 0)
  throw new Error(`extractor: LEGAL_TRANSITIONS literal has unparsed content: "${residue}"`);

const states = Object.keys(graph);
if (states.length === 0) throw new Error("extractor: empty state machine");
for (const [from, tos] of Object.entries(graph)) {
  if (!Array.isArray(tos)) throw new Error(`extractor: ${from} targets not an array`);
  for (const to of tos)
    if (!states.includes(to))
      throw new Error(`extractor: transition ${from} -> ${to} targets unknown state`);
}
const terminal = states.filter((s) => graph[s].length === 0);
const targets = new Set(Object.values(graph).flat());
const entry = states.filter((s) => !targets.has(s));
if (terminal.length === 0 || entry.length === 0)
  throw new Error("extractor: no terminal or no entry state — not a release machine");

// Back edges (cycle re-entries: resubmit, re-flip) via DFS from entry states.
// ponytail: which edge of a 2-cycle reads as "recovery" follows the source's
// adjacency order; deterministic for a given commit, revisit if plates disagree.
const backEdges = new Set();
const done = new Set();
const onStack = new Set();
function dfs(u) {
  onStack.add(u);
  for (const v of graph[u]) {
    if (onStack.has(v)) backEdges.add(`${u}->${v}`);
    else if (!done.has(v)) dfs(v);
  }
  onStack.delete(u);
  done.add(u);
}
entry.forEach(dfs);

const transitions = Object.entries(graph).flatMap(([from, tos]) =>
  tos.map((to) => ({ from, to })),
);
const failsafe = transitions
  .filter(({ from, to }) => terminal.includes(to) || backEdges.has(`${from}->${to}`))
  .map(({ from, to }) => ({
    from,
    to,
    kind: terminal.includes(to) ? "failure" : "recovery",
  }));

const git = (...args) =>
  execFileSync("git", ["-C", repoDir, ...args], { encoding: "utf8" }).trim();
const remote = git("remote", "get-url", "origin")
  .replace(/^git@github\.com:/, "https://github.com/")
  .replace(/\.git$/, "");

const plate = {
  plate: "halyard",
  source: {
    repo: remote,
    commit: git("rev-parse", "HEAD"),
    workingTreeClean: git("status", "--porcelain") === "",
    file: sourceFile,
    extractedAt: new Date().toISOString(),
  },
  entry,
  states,
  terminal,
  transitions,
  failsafe,
};

const outFile = path.resolve(here, "../src/data/plates/halyard.json");
mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(plate, null, 2) + "\n");
console.log(
  `extracted ${states.length} states, ${transitions.length} transitions ` +
    `(${failsafe.length} fail-safe) from ${remote}@${plate.source.commit.slice(0, 7)}`,
);
console.log(`wrote ${outFile}`);
