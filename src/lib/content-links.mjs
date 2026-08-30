// The essays live under src/pages/writing/, so their URLs carry a /writing
// prefix that the directory structure supplies rather than a config value. Content
// authored against the old site writes root-relative links without it — `/eidos`
// resolves to the treatise root and 404s. This restores the prefix at build time
// so authors keep writing `/eidos` and the directory keeps deciding what that means.

/** The directory under src/pages/ that the essays are served from. */
export const WRITING_PREFIX = "/writing";

/**
 * Prefix a root-relative URL with the writing directory. Anything else — absolute,
 * protocol-relative, scheme-bearing, fragment-only, or already prefixed — is returned
 * untouched.
 *
 * @param {string} url
 * @returns {string}
 */
export function prefixUrl(url) {
  // `//host/path` is protocol-relative, not root-relative.
  if (!url.startsWith("/") || url.startsWith("//")) return url;

  // Already prefixed. The boundary check keeps `/writingish` from counting.
  const rest = url.slice(WRITING_PREFIX.length);
  if (url.startsWith(WRITING_PREFIX) && (rest === "" || "/?#".includes(rest[0]))) {
    return url;
  }

  return WRITING_PREFIX + url;
}

/**
 * Rewrite every URL in an mdast tree in place. Keyed on the presence of a `url`
 * property rather than on node type, so links, images, and reference definitions
 * are all covered without enumerating them.
 *
 * @param {object} tree
 */
export function rewriteLinks(tree) {
  if (typeof tree.url === "string") tree.url = prefixUrl(tree.url);

  for (const child of tree.children ?? []) rewriteLinks(child);
}

/** remark plugin entry point. */
export default function remarkContentLinks() {
  return rewriteLinks;
}
