// Slug rules for the content collections, kept in a plain module so they can be
// tested without booting Astro. These are preserved verbatim from the site the
// collections replace: changing either one changes every published URL, including
// ones already posted publicly and recorded in claims.yaml.

/**
 * `2026-08-10-eidos-an-architecture-for-cheap-code.md` -> `eidos-an-architecture-for-cheap-code`
 * @param {string} entry filename relative to the collection base
 * @returns {string}
 */
export const stripDate = (entry) =>
  entry.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");

/**
 * `01-architecture.md` -> `architecture`
 * @param {string} entry filename relative to the collection base
 * @returns {string}
 */
export const stripOrder = (entry) => entry.replace(/\.md$/, "").replace(/^\d+-/, "");
