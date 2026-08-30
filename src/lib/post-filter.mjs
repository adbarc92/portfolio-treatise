// The blog index's filtering, kept out of the React island so it can be tested
// without a DOM. The island owns the URL and the rendering; this owns the rules.

/**
 * The category set is closed on purpose. An open one drifts until `politics` and
 * `political` both exist and a filter silently splits in two.
 *
 * The ids are duplicated from the Zod enum in content.config.ts rather than
 * imported, because that file imports `astro:content` and cannot be loaded outside
 * a build. post-filter.test.mjs reads the enum out of the config's source and
 * fails if the two ever disagree, which is the guard the duplication needs.
 */
export const CATEGORY_LABELS = {
  software: "Software",
  fiction: "Fiction",
  politics: "Politics",
  meta: "Meta",
};

export const CATEGORY_IDS = Object.keys(CATEGORY_LABELS);

/**
 * Validate a category coming off the URL. Anything unrecognised becomes null and
 * is therefore ignored, rather than filtering the page down to nothing.
 *
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function asCategory(value) {
  return CATEGORY_IDS.includes(value) ? value : null;
}

/**
 * The query string that selecting `category` should leave in the address bar.
 *
 * Returns "" rather than "?" when nothing is left, because a bare question mark
 * is a different URL to share and to cache for the same page. Parameters the
 * filter does not own — a tag, a campaign tag — are carried through untouched.
 *
 * @param {string} search current `location.search`, with or without the "?"
 * @param {string | null} category
 * @returns {string} e.g. "?tag=eidos&category=software", or ""
 */
export function nextSearch(search, category) {
  const params = new URLSearchParams(search);

  if (category) params.set("category", category);
  else params.delete("category");

  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * Apply the tag and category filters.
 *
 * The tag narrows the pool that the chips describe, so a chip's number always
 * matches what clicking it would actually show. The category then narrows what is
 * visible without touching those numbers — a selected chip still reports how many
 * posts it stands for.
 *
 * @param {{ category: string, tags: string[] }[]} posts
 * @param {{ tag?: string | null, category?: string | null }} filters
 * @returns {{ pool: object[], visible: object[], counts: Record<string, number> }}
 */
export function selectPosts(posts, { tag = null, category = null } = {}) {
  const pool = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

  const counts = {};
  for (const p of pool) counts[p.category] = (counts[p.category] ?? 0) + 1;

  const active = asCategory(category);
  const visible = active ? pool.filter((p) => p.category === active) : pool;

  return { pool, visible, counts };
}
