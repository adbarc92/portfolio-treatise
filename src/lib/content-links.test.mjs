import { test } from "node:test";
import assert from "node:assert/strict";

import { prefixUrl, rewriteLinks } from "./content-links.mjs";

test("prefixes a root-relative link with the writing directory", () => {
  assert.equal(prefixUrl("/eidos"), "/writing/eidos");
});

test("prefixes a nested root-relative link", () => {
  assert.equal(prefixUrl("/eidos/form-template"), "/writing/eidos/form-template");
});

test("leaves an absolute URL alone", () => {
  assert.equal(prefixUrl("https://example.com/eidos"), "https://example.com/eidos");
});

test("leaves a protocol-relative URL alone", () => {
  // `//cdn.example.com/x` starts with a slash but is not root-relative.
  assert.equal(prefixUrl("//cdn.example.com/x"), "//cdn.example.com/x");
});

test("leaves a mailto link alone", () => {
  assert.equal(prefixUrl("mailto:alex@example.com"), "mailto:alex@example.com");
});

test("leaves a bare fragment alone", () => {
  assert.equal(prefixUrl("#the-argument"), "#the-argument");
});

test("leaves a relative link alone", () => {
  assert.equal(prefixUrl("form-template"), "form-template");
});

test("does not prefix a link that is already under the writing directory", () => {
  // Guards the double-prefix that turns /writing/blog/x into /writing/writing/blog/x.
  assert.equal(prefixUrl("/writing/blog/hello-world"), "/writing/blog/hello-world");
});

test("does not treat /writingish as already prefixed", () => {
  assert.equal(prefixUrl("/writingish"), "/writing/writingish");
});

test("keeps the query and fragment on a rewritten link", () => {
  assert.equal(prefixUrl("/blog?tag=eidos#top"), "/writing/blog?tag=eidos#top");
});

test("rewrites links nested anywhere in the tree", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "link", url: "/eidos", children: [{ type: "text", value: "Eidos" }] },
          { type: "text", value: " and " },
          { type: "link", url: "https://example.com", children: [] },
        ],
      },
    ],
  };

  rewriteLinks(tree);

  assert.equal(tree.children[0].children[0].url, "/writing/eidos");
  assert.equal(tree.children[0].children[2].url, "https://example.com");
});

test("rewrites any node carrying a url, not just inline links", () => {
  // Covers `image` and `definition` without naming them: reference-style links
  // and root-relative images 404 just as loudly as inline ones.
  const tree = {
    type: "root",
    children: [
      { type: "image", url: "/images/plate.png", children: [] },
      { type: "definition", identifier: "spec", url: "/eidos/infrastructure" },
    ],
  };

  rewriteLinks(tree);

  assert.equal(tree.children[0].url, "/writing/images/plate.png");
  assert.equal(tree.children[1].url, "/writing/eidos/infrastructure");
});

test("leaves a tree with no urls untouched", () => {
  const tree = { type: "root", children: [{ type: "text", value: "plain" }] };

  rewriteLinks(tree);

  assert.deepEqual(tree, { type: "root", children: [{ type: "text", value: "plain" }] });
});
