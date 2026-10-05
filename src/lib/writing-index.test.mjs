import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  KINDS,
  countByCategory,
  countByKind,
  toEntries,
} from "./writing-index.mjs";

const posts = [
  { id: "a", data: { title: "A", excerpt: "ex-a", date: new Date("2026-08-10"), category: "software" } },
  { id: "b", data: { title: "B", excerpt: "ex-b", date: new Date("2026-02-27"), category: "meta" } },
];
const docs = [
  { id: "architecture", data: { title: "Arch", summary: "sum", order: 1, version: "0.1" } },
];
const projects = [
  { id: "p", data: { title: "P", description: "desc", date: new Date("2026-01-15") } },
];

test("every kind becomes an entry with a uniform shape", () => {
  const entries = toEntries({ posts, docs, projects });
  assert.equal(entries.length, 4);
  for (const e of entries) {
    assert.ok(e.title && e.href && e.blurb && e.kind, `incomplete entry: ${JSON.stringify(e)}`);
  }
});

test("each kind gets its own URL shape", () => {
  const by = Object.fromEntries(toEntries({ posts, docs, projects }).map((e) => [e.title, e.href]));
  assert.equal(by.A, "/writing/a");
  assert.equal(by.Arch, "/writing/eidos/architecture");
  assert.equal(by.P, "/writing/projects/p");
});

test("the blurb comes from whichever field that kind carries", () => {
  const by = Object.fromEntries(toEntries({ posts, docs, projects }).map((e) => [e.title, e.blurb]));
  assert.equal(by.A, "ex-a");        // excerpt
  assert.equal(by.Arch, "sum");      // summary
  assert.equal(by.P, "desc");        // description
});

test("entries are newest first across all kinds", () => {
  const dates = toEntries({ posts, docs, projects }).map((e) => e.date.valueOf());
  assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
});

test("the specification reads in its own order, beneath everything dated", () => {
  // The documents carry no date, so their place in a newest-first list is decided
  // by `order` alone. Given shuffled, they must still come out 01 to 04.
  const spec = [3, 1, 4, 2].map((order) => ({
    id: `doc-${order}`,
    data: { title: `Doc ${order}`, summary: "sum", order, version: "0.1" },
  }));
  const entries = toEntries({ posts, docs: spec, projects });

  const specTitles = entries.filter((e) => e.kind === "specification").map((e) => e.title);
  assert.deepEqual(specTitles, ["Doc 1", "Doc 2", "Doc 3", "Doc 4"]);

  const firstSpec = entries.findIndex((e) => e.kind === "specification");
  assert.ok(
    entries.slice(firstSpec).every((e) => e.kind === "specification"),
    "a dated entry sorted beneath the specification",
  );
});

test("kind counts describe what is present", () => {
  assert.deepEqual(countByKind(toEntries({ posts, docs, projects })), {
    essay: 2,
    specification: 1,
    project: 1,
  });
});

test("category counts cover essays only", () => {
  // Specifications and projects have no category; counting them would invent one.
  assert.deepEqual(countByCategory(toEntries({ posts, docs, projects })), {
    software: 1,
    meta: 1,
  });
});

test("an absent kind gets no count, so no empty chip is advertised", () => {
  const counts = countByKind(toEntries({ posts, docs: [], projects: [] }));
  assert.ok(!("specification" in counts));
});

test("the kind list is closed", () => {
  assert.deepEqual([...KINDS], ["essay", "specification", "project"]);
});

test("toEntries does not mutate its inputs", () => {
  const snapshot = structuredClone({ posts, docs, projects });
  toEntries({ posts, docs, projects });
  assert.deepEqual({ posts, docs, projects }, snapshot);
});

test("the label map covers exactly the categories the schema accepts", () => {
  // The Zod enum in content.config.ts decides what may be authored; this map
  // decides what a chip can say. An id in one and not the other is how a filter
  // silently splits in two, so the two are compared rather than trusted.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const config = readFileSync(path.join(here, "..", "content.config.ts"), "utf8");
  const literal = config.match(/CATEGORIES\s*=\s*\[([^\]]*)\]/);
  assert.ok(literal, "could not find the CATEGORIES literal in content.config.ts");

  const schemaIds = [...literal[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...CATEGORY_IDS].sort(), schemaIds.sort());
  for (const id of CATEGORY_IDS) assert.ok(CATEGORY_LABELS[id], `category "${id}" has no label`);
});
