import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

import { isPublished } from "../../lib/drafts.mjs";
import { absoluteUrl } from "../../lib/site.mjs";
import { countByCategory, toEntries } from "../../lib/writing-index.mjs";

// @astrojs/sitemap emits a site-wide index at the domain root, which after the
// consolidation finally covers the treatise and the essays together — something
// neither half could do while they were separate builds.
//
// This file is the other half of that: /writing/sitemap.xml is a URL search
// engines have already fetched, and it is named in the cutover checklist. It
// keeps its exact shape and its exact contents rather than 404ing in favour of
// the newer one.
export const GET: APIRoute = async () => {
  const [posts, projects, eidos] = await Promise.all([
    getCollection("blog", ({ data }) => isPublished(data, false)),
    getCollection("projects"),
    getCollection("eidos"),
  ]);

  // The filtered views are prerendered pages with their own titles and
  // canonicals, so they belong here; the categories are derived rather than
  // listed, which keeps this in step with the chips the hub actually renders.
  const categories = Object.keys(countByCategory(toEntries({ posts })));

  // Ordered as the live sitemap orders them: the sections first, then the
  // entries beneath each, so a diff against it stays readable.
  //
  // "/writing/blog" is still listed on purpose. It is now a redirect page, and
  // the design's risk 1 requires those to be live and indexed before the sitemap
  // stops naming the old URLs — otherwise a crawler finds neither. Dropping it is
  // Phase E's job, not this one's.
  const paths = [
    "/writing/",
    "/writing/blog",
    "/writing/projects",
    "/writing/about",
    "/writing/eidos",
    "/writing/essays",
    ...categories.sort().map((id) => `/writing/category/${id}`),
    ...posts
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((p) => `/writing/${p.id}`),
    ...projects
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((p) => `/writing/projects/${p.id}`),
    ...eidos.sort((a, b) => a.data.order - b.data.order).map((d) => `/writing/eidos/${d.id}`),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((p) => `  <url><loc>${absoluteUrl(p)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
