// Essays live at /writing/<slug>, sharing a namespace with the static pages under
// src/pages/writing/. Astro resolves static routes before dynamic ones, so an
// essay whose slug matches one of them builds cleanly and is unreachable — a
// silent unpublish. This turns that into a build failure.
//
// Adding a static page under src/pages/writing/ means adding its name here.

/** Names a dynamic essay slug may not take. */
export const RESERVED_SLUGS = new Set([
  "about",
  "eidos",
  "projects",
  "essays",
  "category",
  "rss.xml",
  "sitemap.xml",
]);

/**
 * @param {string[]} slugs
 * @throws if any slug would be shadowed by a static route
 */
export function assertNoReservedSlugs(slugs) {
  const clashes = slugs.filter((s) => RESERVED_SLUGS.has(s));
  if (clashes.length === 0) return;

  throw new Error(
    `Reserved slug(s) would be unreachable at /writing/: ${clashes.join(", ")}. ` +
      `A static route under src/pages/writing/ already claims that path. ` +
      `Rename the content file, or the essay will build and never be readable.`,
  );
}
