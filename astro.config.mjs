import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// `site` is required for @astrojs/sitemap and @astrojs/rss to emit absolute URLs.
// `base` deliberately stays "/" — it applies site-wide, so pointing it at /writing
// would move the treatise too. The essays take their prefix from living under
// src/pages/writing/ instead.
export default defineConfig({
  site: "https://alexanderdbarclay.com",
  output: "static",
  integrations: [react(), sitemap()],
});
