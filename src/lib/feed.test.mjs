import { test } from "node:test";
import assert from "node:assert/strict";

import { HISTORICAL_PREFIX, escapeXml, feedItem, rfc822 } from "./feed.mjs";

const post = (id, over = {}) => ({
  id,
  data: {
    title: "Hello World",
    excerpt: "The first post on my new portfolio site.",
    date: new Date("2026-02-27"),
    ...over,
  },
});

test("the guid is the historical /writing/blog URL, not the new one", () => {
  // Subscribers already hold this string. Changing it republishes the post.
  const item = feedItem(post("hello-world"));
  assert.equal(item.guid, "https://alexanderdbarclay.com/writing/blog/hello-world");
});

test("the guid is declared not to be a permalink", () => {
  assert.equal(feedItem(post("hello-world")).isPermaLink, false);
});

test("the link points at the new location", () => {
  assert.equal(feedItem(post("hello-world")).link, "https://alexanderdbarclay.com/writing/hello-world");
});

test("guid and link differ, which is the whole point", () => {
  const item = feedItem(post("hello-world"));
  assert.notEqual(item.guid, item.link);
});

test("the historical prefix is frozen", () => {
  // If this constant ever changes, every guid changes with it.
  assert.equal(HISTORICAL_PREFIX, "https://alexanderdbarclay.com/writing/blog");
});

test("dates are RFC-822 in GMT, matching the live feed", () => {
  assert.equal(rfc822(new Date("2026-02-27")), "Fri, 27 Feb 2026 00:00:00 GMT");
  assert.equal(rfc822(new Date("2026-08-10")), "Mon, 10 Aug 2026 00:00:00 GMT");
});

test("XML escaping covers the five predefined entities", () => {
  assert.equal(escapeXml(`&<>"'`), "&amp;&lt;&gt;&quot;&apos;");
});

test("escaping an ampersand happens once, not twice", () => {
  assert.equal(escapeXml("Tom & Jerry"), "Tom &amp; Jerry");
  assert.equal(escapeXml("a &amp; b"), "a &amp;amp; b");
});

test("ordinary prose is untouched", () => {
  assert.equal(escapeXml("plain words"), "plain words");
});

test("a title with markup cannot break out of its element", () => {
  const item = feedItem(post("x", { title: `A <script> & "quotes"` }));
  assert.ok(!item.title.includes("<script>"));
  assert.match(item.title, /&lt;script&gt;/);
});
