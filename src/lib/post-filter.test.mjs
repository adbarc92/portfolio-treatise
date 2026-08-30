import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  asCategory,
  nextSearch,
  selectPosts,
} from "./post-filter.mjs";

const post = (category, tags = []) => ({ category, tags });

const CORPUS = [
  post("software", ["eidos", "agents"]),
  post("software", ["agents"]),
  post("politics", ["eidos"]),
  post("meta", []),
];

// ---------------------------------------------------------------------------
// The closed set
// ---------------------------------------------------------------------------

test("the label map covers exactly the categories the schema accepts", () => {
  // The Zod enum in content.config.ts decides what may be authored; this map
  // decides what the chips can say. An id in one and not the other is how a
  // filter silently splits in two, so the two are compared rather than trusted.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const config = readFileSync(path.join(here, "..", "content.config.ts"), "utf8");
  const literal = config.match(/CATEGORIES\s*=\s*\[([^\]]*)\]/);
  assert.ok(literal, "could not find the CATEGORIES literal in content.config.ts");

  const schemaIds = [...literal[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  assert.deepEqual(
    [...CATEGORY_IDS].sort(),
    schemaIds.sort(),
    "content.config.ts and the label map disagree about the category set",
  );
  for (const id of CATEGORY_IDS) {
    assert.ok(CATEGORY_LABELS[id], `category "${id}" has no label`);
  }
});

// ---------------------------------------------------------------------------
// asCategory
// ---------------------------------------------------------------------------

test("a known category passes through", () => {
  assert.equal(asCategory("software"), "software");
});

test("an unknown category becomes null", () => {
  // A hand-edited ?category=softwear must not filter everything into nothing.
  assert.equal(asCategory("softwear"), null);
});

test("a missing category becomes null", () => {
  assert.equal(asCategory(null), null);
  assert.equal(asCategory(undefined), null);
});

// ---------------------------------------------------------------------------
// selectPosts
// ---------------------------------------------------------------------------

test("with no filters every post is visible", () => {
  const { visible, pool } = selectPosts(CORPUS, {});
  assert.equal(visible.length, 4);
  assert.equal(pool.length, 4);
});

test("counts report each category present", () => {
  const { counts } = selectPosts(CORPUS, {});
  assert.deepEqual(counts, { software: 2, politics: 1, meta: 1 });
});

test("a category with no posts gets no count, so no empty chip is advertised", () => {
  const { counts } = selectPosts(CORPUS, {});
  assert.ok(!("fiction" in counts));
});

test("a tag narrows which posts are visible", () => {
  const { visible } = selectPosts(CORPUS, { tag: "eidos" });
  assert.equal(visible.length, 2);
});

test("a tag also narrows the counts the chips report", () => {
  // The chips describe the pool the tag left behind, so a chip's number always
  // matches what clicking it would actually show.
  const { counts } = selectPosts(CORPUS, { tag: "eidos" });
  assert.deepEqual(counts, { software: 1, politics: 1 });
});

test("a category narrows what is visible without changing the counts", () => {
  const { visible, counts } = selectPosts(CORPUS, { category: "software" });
  assert.equal(visible.length, 2);
  assert.deepEqual(counts, { software: 2, politics: 1, meta: 1 });
});

test("a tag and a category compose", () => {
  const { visible, counts } = selectPosts(CORPUS, { tag: "eidos", category: "software" });
  assert.equal(visible.length, 1);
  assert.deepEqual(counts, { software: 1, politics: 1 });
});

test("a category outside the tag's pool yields nothing visible", () => {
  const { visible } = selectPosts(CORPUS, { tag: "eidos", category: "meta" });
  assert.deepEqual(visible, []);
});

test("an unknown category is ignored rather than obeyed", () => {
  const { visible } = selectPosts(CORPUS, { category: "softwear" });
  assert.equal(visible.length, 4);
});

test("selecting does not mutate the posts it was given", () => {
  const original = structuredClone(CORPUS);
  selectPosts(CORPUS, { tag: "eidos", category: "software" });
  assert.deepEqual(CORPUS, original);
});

// ---------------------------------------------------------------------------
// The URL the chips write
//
// This is the shareable half of the filter: whatever a reader copies out of the
// address bar has to reproduce what they were looking at.
// ---------------------------------------------------------------------------

test("selecting a category adds it to an empty query", () => {
  assert.equal(nextSearch("", "software"), "?category=software");
});

test("selecting a category keeps an active tag", () => {
  assert.equal(nextSearch("?tag=eidos", "software"), "?tag=eidos&category=software");
});

test("clearing the category drops it and leaves the rest", () => {
  assert.equal(nextSearch("?tag=eidos&category=meta", null), "?tag=eidos");
});

test("clearing the only filter yields an empty query, not a bare question mark", () => {
  // A trailing "?" is a different URL to share and to cache for the same page.
  assert.equal(nextSearch("?category=meta", null), "");
});

test("replacing a category does not stack two of them", () => {
  assert.equal(nextSearch("?category=meta", "software"), "?category=software");
});

test("unrelated query parameters survive", () => {
  assert.equal(nextSearch("?utm_source=post", "meta"), "?utm_source=post&category=meta");
});

test("no category id appears twice", () => {
  // A duplicate splits one filter into two chips that each show half the posts.
  // The label map cannot hold duplicates, so this guards the schema's list.
  assert.equal(new Set(CATEGORY_IDS).size, CATEGORY_IDS.length);
});
