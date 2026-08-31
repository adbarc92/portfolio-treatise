import { test } from "node:test";
import assert from "node:assert/strict";

import { TOKEN_COLOURS, plateTheme } from "./code-theme.mjs";

const BRASS = "#a9884c";

/** Every colour value anywhere in the theme, lowercased. */
function coloursIn(theme) {
  const found = [];
  const walk = (v) => {
    if (typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v)) found.push(v.toLowerCase());
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(theme);
  return found;
}

test("the theme uses only the three permitted token values", () => {
  // DESIGN-SYSTEM §2.14: bone for code, bone-muted for comments and
  // punctuation, oxblood for keywords. Nothing else.
  const permitted = new Set(Object.values(TOKEN_COLOURS).map((c) => c.toLowerCase()));
  for (const colour of coloursIn(plateTheme)) {
    assert.ok(permitted.has(colour), `${colour} is not a permitted token value`);
  }
});

test("brass never appears — a highlighter has no claims to prove", () => {
  assert.ok(!coloursIn(plateTheme).includes(BRASS), "--verify must not be used decoratively");
});

test("the three roles are all present", () => {
  const used = new Set(coloursIn(plateTheme));
  for (const [role, colour] of Object.entries(TOKEN_COLOURS)) {
    assert.ok(used.has(colour.toLowerCase()), `${role} is declared but unused`);
  }
});

test("comments and keywords are distinguishable from code", () => {
  assert.notEqual(TOKEN_COLOURS.code, TOKEN_COLOURS.comment);
  assert.notEqual(TOKEN_COLOURS.code, TOKEN_COLOURS.keyword);
});

test("the theme names itself and declares its type", () => {
  assert.equal(plateTheme.name, "plate");
  assert.equal(plateTheme.type, "dark");
});
