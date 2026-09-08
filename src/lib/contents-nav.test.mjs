import { test } from "node:test";
import assert from "node:assert/strict";

import { readFileSync } from "node:fs";

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

test("the writing entry is named for its destination, not for the essays alone", () => {
  // DESIGN-SYSTEM §2.10. /writing/ lists essays, the specification and the
  // projects; labelling it "Essays" advertised a third of what it reaches, and
  // the projects were unreachable from the root by any other link.
  const nav = readFileSync(new URL("../components/ContentsNav.astro", import.meta.url), "utf8");
  assert.match(nav, /id: "essays", label: "Writing"/);
  assert.doesNotMatch(nav, /id: "essays", label: "Essays"/);
});

test("the root's section list numbers the same sections as the nav", () => {
  // Two copies of sectionList exist — one per file — and a divergence silently
  // renumbers the page against its own nav.
  const nav = readFileSync(new URL("../components/ContentsNav.astro", import.meta.url), "utf8");
  const root = readFileSync(new URL("../pages/index.astro", import.meta.url), "utf8");
  const ids = (src) => [...src.matchAll(/\{ id: "(\w+)", label:/g)].map((m) => m[1]);
  assert.deepEqual(ids(nav), ids(root));
});
