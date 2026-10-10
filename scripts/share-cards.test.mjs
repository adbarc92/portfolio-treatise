// Tests for the share cards. The cards are committed images, so nothing in the
// build notices when one is missing: the page would point its og:image at a 404
// and unfurl with no picture at all. The checks against the real content and the
// real public/ directory are what make a forgotten `npm run cards` fail here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { HEIGHT, WIDTH, cardFile, essayCardHtml, publishedEssays, siteCardHtml } from "./share-cards.mjs";
import { SITE, essayCard } from "../src/lib/site.mjs";

const CSS = ":root{--ink-ground:#151110}";
const FONTS = "file:///fonts/";

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file) {
  const png = readFileSync(file);
  assert.equal(png.toString("latin1", 1, 4), "PNG", `${file} is not a PNG`);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

// ---------------------------------------------------------------------------
// Against the real site
// ---------------------------------------------------------------------------

test("the site's card is on disk at the size an unfurl expects", () => {
  assert.deepEqual(pngSize(cardFile("public", SITE.image)), [WIDTH, HEIGHT]);
});

test("every published essay has its own card on disk", () => {
  const essays = publishedEssays("content/blog");
  assert.ok(essays.length > 0, "no published essays found — the check would pass on nothing");
  for (const { slug } of essays) {
    const file = cardFile("public", essayCard(slug));
    assert.ok(existsSync(file), `${slug} has no share card — run \`npm run cards\``);
    assert.deepEqual(pngSize(file), [WIDTH, HEIGHT], slug);
  }
});

// ---------------------------------------------------------------------------
// publishedEssays
// ---------------------------------------------------------------------------

test("a draft gets no card, and a slug loses its date", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "share-cards-"));
  try {
    writeFileSync(path.join(dir, "2026-01-02-out.md"), '---\ntitle: "Out"\ntagline: "A line."\n---\n\nBody.\n');
    writeFileSync(path.join(dir, "2026-01-03-held.md"), '---\ntitle: "Held"\ndraft: true\n---\n\nBody.\n');
    assert.deepEqual(publishedEssays(dir), [{ slug: "out", title: "Out", tagline: "A line." }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a file without frontmatter is an error, not a card with no title", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "share-cards-"));
  try {
    writeFileSync(path.join(dir, "2026-01-02-bare.md"), "Body only.\n");
    assert.throws(() => publishedEssays(dir), /no frontmatter/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// The card markup
// ---------------------------------------------------------------------------

test("an essay's card carries its title and tagline, escaped", () => {
  const html = essayCardHtml({ title: "Ends & <Means>", tagline: 'The "fit"', foundationCss: CSS, fontsUrl: FONTS });
  assert.match(html, /<h1>Ends &amp; &lt;Means&gt;<\/h1>/);
  assert.match(html, /<p class="abstract muted">The &quot;fit&quot;<\/p>/);
});

test("an essay without a tagline gets a card without the line", () => {
  const html = essayCardHtml({ title: "Plain", foundationCss: CSS, fontsUrl: FONTS });
  assert.ok(!html.includes('class="abstract'), "an empty abstract was rendered");
});

test("the site's card sets the thesis as the root does", () => {
  const html = siteCardHtml({
    thesis: "Easy to build and hard to trust. I work on the second problem.",
    byline: { name: "Alex Barclay", place: "Denver" },
    foundationCss: CSS,
    fontsUrl: FONTS,
  });
  assert.match(html, /I&nbsp;work on the <em>second<\/em> problem\./);
});

test("the cards take their tokens from the stylesheet, and fail without them", () => {
  assert.ok(essayCardHtml({ title: "T", foundationCss: CSS, fontsUrl: FONTS }).includes(CSS));
  assert.throws(() => essayCardHtml({ title: "T", foundationCss: "body{}", fontsUrl: FONTS }), /no :root block/);
});
