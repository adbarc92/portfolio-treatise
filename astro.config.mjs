import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import remarkContentLinks from "./src/lib/content-links.mjs";
import { canonicalPath } from "./src/lib/site.mjs";

// `site` is required for @astrojs/sitemap and @astrojs/rss to emit absolute URLs.
// `base` deliberately stays "/" — it applies site-wide, so pointing it at /writing
// would move the treatise too. The essays take their prefix from living under
// src/pages/writing/ instead.
export default defineConfig({
  site: "https://alexanderdbarclay.com",
  output: "static",
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
  },
});
