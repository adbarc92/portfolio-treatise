import { test } from "node:test";
import assert from "node:assert/strict";

import { RESERVED_SLUGS, assertNoReservedSlugs } from "./reserved-slugs.mjs";

test("ordinary slugs pass", () => {
  assert.doesNotThrow(() => assertNoReservedSlugs(["hello-world", "the-ladder-problem"]));
});

test("a slug that shadows a static route is refused", () => {
  // Astro resolves /writing/about.astro before /writing/[slug].astro, so an
  // essay named `about` would build without error and be unreachable forever.
  assert.throws(() => assertNoReservedSlugs(["about"]), /about/);
});

test("every reserved name is actually refused", () => {
  for (const name of RESERVED_SLUGS) {
    assert.throws(() => assertNoReservedSlugs([name]), new RegExp(name));
  }
});

test("the error names every colliding slug, not just the first", () => {
  assert.throws(() => assertNoReservedSlugs(["about", "eidos"]), /about[\s\S]*eidos/);
});

test("an empty list passes", () => {
  assert.doesNotThrow(() => assertNoReservedSlugs([]));
});

test("the reserved set covers the static routes that exist", () => {
  // If a new static page is added under src/pages/writing/, it belongs here too.
  for (const name of ["about", "eidos", "projects", "essays", "category", "rss.xml", "sitemap.xml"]) {
    assert.ok(RESERVED_SLUGS.has(name), `${name} should be reserved`);
  }
});
