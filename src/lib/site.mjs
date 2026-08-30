// Metadata shared by the writing pages, the feed, and the sitemap.
//
// The React site kept these in src/lib/site.ts because its prerender and its
// components both needed them and React 19 would silently emit a second,
// conflicting <meta> if the two copies drifted. Astro has no such hazard, but the
// single source is still worth keeping: these strings are what search engines and
// link unfurlers have already indexed.

export const SITE = {
  origin: "https://alexanderdbarclay.com",
  title: "Alex Barclay",
  author: "Alex Barclay",
  description:
    "Software engineering, machine learning, and robotics — essays, projects, and the Eidos architecture.",
  /** Published from public/writing/images/, so the live URL keeps resolving. */
  image: "/writing/images/og.png",
  feed: "/writing/rss.xml",
};

/** Descriptions for the pages whose text is not drawn from content frontmatter. */
export const DESCRIPTIONS = {
  blog: "Essays on software, fiction, and whatever else holds still long enough.",
  projects: "Selected work across software engineering, machine learning, and robotics.",
  eidos:
    "An architecture for cheap code: humans design the Forms, agents fill them, fitness functions verify the fit.",
};

/**
 * `Essays` -> `Essays — Alex Barclay`. The separator is an em dash, matching every
 * title already indexed.
 *
 * @param {string} [page]
 * @returns {string}
 */
export function pageTitle(page) {
  return page ? `${page} — ${SITE.title}` : SITE.title;
}

/**
 * The canonical form of a route's path.
 *
 * Astro's directory build format gives every path a trailing slash. The live pages
 * carry one only on the writing root, because the React site composed its
 * canonicals as `BASE_PATH + route` and the root route was `/`. That asymmetry is
 * an artefact, but it is the indexed artefact, and a canonical that disagrees with
 * the indexed URL splits a page's ranking signals in two.
 *
 * @param {string} pathname
 * @returns {string}
 */
export function canonicalPath(pathname) {
  // The two roots keep their slash: "/" is the treatise and stripping it leaves
  // no URL at all, and "/writing/" is what the essays' front page has indexed.
  if (ROOTS.has(pathname)) return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

const ROOTS = new Set(["/", "/writing/"]);

/**
 * @param {string} path root-relative
 * @returns {string}
 */
export function absoluteUrl(path) {
  return `${SITE.origin}${path}`;
}
