import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import remarkContentLinks from "./src/lib/content-links.mjs";

// `site` is required for @astrojs/sitemap and @astrojs/rss to emit absolute URLs.
// `base` deliberately stays "/" — it applies site-wide, so pointing it at /writing
// would move the treatise too. The essays take their prefix from living under
// src/pages/writing/ instead.
export default defineConfig({
  site: "https://alexanderdbarclay.com",
  output: "static",
  integrations: [react(), sitemap()],
  markdown: {
    // Content authored for the old site writes root-relative links like `/eidos`,
    // which now resolve to the treatise root. This restores the /writing prefix
    // that the src/pages/writing/ directory supplies.
    remarkPlugins: [remarkContentLinks],
  },
});
