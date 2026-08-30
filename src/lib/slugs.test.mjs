// These rules decide every published URL. The cases below are not hypothetical:
// each real filename is asserted against the slug that is already live and already
// referenced from claims.yaml, so a regression here fails the build rather than
// quietly breaking links that exist in the world.
import { test } from "node:test";
import assert from "node:assert/strict";
import { stripDate, stripOrder } from "./slugs.mjs";

test("strips a date prefix from the live blog filenames", () => {
  assert.equal(
    stripDate("2026-08-10-eidos-an-architecture-for-cheap-code.md"),
    "eidos-an-architecture-for-cheap-code"
  );
  assert.equal(stripDate("2026-02-27-hello-world.md"), "hello-world");
  assert.equal(stripDate("2026-08-27-the-price-of-the-ticket.md"), "the-price-of-the-ticket");
  assert.equal(stripDate("2026-08-28-the-ladder-problem.md"), "the-ladder-problem");
});

test("strips a date prefix from the live project filename", () => {
  assert.equal(stripDate("2026-01-15-portfolio-site.md"), "portfolio-site");
});

test("strips an order prefix from the live eidos filenames", () => {
  assert.equal(stripOrder("01-architecture.md"), "architecture");
  assert.equal(stripOrder("02-adoption.md"), "adoption");
  assert.equal(stripOrder("03-form-template.md"), "form-template");
  assert.equal(stripOrder("04-infrastructure.md"), "infrastructure");
});

test("leaves a filename without the relevant prefix alone", () => {
  assert.equal(stripDate("about.md"), "about");
  assert.equal(stripOrder("about.md"), "about");
});

test("strips only the leading prefix, not dates or numbers inside the name", () => {
  assert.equal(stripDate("2026-01-15-report-2025-04-01.md"), "report-2025-04-01");
  assert.equal(stripOrder("01-form-2-template.md"), "form-2-template");
});

test("a partial or malformed date prefix is not stripped", () => {
  assert.equal(stripDate("2026-8-10-short-month.md"), "2026-8-10-short-month");
  assert.equal(stripDate("not-a-date-prefix.md"), "not-a-date-prefix");
});
