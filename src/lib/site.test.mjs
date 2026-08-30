import { test } from "node:test";
import assert from "node:assert/strict";

import { SITE, absoluteUrl, canonicalPath, pageTitle } from "./site.mjs";

// ---------------------------------------------------------------------------
// pageTitle
// ---------------------------------------------------------------------------

test("a page title is the page, an em dash, then the site", () => {
  // The separator is U+2014, matching what the live pages already carry. A hyphen
  // or an en dash here is a silent change to every title and every og:title.
  assert.equal(pageTitle("Essays"), "Essays — Alex Barclay");
});

test("the front page is the site title alone", () => {
  assert.equal(pageTitle(), "Alex Barclay");
  assert.equal(pageTitle(undefined), "Alex Barclay");
});

// ---------------------------------------------------------------------------
// canonicalPath
//
// Astro's directory build format hands every path a trailing slash. The live
// pages carry one only on the writing root, because the React site built its
// canonicals as BASE_PATH + route. Reproducing that exactly is the point: a
// canonical that disagrees with the indexed one splits a page's ranking signals
// across two URLs.
// ---------------------------------------------------------------------------

test("the writing root keeps its trailing slash", () => {
  assert.equal(canonicalPath("/writing/"), "/writing/");
});

test("the domain root keeps its trailing slash", () => {
  // The treatise lives here. Stripping this one yields "", not a URL.
  assert.equal(canonicalPath("/"), "/");
});

test("a section drops its trailing slash", () => {
  assert.equal(canonicalPath("/writing/blog/"), "/writing/blog");
});

test("a nested page drops its trailing slash", () => {
  assert.equal(canonicalPath("/writing/eidos/architecture/"), "/writing/eidos/architecture");
});

test("a path that already lacks a slash is unchanged", () => {
  assert.equal(canonicalPath("/writing/blog"), "/writing/blog");
});

test("canonicalPath is idempotent", () => {
  for (const p of ["/writing/", "/writing/blog/", "/writing/blog"]) {
    assert.equal(canonicalPath(canonicalPath(p)), canonicalPath(p), p);
  }
});

// ---------------------------------------------------------------------------
// absoluteUrl
// ---------------------------------------------------------------------------

test("an absolute URL is the origin plus the path", () => {
  assert.equal(absoluteUrl("/writing/blog"), "https://alexanderdbarclay.com/writing/blog");
});

test("the origin carries no trailing slash to double up", () => {
  assert.ok(!SITE.origin.endsWith("/"), "origin must not end in a slash");
});

// ---------------------------------------------------------------------------
// The values themselves
// ---------------------------------------------------------------------------

test("the OG image resolves under the writing prefix, where it is published", () => {
  // It lives at public/writing/images/og.png so that this URL keeps working. The
  // treatise is served from the domain root, so a bare /images/og.png would be a
  // different file in a different place.
  assert.equal(SITE.image, "/writing/images/og.png");
  assert.equal(
    absoluteUrl(SITE.image),
    "https://alexanderdbarclay.com/writing/images/og.png",
  );
});

test("the feed is advertised at the path readers already subscribe to", () => {
  assert.equal(absoluteUrl(SITE.feed), "https://alexanderdbarclay.com/writing/rss.xml");
});
