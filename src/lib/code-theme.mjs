// A Shiki theme built only from design-system tokens, per DESIGN-SYSTEM §2.14.
//
// The treatise renders no code at all, so the system had no rule for <pre> until
// the essays arrived carrying three code blocks. They had been shipping in
// Shiki's github-dark, which is a foreign object on bone-over-lampblack.
//
// Three values, and no more. Distinction beyond them comes from weight, not hue.
// Brass is deliberately absent: it means "proven claim", and a syntax
// highlighter has no claims to prove.

/** The only colours a code block may use. Values mirror :root in foundation.css. */
export const TOKEN_COLOURS = {
  ground: "#151110", // --ink-ground
  code: "#E3D9C6", // --bone
  comment: "#8F8574", // --bone-muted
  keyword: "#8C3B32", // --oxblood
};

export const plateTheme = {
  name: "plate",
  type: "dark",
  colors: {
    "editor.foreground": TOKEN_COLOURS.code,
    "editor.background": TOKEN_COLOURS.ground,
  },
  settings: [
    { settings: { foreground: TOKEN_COLOURS.code, background: TOKEN_COLOURS.ground } },
    {
      scope: ["comment", "punctuation", "punctuation.definition", "meta.separator"],
      settings: { foreground: TOKEN_COLOURS.comment },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "storage",
        "storage.type",
        "constant.language",
        "entity.name.tag",
        "markup.heading",
      ],
      settings: { foreground: TOKEN_COLOURS.keyword, fontStyle: "bold" },
    },
  ],
};
