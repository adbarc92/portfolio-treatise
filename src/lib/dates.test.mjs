// Formatting runs in a deliberately non-UTC zone. Every assertion here is
// vacuous under TZ=UTC, which is exactly the machine the bug hides on: a
// formatter missing `timeZone: "UTC"` looks correct in CI and prints the
// previous day on the author's laptop.
process.env.TZ = "America/Denver";

import { test } from "node:test";
import assert from "node:assert/strict";

import { formatDate } from "./dates.mjs";

test("prints the authored calendar day, not the local one", () => {
  // YAML resolves an unquoted 2026-08-10 to UTC midnight. Denver is UTC-6 in
  // August, so local formatting renders August 9.
  assert.equal(formatDate(new Date("2026-08-10")), "August 10, 2026");
});

test("accepts the date as a string", () => {
  assert.equal(formatDate("2026-08-10"), "August 10, 2026");
});

test("does not roll a New Year's Day date back into the previous year", () => {
  assert.equal(formatDate(new Date("2026-01-01")), "January 1, 2026");
});

test("formats every date the collections actually carry", () => {
  const authored = [
    ["2026-01-15", "January 15, 2026"],
    ["2026-02-27", "February 27, 2026"],
    ["2026-08-10", "August 10, 2026"],
    ["2026-08-27", "August 27, 2026"],
    ["2026-08-28", "August 28, 2026"],
  ];

  for (const [input, expected] of authored) {
    assert.equal(formatDate(new Date(input)), expected, `for ${input}`);
  }
});
