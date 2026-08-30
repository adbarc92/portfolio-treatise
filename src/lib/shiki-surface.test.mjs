import { test } from "node:test";
import assert from "node:assert/strict";

import { siteSurface, stripBackground } from "./shiki-surface.mjs";

const SHIKI_STYLE = "background-color:#24292e;color:#e1e4e8; overflow-x: auto;";

test("the inline background is removed", () => {
  assert.ok(!stripBackground(SHIKI_STYLE).includes("background-color"));
});

test("the foreground colour survives, because the token theme is kept", () => {
  assert.match(stripBackground(SHIKI_STYLE), /color:#e1e4e8/);
});

test("unrelated declarations survive", () => {
  assert.match(stripBackground(SHIKI_STYLE), /overflow-x: auto/);
});

test("a style with no background is unchanged", () => {
  assert.equal(stripBackground("color:#fff;"), "color:#fff;");
});

test("an absent style does not become the string 'undefined'", () => {
  assert.equal(stripBackground(undefined), "");
  assert.equal(stripBackground(null), "");
});

test("the transformer edits the pre node's style in place", () => {
  const node = { properties: { style: SHIKI_STYLE, class: "astro-code github-dark" } };

  siteSurface.pre(node);

  assert.ok(!node.properties.style.includes("background-color"));
  assert.match(node.properties.style, /color:#e1e4e8/);
  assert.equal(node.properties.class, "astro-code github-dark", "class is left alone");
});

test("the transformer tolerates a pre node with no style at all", () => {
  const node = { properties: {} };
  siteSurface.pre(node);
  assert.equal(node.properties.style, "");
});
