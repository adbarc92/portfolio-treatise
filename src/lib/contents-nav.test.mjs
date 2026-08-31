import { test } from "node:test";
import assert from "node:assert/strict";

import { ESSAYS_SECTION, sectionHref } from "./contents-nav.mjs";

test("a treatise section is an anchor on the root", () => {
  assert.equal(sectionHref("plates", true), "#plates");
});

test("a treatise section is root-relative anywhere else", () => {
  assert.equal(sectionHref("plates", false), "/#plates");
});

test("the essays section points at its own page, not an anchor", () => {
  // DESIGN-SYSTEM §2.10. The essays live under /writing/, not in a section of
  // the root, so an anchor would land a reader on the treatise instead.
  assert.equal(sectionHref(ESSAYS_SECTION, false), "/writing/");
});

test("the essays section points at its own page from the root too", () => {
  // Same destination either way: there is one Essays page and this is it.
  assert.equal(sectionHref(ESSAYS_SECTION, true), "/writing/");
});

test("the colophon stays an anchor, since it lives on the root", () => {
  assert.equal(sectionHref("colophon", false), "/#colophon");
  assert.equal(sectionHref("colophon", true), "#colophon");
});
