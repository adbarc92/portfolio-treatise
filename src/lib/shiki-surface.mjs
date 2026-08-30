// Shiki writes its theme's page background onto the <pre> as an inline style,
// which beats any stylesheet. The essays' own `pre` rule — a translucent black
// over the page, a hairline border, a radius — then applies everything except the
// background, leaving a GitHub-coloured panel inside a site-coloured frame.
//
// The consolidation accepted the change of syntax highlighter deliberately, so
// the token colours here are Shiki's and stay Shiki's. What it did not accept is
// code blocks that no longer sit on the same surface as the rest of the page.
// Removing one declaration keeps both: Shiki's colours, the site's surface.

/**
 * @param {string | null | undefined} style
 * @returns {string} the style with any background-color declaration removed
 */
export function stripBackground(style) {
  return String(style ?? "").replace(/background-color:[^;]*;?/, "");
}

/** A Shiki transformer. Astro takes these under `markdown.shikiConfig`. */
export const siteSurface = {
  name: "site-surface",
  pre(node) {
    node.properties.style = stripBackground(node.properties.style);
  },
};
