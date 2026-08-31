import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

import { isPublished } from "../../lib/drafts.mjs";
import { feedItem } from "../../lib/feed.mjs";
import { SITE, absoluteUrl } from "../../lib/site.mjs";

// Built by hand rather than with @astrojs/rss, which cannot pin a guid.
// See src/lib/feed.mjs for why that matters.
export const GET: APIRoute = async () => {
  // Drafts never reach a build, and least of all a feed, which cannot be unsent.
  const posts = (await getCollection("blog", ({ data }) => isPublished(data, false))).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  const items = posts
    .map(feedItem)
    .map(
      (i) =>
        `    <item>\n` +
        `      <title>${i.title}</title>\n` +
        `      <link>${i.link}</link>\n` +
        `      <guid isPermaLink="false">${i.guid}</guid>\n` +
        `      <pubDate>${i.pubDate}</pubDate>\n` +
        `      <description>${i.description}</description>\n` +
        `    </item>`,
    )
    .join("\n");

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
    `  <channel>\n` +
    `    <title>${SITE.title}</title>\n` +
    `    <link>${absoluteUrl("/writing/")}</link>\n` +
    `    <description>${SITE.description}</description>\n` +
    `    <language>en</language>\n` +
    `    <atom:link href="${absoluteUrl(SITE.feed)}" rel="self" type="application/rss+xml" />\n` +
    `${items}\n` +
    `  </channel>\n` +
    `</rss>\n`;

  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
