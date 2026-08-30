import { test } from "node:test";
import assert from "node:assert/strict";

import { isPublished } from "./drafts.mjs";

test("a draft is withheld from a build", () => {
  assert.equal(isPublished({ draft: true }, false), false);
});

test("a draft is shown where the caller asks for drafts", () => {
  assert.equal(isPublished({ draft: true }, true), true);
});

test("absent means published", () => {
  assert.equal(isPublished({}, false), true);
});

test("an explicit false means published", () => {
  assert.equal(isPublished({ draft: false }, false), true);
});

test("only an explicit true withholds a post", () => {
  // Guards against a truthiness check letting a string or a number decide
  // whether unfinished prose reaches the public internet.
  assert.equal(isPublished({ draft: "yes" }, false), true);
});
