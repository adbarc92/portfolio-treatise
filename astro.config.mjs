import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import remarkContentLinks from "./src/lib/content-links.mjs";
import { canonicalPath } from "./src/lib/site.mjs";
import { plateTheme } from "./src/lib/code-theme.mjs";

// `site` is required for @astrojs/sitemap and @astrojs/rss to emit absolute URLs.
// `base` deliberately stays "/" — it applies site-wide, so pointing it at /writing
// would move the treatise too. The essays take their prefix from living under
// src/pages/writing/ instead.
export default defineConfig({
  site: "https://alexanderdbarclay.com",
  output: "static",
  // GitHub Pages serves static files only — no server-side 301 is possible here.
  // Astro emits an HTML page carrying a meta refresh and a canonical link, which
  // search engines treat as a soft redirect. That is the best this host allows,
  // and it is why /blog was retired rather than merely restyled.
  redirects: {
    "/writing/blog": "/writing/",
    "/writing/blog/[slug]": "/writing/[slug]",
  },
  integrations: [
    react(),
    sitemap({
      // The build emits directory URLs, so every entry would carry a trailing
      // slash the pages' own canonical tags do not. Pointing a sitemap at URLs
      // that redirect to the canonical form is a contradiction worth not
      // shipping; the same rule decides both.
      serialize: (entry) => ({
        ...entry,
        url: new URL(canonicalPath(new URL(entry.url).pathname), entry.url).href,
      }),
    }),
  ],
  markdown: {
    // Content authored for the old site writes root-relative links like `/eidos`,
    // which now resolve to the treatise root. This restores the /writing prefix
    // that the src/pages/writing/ directory supplies.
    remarkPlugins: [remarkContentLinks],
    shikiConfig: {
      // A theme from our own tokens (DESIGN-SYSTEM §2.14). This supersedes the
      // transformer that used to strip github-dark's inlined background: with
      // our own ground there is nothing foreign left to strip.
      theme: plateTheme,
    },
  },
});
