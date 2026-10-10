// Share cards — the og:image a link unfurls to. One for the site, set from
// claims.yaml's thesis, and one for each published essay, set from its
// frontmatter. Both are drawn with the site's own fonts and tokens, so a card
// cannot drift into a palette the pages have left.
//
// The PNGs are committed rather than built: CI has no browser and should not need
// one to deploy. share-cards.test.mjs fails if a published essay has no card, so
// forgetting this step stops a deploy instead of quietly unfurling the wrong
// image. Run it after adding or retitling an essay, from the repo root:
//   npm run cards
// It drives a local Chrome or Edge headless; set CHROME_PATH if neither is found.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { parse } from "yaml";

import { SITE, essayCard } from "../src/lib/site.mjs";
import { stripDate } from "../src/lib/slugs.mjs";
import { isPublished } from "../src/lib/drafts.mjs";

export const WIDTH = 1200;
export const HEIGHT = 630;

/** `/writing/images/og.png` -> `<publicDir>/writing/images/og.png` */
export const cardFile = (publicDir, urlPath) => path.join(publicDir, ...urlPath.split("/").filter(Boolean));

/**
 * The essays a build would publish, with what a card needs from each. Drafts are
 * left out by the same rule the build uses, so a card never precedes its essay.
 *
 * @param {string} blogDir
 * @returns {{ slug: string, title: string, tagline?: string }[]}
 */
export function publishedEssays(blogDir) {
  return readdirSync(blogDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const text = readFileSync(path.join(blogDir, name), "utf8");
      const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
      if (!block) throw new Error(`share cards: ${name} has no frontmatter`);
      return { slug: stripDate(name), ...parse(block[1]) };
    })
    .filter((essay) => isPublished(essay, false))
    .map(({ slug, title, tagline }) => ({ slug, title, tagline }));
}

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The tokens, lifted from the stylesheet rather than restated beside it. */
function tokens(foundationCss) {
  const root = /:root\s*\{[^}]*\}/.exec(foundationCss);
  if (!root) throw new Error("share cards: no :root block in foundation.css — the cards have no tokens");
  return root[0];
}

const shell = (foundationCss, fontsUrl, css, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
@font-face{font-family:"Newsreader";src:url("${fontsUrl}newsreader-latin-opsz-normal.woff2") format("woff2-variations");font-weight:200 800;font-style:normal}
@font-face{font-family:"Newsreader";src:url("${fontsUrl}newsreader-latin-opsz-italic.woff2") format("woff2-variations");font-weight:200 800;font-style:italic}
@font-face{font-family:"JetBrains Mono";src:url("${fontsUrl}jetbrains-mono-latin-400-normal.woff2") format("woff2");font-weight:400}
${tokens(foundationCss)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:var(--ink-ground)}
body{color:var(--bone);font-family:var(--serif);font-optical-sizing:auto;-webkit-font-smoothing:antialiased}
.card{position:relative;width:${WIDTH}px;height:${HEIGHT}px;padding:84px 92px 82px;display:flex;flex-direction:column}
.frame{position:absolute;inset:30px;border:1px solid var(--plate-line-faint);outline:1px solid var(--plate-line-faint);outline-offset:5px}
.smallcaps{font-variant-caps:all-small-caps;letter-spacing:0.12em;font-weight:500;line-height:1}
.muted{color:var(--bone-muted)}
.dot{margin:0 .6em;color:var(--oxblood)}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:baseline}
.foot .byline{font-size:25px}
.foot .url{font-family:var(--mono);font-size:19px}
${css}
</style>
</head>
<body>
<div class="card">
<div class="frame"></div>
${body}
</div>
</body>
</html>
`;

/**
 * The site's card: the thesis, set as the root's front matter sets it.
 *
 * @param {{ thesis: string, byline: { name: string, place: string }, foundationCss: string, fontsUrl: string }} card
 */
export function siteCardHtml({ thesis, byline, foundationCss, fontsUrl }) {
  // The same dressing src/pages/index.astro gives the thesis; the words stay
  // claims.yaml's.
  const thesisHtml = escapeHtml(thesis)
    .replace("I work", "I&nbsp;work")
    .replace(/\bsecond\b/, "<em>second</em>");
  return shell(
    foundationCss,
    fontsUrl,
    `.head{font-size:25px}
.thesis{margin-top:67px;max-width:960px;font-size:68px;font-weight:430;line-height:1.18;letter-spacing:-0.012em}
.thesis em{font-style:italic}`,
    `<p class="head smallcaps muted">A Treatise on Trustworthy Autonomous Systems</p>
<p class="thesis">${thesisHtml}</p>
<div class="foot">
<p class="byline smallcaps muted">${escapeHtml(byline.name)}<span class="dot">·</span>${escapeHtml(byline.place)}<span class="dot">·</span>Essays, plates, specifications</p>
<p class="url muted">${new URL(SITE.origin).host}</p>
</div>`,
  );
}

/**
 * An essay's card: its title as the essay lists set one, and its tagline beneath
 * if it has one. A title too long for two lines is set smaller until it fits.
 *
 * @param {{ title: string, tagline?: string, foundationCss: string, fontsUrl: string }} card
 */
export function essayCardHtml({ title, tagline, foundationCss, fontsUrl }) {
  return shell(
    foundationCss,
    fontsUrl,
    `.label{font-size:27px}
.label .num{font-family:var(--mono);font-size:19px;color:var(--oxblood);margin-right:.9em;letter-spacing:0}
h1{margin-top:49px;max-width:940px;font-size:84px;font-weight:500;font-style:italic;line-height:1.1;letter-spacing:-0.012em}
.abstract{margin-top:39px;font-size:28px;line-height:1.4}`,
    `<p class="label smallcaps muted"><span class="num">III</span>Essays</p>
<h1>${escapeHtml(title)}</h1>
${tagline ? `<p class="abstract muted">${escapeHtml(tagline)}</p>` : ""}
<div class="foot">
<p class="byline smallcaps muted">${escapeHtml(SITE.author)}</p>
<p class="url muted">${new URL(SITE.origin).host}/writing</p>
</div>
<script>
document.fonts.ready.then(() => {
  const h1 = document.querySelector("h1");
  for (let size = 84; size > 56 && h1.offsetHeight > size * 1.1 * 2.2; size -= 4)
    h1.style.fontSize = size - 4 + "px";
});
</script>`,
  );
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error("share cards: no Chrome or Edge found — set CHROME_PATH");
  return found;
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const browser = findBrowser();
  const publicDir = path.resolve("public");
  const foundationCss = readFileSync("src/styles/foundation.css", "utf8");
  const fontsUrl = pathToFileURL(path.join(publicDir, "fonts")).href + "/";
  const { meta } = parse(readFileSync("claims.yaml", "utf8"));

  const cards = [
    {
      out: cardFile(publicDir, SITE.image),
      html: siteCardHtml({ thesis: meta.thesis, byline: meta.byline, foundationCss, fontsUrl }),
    },
    ...publishedEssays("content/blog").map((essay) => ({
      out: cardFile(publicDir, essayCard(essay.slug)),
      html: essayCardHtml({ ...essay, foundationCss, fontsUrl }),
    })),
  ];

  const work = mkdtempSync(path.join(tmpdir(), "treatise-cards-"));
  try {
    for (const [i, card] of cards.entries()) {
      const page = path.join(work, `card-${i}.html`);
      writeFileSync(page, card.html);
      mkdirSync(path.dirname(card.out), { recursive: true });
      execFileSync(
        browser,
        [
          "--headless=new",
          "--disable-gpu",
          "--hide-scrollbars",
          "--force-device-scale-factor=1",
          `--window-size=${WIDTH},${HEIGHT}`,
          // lets the fonts load and the title fit before the frame is taken
          "--virtual-time-budget=3000",
          `--user-data-dir=${path.join(work, "profile")}`,
          `--screenshot=${card.out}`,
          pathToFileURL(page).href,
        ],
        { stdio: "ignore" },
      );
      console.log(`share cards: ${path.relative(process.cwd(), card.out)}`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
