// Tests for the content gate's matcher. The gate is the last thing standing
// between a retracted claim and the public site, so the mangling cases matter
// as much as the plain ones: a term reintroduced with a hyphen or a zero-width
// joiner reads identically to a browser and must still fail the build.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  findTerms,
  normalize,
  scan,
  scanAll,
  COMMITTED,
  RETRACTED,
  BANNED_VOCABULARY,
  PROSE_EXT,
  ALL_TEXT_EXT,
} from "./content-gate.mjs";

const SOFT_HYPHEN = "\u00AD";
const ZWSP = "\u200B";
const ZWNJ = "\u200C";
const ZWJ = "\u200D";
const WORD_JOINER = "\u2060";

test("finds a plain term regardless of case", () => {
  assert.deepEqual(findTerms("built on REDIS today", ["Redis"]), ["Redis"]);
  assert.deepEqual(findTerms("built on redis today", ["Redis"]), ["Redis"]);
});

test("finds a term split by a hyphen or underscore", () => {
  assert.deepEqual(findTerms("built on Red-is", ["Redis"]), ["Redis"]);
  assert.deepEqual(findTerms("built on Red_is", ["Redis"]), ["Redis"]);
});

test("finds a term split by each zero-width character", () => {
  for (const [name, ch] of Object.entries({ SOFT_HYPHEN, ZWSP, ZWNJ, ZWJ, WORD_JOINER })) {
    assert.deepEqual(findTerms(`uses Fire${ch}fox here`, ["Firefox"]), ["Firefox"], name);
  }
});

test("finds a multi-word term whose spaces have been squeezed out", () => {
  assert.deepEqual(findTerms("on the ChromeWebStore", ["Chrome Web Store"]), [
    "Chrome Web Store",
  ]);
});

test("reports every distinct term present, not just the first", () => {
  assert.deepEqual(findTerms("blazingly seamless prose", BANNED_VOCABULARY), [
    "blazingly",
    "seamless",
  ]);
});

test("clean text yields nothing", () => {
  assert.deepEqual(findTerms("a wholly unremarkable sentence", COMMITTED), []);
});

test("an empty term list matches nothing, even in dirty text", () => {
  assert.deepEqual(findTerms("Redis and Firefox and blazingly", []), []);
});

test("normalize strips joiners but preserves letters", () => {
  assert.equal(normalize(`Fire${ZWSP}-fox`), "firefox");
  assert.equal(normalize("Chrome Web Store"), "chromewebstore");
});

test("the committed list is the two source lists, and is not empty", () => {
  assert.deepEqual(COMMITTED, [...RETRACTED, ...BANNED_VOCABULARY]);
  assert.ok(COMMITTED.length > 0, "a gate that checks nothing is not a gate");
});

test("scan walks nested directories and skips non-text extensions", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "content-gate-test-"));
  try {
    mkdirSync(path.join(dir, "nested"));
    writeFileSync(path.join(dir, "clean.html"), "nothing here");
    writeFileSync(path.join(dir, "nested", "dirty.html"), `uses Fire${ZWJ}fox`);
    writeFileSync(path.join(dir, "ignored.png"), "Redis");

    const failures = scan(dir, COMMITTED);
    assert.equal(failures.length, 1, "only the nested html file should fail");
    assert.match(failures[0], /dirty\.html/);
    assert.match(failures[0], /Firefox/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// The two lists have different scopes. Vendor bundles legitimately contain banned
// words as identifiers — React's attribute table has `case"seamless":` — and a gate
// that fails a deploy on React's internals is a gate that gets switched off.
test("scanAll ignores banned vocabulary inside JavaScript", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "content-gate-test-"));
  try {
    writeFileSync(path.join(dir, "vendor.js"), 'case"seamless":case"scoped":');
    assert.deepEqual(scanAll(dir), [], "React's attribute table must not fail the build");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scanAll still catches a retracted claim inside JavaScript", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "content-gate-test-"));
  try {
    writeFileSync(path.join(dir, "app.js"), 'const db = "Redis";');
    const failures = scanAll(dir);
    assert.equal(failures.length, 1, "a retracted claim must fail anywhere it appears");
    assert.match(failures[0], /retracted term "Redis"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scanAll catches banned vocabulary in reader-facing HTML", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "content-gate-test-"));
  try {
    writeFileSync(path.join(dir, "page.html"), "<p>a seamless experience</p>");
    const failures = scanAll(dir);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /banned term "seamless"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the prose extension set is a strict subset of the full text set", () => {
  for (const ext of PROSE_EXT) assert.ok(ALL_TEXT_EXT.has(ext), `${ext} missing from ALL_TEXT_EXT`);
  assert.ok(!PROSE_EXT.has(".js"), "JavaScript is not reader-facing prose");
});

test("scan over a clean tree returns no failures", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "content-gate-test-"));
  try {
    writeFileSync(path.join(dir, "index.html"), "<p>an ordinary page</p>");
    assert.deepEqual(scan(dir, COMMITTED), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Word boundaries.
//
// Consolidation fed the gate the essays for the first time and it failed twice,
// on prose that mentions nothing retracted:
//
//   "currently being rediscovered"            -> "Redis" as a plain substring
//   "a backup that has never been restored is" -> "restored is" squeezed to "restoredis"
//
// A gate that cries wolf on ordinary English gets switched off, which costs more
// than the false negative it was buying. The mangling cases below are the reason
// the fix cannot simply be a whole-word search over the raw text.
// ---------------------------------------------------------------------------

test("a term embedded in a longer word is not a hit", () => {
  assert.deepEqual(findTerms("currently being rediscovered", ["Redis"]), []);
});

test("a term spanning a word boundary is not a hit", () => {
  assert.deepEqual(findTerms("a backup that has never been restored is debt", ["Redis"]), []);
});

test("a term is still caught when it stands alone next to punctuation", () => {
  assert.deepEqual(findTerms("we used Redis.", ["Redis"]), ["Redis"]);
  assert.deepEqual(findTerms("(Redis)", ["Redis"]), ["Redis"]);
});

test("a hyphenated compound still trips the banned word it starts with", () => {
  // The naive fix — strip hyphens, then match whole words — misses this, because
  // stripping fuses "blazingly-fast" into one word that no longer ends at "blazingly".
  assert.deepEqual(findTerms("a blazingly-fast rewrite", ["blazingly"]), ["blazingly"]);
});

test("letter-by-letter mangling is still caught", () => {
  assert.deepEqual(findTerms("we used R-e-d-i-s here", ["Redis"]), ["Redis"]);
  assert.deepEqual(findTerms(`we used R${ZWSP}e${ZWNJ}d${ZWJ}i-s here`, ["Redis"]), ["Redis"]);
});

test("a retracted hyphenated term is caught however it is spaced", () => {
  for (const text of ["a 16-agent swarm", "a 16 agent swarm", "a 16agent swarm"]) {
    assert.deepEqual(findTerms(text, ["16-agent"]), ["16-agent"], text);
  }
});

test("the real essay prose that exposed this passes the gate", () => {
  const prose = [
    "This synthesis is currently being rediscovered, independently and in fragments.",
    "Restore drills on a schedule; a backup that has never been restored is Unenforced debt.",
  ].join("\n");

  assert.deepEqual(findTerms(prose, COMMITTED), []);
});
