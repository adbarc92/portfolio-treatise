import { test } from "node:test";
import assert from "node:assert/strict";

import { TOKEN_COLOURS, plateTheme } from "./code-theme.mjs";

const BRASS = "#a9884c";
const GROUND = "#151110";

function contrast(hex, other) {
  const lin = (c) => {
    c = parseInt(c, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = (h) =>
    0.2126 * lin(h.slice(1, 3)) + 0.7152 * lin(h.slice(3, 5)) + 0.0722 * lin(h.slice(5, 7));
  const [hi, lo] = [lum(hex), lum(other)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

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

test("the theme uses only the permitted token values", () => {
  // DESIGN-SYSTEM §2.14: bone for code, bone-muted for comments and
  // punctuation. Nothing else — keywords are bone, distinguished by weight.
  const permitted = new Set(Object.values(TOKEN_COLOURS).map((c) => c.toLowerCase()));
  for (const colour of coloursIn(plateTheme)) {
    assert.ok(permitted.has(colour), `${colour} is not a permitted token value`);
  }
});

test("brass never appears — a highlighter has no claims to prove", () => {
  assert.ok(!coloursIn(plateTheme).includes(BRASS), "--verify must not be used decoratively");
});

test("every declared token is actually used", () => {
  const used = new Set(coloursIn(plateTheme));
  for (const [role, colour] of Object.entries(TOKEN_COLOURS)) {
    assert.ok(used.has(colour.toLowerCase()), `${role} is declared but unused`);
  }
});

test("every colour the theme paints text with clears the contrast floor", () => {
  // DESIGN-SYSTEM §4: muted text >= 4.5:1 against the ground. Code blocks render
  // at 0.72rem, so this is the floor that matters, not a nicety. Oxblood was the
  // original choice for keywords and measures 2.49:1 — hence weight, not hue.
  for (const [role, colour] of Object.entries(TOKEN_COLOURS)) {
    if (role === "ground") continue;
    const ratio = contrast(colour, GROUND);
    assert.ok(ratio >= 4.5, `${role} (${colour}) is ${ratio.toFixed(2)}:1, below 4.5:1`);
  }
});

test("keywords are distinguished by weight, not by a hue that fails the floor", () => {
  const keywordRule = plateTheme.settings.find((s) => s.scope?.includes("keyword"));
  assert.equal(keywordRule.settings.fontStyle, "bold");
  assert.equal(keywordRule.settings.foreground, TOKEN_COLOURS.code);
});

test("the theme names itself and declares its type", () => {
  assert.equal(plateTheme.name, "plate");
  assert.equal(plateTheme.type, "dark");
});
