import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

import { isPublished } from "../../lib/drafts.mjs";
import { SITE, absoluteUrl } from "../../lib/site.mjs";

// The feed keeps its path, its channel metadata, and its item URLs. People are
// already subscribed to it, and a guid that changes republishes every old post
// into their reader as though it were new.
//
// `<link>` points at /writing/blog rather than the feed's own directory, matching
// the feed that is live.
export const GET: APIRoute = async () => {
  // Drafts never reach a build, and least of all a feed, which cannot be unsent.
  const posts = (await getCollection("blog", ({ data }) => isPublished(data, false))).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: SITE.title,
    description: SITE.description,
    // `site` becomes the channel's <link>, which the live feed points at the
    // essays index rather than the domain root. Item links are root-relative and
    // so resolve against the origin regardless of what this path is.
    site: absoluteUrl("/writing/blog"),
    // Astro would otherwise append a trailing slash to every item link, which
    // changes the guid — and a changed guid republishes every old post into a
    // subscriber's reader as though it were new.
    trailingSlash: false,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: [
      "<language>en</language>",
      `<atom:link href="${absoluteUrl(SITE.feed)}" rel="self" type="application/rss+xml" />`,
    ].join(""),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date,
      link: `/writing/blog/${post.id}`,
    })),
  });
};
