# `/writing/` Hub — Implementation Plan (Phases A–C)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move essays out of `/writing/blog/` to `/writing/<slug>`, keep every existing URL resolving and every feed subscriber undisturbed, and rebuild `/writing/` as the hub that previews and filters everything written.

**Architecture:** Testable logic lives in plain `.mjs` modules with JSDoc types, covered by `node:test`; `.astro` files stay thin. The feed is hand-built because `@astrojs/rss` cannot pin a guid. Filtering is prerendered pages, never client JavaScript.

**Tech Stack:** Astro 5 (static output), `node:test`, self-hosted Newsreader + JetBrains Mono. No new dependencies.

**Spec:** [`docs/plans/2026-08-30-writing-hub-design.md`](2026-08-30-writing-hub-design.md) — read it first, especially *The honest limit on redirects*, *The feed*, and *Risks*.

## Global Constraints

- **No new colours.** Only `--ink-ground` `#151110`, `--bone` `#E3D9C6`, `--bone-muted` `#8F8574`, `--oxblood` `#8C3B32`, `--brass`/`--verify` `#A9884C`, `--plate-line`, `--plate-line-faint`.
- **`--verify`/brass is verification only.** Never decorative — not in margin notes, chips, code, tags, or links.
- **Two typefaces only:** Newsreader (`--serif`), JetBrains Mono (`--mono`).
- **No gradients**, except the sanctioned radial wash inside `.plate-frame`.
- **Contrast floor:** body ≥ 10:1, muted text ≥ 4.5:1 against `--ink-ground`. `--plate-line-faint` is **2.11:1 and is not a text colour.**
- **Anti-patterns, reject on sight:** gradients · animated text · card grids with shadows and radii · blue-grey dark mode · SaaS navbar chrome · a third typeface · brass used decoratively.
- **Zero client JavaScript** except the treatise's ~20-line inline plate observer.
- **`base` stays `"/"`.**
- **Every URL in the live sitemap must keep resolving** — 200 or a redirect page. See the spec's URL map.
- **Feed guids must not change.** They are pinned to the historical `/writing/blog/<slug>` URLs.
- Run all commands from `portfolio-website/`.

---

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `src/lib/reserved-slugs.mjs` + test | names a dynamic essay slug may not take | 1 |
| `src/pages/writing/[slug].astro` | **new** — essays at their new home | 2 |
| `src/pages/writing/blog/` | **deleted** — replaced by redirect declarations | 2 |
| `astro.config.mjs` | gains the two `redirects` entries | 2 |
| `src/lib/feed.mjs` + test | feed item shaping, guid pinning, XML escaping, RFC-822 dates | 3 |
| `src/pages/writing/rss.xml.ts` | rewritten by hand; drops `@astrojs/rss` | 3 |
| `src/pages/writing/sitemap.xml.ts` | new essay URLs | 3 |
| `src/pages/index.astro` | Essays section becomes a preview from the collection | 4 |
| `claims.yaml`, `src/lib/claims.ts`, `AGENT-PROMPT.md` | `essays:` retired; the single-source rule amended | 4 |
| `src/lib/writing-index.mjs` + test | one sorted list across the three collections, and the chip counts | 5 |
| `src/pages/writing/index.astro` | **the hub** | 6 |
| `src/pages/writing/essays.astro`, `src/pages/writing/category/[id].astro` | filtered views | 6 |
| `src/components/BlogList.tsx`, `CategoryFilter.tsx`, `src/lib/post-filter.mjs` | **deleted** | 7 |

**Not touched by this plan:** `/writing/eidos*`, `/writing/projects*`, `/writing/about` — their rebuild is Phase D and gets its own plan.

---

## Task 1: Reserved slugs

Essays become `/writing/<slug>`, sharing a namespace with the static routes. Astro resolves static routes first, so an essay slugged `about` would be silently unreachable. The build must refuse.

**Files:** Create `src/lib/reserved-slugs.mjs`, `src/lib/reserved-slugs.test.mjs`

**Interfaces produced:** `RESERVED_SLUGS` (a `Set`), `assertNoReservedSlugs(slugs)` — throws on collision, returns nothing otherwise. Task 2 calls it from `getStaticPaths`.

- [ ] **Step 1: Write the failing test**

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";

import { RESERVED_SLUGS, assertNoReservedSlugs } from "./reserved-slugs.mjs";

test("ordinary slugs pass", () => {
  assert.doesNotThrow(() => assertNoReservedSlugs(["hello-world", "the-ladder-problem"]));
});

test("a slug that shadows a static route is refused", () => {
  // Astro resolves /writing/about.astro before /writing/[slug].astro, so an
  // essay named `about` would build without error and be unreachable forever.
  assert.throws(() => assertNoReservedSlugs(["about"]), /about/);
});

test("every reserved name is actually refused", () => {
  for (const name of RESERVED_SLUGS) {
    assert.throws(() => assertNoReservedSlugs([name]), new RegExp(name));
  }
});

test("the error names every colliding slug, not just the first", () => {
  assert.throws(() => assertNoReservedSlugs(["about", "eidos"]), /about[\s\S]*eidos/);
});

test("an empty list passes", () => {
  assert.doesNotThrow(() => assertNoReservedSlugs([]));
});

test("the reserved set covers the static routes that exist", () => {
  // If a new static page is added under src/pages/writing/, it belongs here too.
  for (const name of ["about", "eidos", "projects", "essays", "category", "rss.xml", "sitemap.xml"]) {
    assert.ok(RESERVED_SLUGS.has(name), `${name} should be reserved`);
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL, `Cannot find module … reserved-slugs.mjs`.

- [ ] **Step 3: Write the module**

```javascript
// Essays live at /writing/<slug>, sharing a namespace with the static pages under
// src/pages/writing/. Astro resolves static routes before dynamic ones, so an
// essay whose slug matches one of them builds cleanly and is unreachable — a
// silent unpublish. This turns that into a build failure.
//
// Adding a static page under src/pages/writing/ means adding its name here.

/** Names a dynamic essay slug may not take. */
export const RESERVED_SLUGS = new Set([
  "about",
  "eidos",
  "projects",
  "essays",
  "category",
  "rss.xml",
  "sitemap.xml",
]);

/**
 * @param {string[]} slugs
 * @throws if any slug would be shadowed by a static route
 */
export function assertNoReservedSlugs(slugs) {
  const clashes = slugs.filter((s) => RESERVED_SLUGS.has(s));
  if (clashes.length === 0) return;

  throw new Error(
    `Reserved slug(s) would be unreachable at /writing/: ${clashes.join(", ")}. ` +
      `A static route under src/pages/writing/ already claims that path. ` +
      `Rename the content file, or the essay will build and never be readable.`,
  );
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `npm test` — expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reserved-slugs.mjs src/lib/reserved-slugs.test.mjs
git commit -m "feat: refuse essay slugs that a static route would shadow"
```

---

## Task 2: Move essays to `/writing/<slug>`

**Files:** Create `src/pages/writing/[slug].astro`; delete `src/pages/writing/blog/`; modify `astro.config.mjs`

**Interfaces consumed:** `assertNoReservedSlugs` (Task 1).

- [ ] **Step 1: Create the new route**

Copy `src/pages/writing/blog/[slug].astro` to `src/pages/writing/[slug].astro` **unchanged except** for these three edits — its layout, markup and margin note are already approved and must not be redesigned here:

1. Import depth drops one level: `../../layouts/Writing.astro` → `../layouts/Writing.astro`, and likewise for `../lib/dates.mjs`, `../lib/drafts.mjs`, `../lib/post-filter.mjs`.
2. Add `import { assertNoReservedSlugs } from "../lib/reserved-slugs.mjs";` and call it inside `getStaticPaths` before returning:

```js
const slugs = posts.map((p) => p.id);
assertNoReservedSlugs(slugs);
```

3. The back-link changes from `/writing/blog` to `/writing/`, and its text from `← Essays` to `← Writing`.

- [ ] **Step 2: Delete the old route and its index**

```bash
git rm -r src/pages/writing/blog
```

This removes both `[slug].astro` and `index.astro`. The index's replacement is Task 6; its URL's replacement is the redirect below.

- [ ] **Step 3: Declare the redirects**

In `astro.config.mjs`, inside `defineConfig({...})`, add:

```js
  // GitHub Pages serves static files only — no server-side 301 is possible here.
  // Astro emits an HTML page carrying a meta refresh and a canonical link, which
  // search engines treat as a soft redirect. That is the best this host allows,
  // and it is why /blog was retired rather than merely restyled.
  redirects: {
    "/writing/blog": "/writing/",
    "/writing/blog/[slug]": "/writing/[slug]",
  },
```

- [ ] **Step 4: Build and verify every old URL still resolves**

```bash
npm run build
for u in /writing/blog /writing/blog/hello-world /writing/blog/eidos-an-architecture-for-cheap-code; do
  f="dist${u}/index.html"
  [ -f "$f" ] && echo "OK   $u -> $(grep -o 'url=[^\"]*' "$f" | head -1)" || echo "MISSING $u"
done
echo "--- new URLs ---"
ls dist/writing/*.html dist/writing/*/index.html 2>/dev/null | head -20
```

Expected: all three old URLs present as redirect pages pointing at their new homes, and `dist/writing/hello-world/index.html` plus `dist/writing/eidos-an-architecture-for-cheap-code/index.html` existing.

- [ ] **Step 5: Prove the reserved-slug guard actually fires**

Temporarily rename a content file so its slug collides, and confirm the build fails:

```bash
cp content/blog/2026-02-27-hello-world.md content/blog/2026-02-27-about.md
npm run build 2>&1 | grep -i "reserved slug" && echo "GUARD FIRES"
rm content/blog/2026-02-27-about.md
npm run build 2>&1 | tail -2
```

Expected: `GUARD FIRES`, then a clean build after removal. **If the build succeeds with the colliding file present, the guard is not wired in — fix it before continuing.**

- [ ] **Step 6: Tests and gate**

```bash
npm test && node scripts/content-gate.mjs dist && node scripts/content-gate.mjs --selftest
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: move essays to /writing/<slug>, redirecting the old paths"
```

---

## Task 3: The feed, hand-built, with guids pinned

`@astrojs/rss` hardcodes `item.guid = { "#text": itemLink, "@_isPermaLink": "true" }` and offers no override. Pinning the guid therefore means building the XML directly. **Get this wrong and every subscriber receives every essay again.**

**Files:** Create `src/lib/feed.mjs`, `src/lib/feed.test.mjs`; rewrite `src/pages/writing/rss.xml.ts`; modify `src/pages/writing/sitemap.xml.ts`

**Interfaces produced:** `escapeXml(s)`, `rfc822(date)`, `HISTORICAL_PREFIX`, `feedItem(post)`.

- [ ] **Step 1: Write the failing test**

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";

import { HISTORICAL_PREFIX, escapeXml, feedItem, rfc822 } from "./feed.mjs";

const post = (id, over = {}) => ({
  id,
  data: {
    title: "Hello World",
    excerpt: "The first post on my new portfolio site.",
    date: new Date("2026-02-27"),
    ...over,
  },
});

test("the guid is the historical /writing/blog URL, not the new one", () => {
  // Subscribers already hold this string. Changing it republishes the post.
  const item = feedItem(post("hello-world"));
  assert.equal(item.guid, "https://alexanderdbarclay.com/writing/blog/hello-world");
});

test("the guid is declared not to be a permalink", () => {
  assert.equal(feedItem(post("hello-world")).isPermaLink, false);
});

test("the link points at the new location", () => {
  assert.equal(feedItem(post("hello-world")).link, "https://alexanderdbarclay.com/writing/hello-world");
});

test("guid and link differ, which is the whole point", () => {
  const item = feedItem(post("hello-world"));
  assert.notEqual(item.guid, item.link);
});

test("the historical prefix is frozen", () => {
  // If this constant ever changes, every guid changes with it.
  assert.equal(HISTORICAL_PREFIX, "https://alexanderdbarclay.com/writing/blog");
});

test("dates are RFC-822 in GMT, matching the live feed", () => {
  assert.equal(rfc822(new Date("2026-02-27")), "Fri, 27 Feb 2026 00:00:00 GMT");
  assert.equal(rfc822(new Date("2026-08-10")), "Mon, 10 Aug 2026 00:00:00 GMT");
});

test("XML escaping covers the five predefined entities", () => {
  assert.equal(escapeXml(`&<>"'`), "&amp;&lt;&gt;&quot;&apos;");
});

test("escaping an ampersand happens once, not twice", () => {
  assert.equal(escapeXml("Tom & Jerry"), "Tom &amp; Jerry");
  assert.equal(escapeXml("a &amp; b"), "a &amp;amp; b");
});

test("ordinary prose is untouched", () => {
  assert.equal(escapeXml("plain words"), "plain words");
});

test("a title with markup cannot break out of its element", () => {
  const item = feedItem(post("x", { title: `A <script> & "quotes"` }));
  assert.ok(!item.title.includes("<script>"));
  assert.match(item.title, /&lt;script&gt;/);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test` — expected: `Cannot find module … feed.mjs`.

- [ ] **Step 3: Write the module**

```javascript
// The feed, shaped by hand.
//
// @astrojs/rss hardcodes the guid to the item's link and exposes no override
// (dist/index.js: `item.guid = { "#text": itemLink, "@_isPermaLink": "true" }`).
// When essays moved from /writing/blog/<slug> to /writing/<slug>, keeping the
// library would have changed every guid — and a changed guid republishes every
// old post into every subscriber's reader as though it were new. That is not a
// mistake anyone can take back, so the feed is built here instead.
//
// The guid is an identifier, not an address. It stays pinned to the URL the
// essays were first published at, forever, and says so with isPermaLink="false".

import { SITE, absoluteUrl } from "./site.mjs";

/** Where essays were first published. Frozen: every guid derives from it. */
export const HISTORICAL_PREFIX = `${SITE.origin}/writing/blog`;

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

/**
 * @param {string} value
 * @returns {string} safe to place in XML text or an attribute
 */
export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

/**
 * RFC-822 in GMT, matching the format the live feed already publishes.
 * @param {Date} date
 * @returns {string}
 */
export function rfc822(date) {
  return (
    `${DAYS[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ` +
    `${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:` +
    `${pad(date.getUTCSeconds())} GMT`
  );
}

/**
 * One feed item, escaped and ready to interpolate.
 * @param {{ id: string, data: { title: string, excerpt: string, date: Date } }} post
 */
export function feedItem(post) {
  return {
    title: escapeXml(post.data.title),
    description: escapeXml(post.data.excerpt),
    link: escapeXml(absoluteUrl(`/writing/${post.id}`)),
    // Escaped for the same reason the link is. Slugs are [a-z0-9-] so this is a
    // no-op today; it stays so that a malformed slug cannot emit invalid XML.
    guid: escapeXml(`${HISTORICAL_PREFIX}/${post.id}`),
    isPermaLink: false,
    pubDate: rfc822(post.data.date),
  };
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `npm test` — expected: all pass.

- [ ] **Step 5: Rewrite the endpoint**

Replace `src/pages/writing/rss.xml.ts` entirely:

```typescript
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
```

- [ ] **Step 6: Update the writing sitemap**

In `src/pages/writing/sitemap.xml.ts`, change the essay path from `/writing/blog/${p.id}` to `/writing/${p.id}`. Add `/writing/essays` and one `/writing/category/${id}` per category with published entries **only after Task 6 exists** — for now, essays and the existing sections.

- [ ] **Step 7: Verify guids against the live feed**

The single most important check in this plan.

```bash
npm run build
curl -s https://alexanderdbarclay.com/writing/rss.xml -o /tmp/live-feed.xml
diff <(grep -oE '<guid[^>]*>[^<]*</guid>' /tmp/live-feed.xml | grep -oE 'https://[^<]*') \
     <(grep -oE '<guid[^>]*>[^<]*</guid>' dist/writing/rss.xml | grep -oE 'https://[^<]*') \
  && echo "GUIDS UNCHANGED — no post will republish"
echo "--- links should differ ---"
grep -oE '<link>https://[^<]*</link>' dist/writing/rss.xml
```

Expected: `GUIDS UNCHANGED`, and links now on `/writing/<slug>`.

**If the guids differ, stop.** Do not proceed and do not "fix" the check.

- [ ] **Step 8: Confirm the feed still parses**

```bash
node -e "
const s=require('fs').readFileSync('dist/writing/rss.xml','utf8');
const items=[...s.matchAll(/<item>/g)].length;
console.log('items:', items, '| well-formed:', !/&(?!amp;|lt;|gt;|quot;|apos;)/.test(s));
"
```

Expected: 2 items, `well-formed: true`.

- [ ] **Step 9: Drop the unused dependency**

```bash
grep -rn "@astrojs/rss" src/ || npm uninstall @astrojs/rss
npm test && node scripts/content-gate.mjs dist
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: build the feed by hand so guids survive the URL move"
```

---

## Task 4: The root previews real essays

**Files:** Modify `src/pages/index.astro`, `claims.yaml`, `src/lib/claims.ts`, `AGENT-PROMPT.md`

- [ ] **Step 1: Point the root's Essays section at the collection**

In `src/pages/index.astro`, replace the `visibleEssays` derivation with the three most recent published essays from the content collection:

```astro
import { getCollection } from "astro:content";
import { isPublished } from "../lib/drafts.mjs";

const previewEssays = (await getCollection("blog", ({ data }) => isPublished(data, false)))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 3);
```

Render each with its own `title` and `excerpt`, linking to `/writing/${essay.id}`, keeping the existing `.essay` markup and `.body-grid`. The margin note's `series_position` and `status` came from `claims.yaml` and have no equivalent — replace that note with the essay's formatted date via `formatDate` from `../lib/dates.mjs`.

After the list, add a link to the hub, in the same small-caps idiom as the contents nav:

```astro
<p class="smallcaps"><a href="/writing/">All writing &rarr;</a></p>
```

The section keeps its `id="essays"`, its roman numeral, and its `sections.essays_intro` prose — only the list beneath changes.

- [ ] **Step 2: Retire the duplicated list**

Delete the `essays:` block from `claims.yaml` and the `Essay` interface and its `essays` field from `src/lib/claims.ts`. Note before deleting that `claims.yaml` marks *The Price of the Ticket* `draft: false` while its own file is `draft: true` — the collection is now authoritative, so that essay correctly stops appearing.

- [ ] **Step 3: Amend the single-source rule**

`AGENT-PROMPT.md` states `claims.yaml` is the single source of truth for rendered content. Amend that section to say: `claims.yaml` governs claims and their evidence; content collections govern content; the root's Essays section previews the collection and holds no copy of it. Explain why — a second list drifted, and had already published a draft essay's metadata.

- [ ] **Step 4: Verify**

```bash
npm run build && npm test && node scripts/content-gate.mjs dist
grep -o 'href="/writing/[a-z-]*"' dist/index.html | sort -u
grep -c "Price of the Ticket" dist/index.html   # expect 0 — it is a draft
```

Expected: links to the published essays and to `/writing/`, and no draft essay on the root.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: preview real essays on the root, and retire the second list"
```

---

## Task 5: One list across three collections

**Files:** Create `src/lib/writing-index.mjs`, `src/lib/writing-index.test.mjs`

**Interfaces produced:** `KINDS`, `toEntries({ posts, docs, projects })`, `countByKind(entries)`, `countByCategory(entries)`.

- [ ] **Step 1: Write the failing test**

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";

import { KINDS, countByCategory, countByKind, toEntries } from "./writing-index.mjs";

const posts = [
  { id: "a", data: { title: "A", excerpt: "ex-a", date: new Date("2026-08-10"), category: "software" } },
  { id: "b", data: { title: "B", excerpt: "ex-b", date: new Date("2026-02-27"), category: "meta" } },
];
const docs = [
  { id: "architecture", data: { title: "Arch", summary: "sum", order: 1, version: "0.1" } },
];
const projects = [
  { id: "p", data: { title: "P", description: "desc", date: new Date("2026-01-15") } },
];

test("every kind becomes an entry with a uniform shape", () => {
  const entries = toEntries({ posts, docs, projects });
  assert.equal(entries.length, 4);
  for (const e of entries) {
    assert.ok(e.title && e.href && e.blurb && e.kind, `incomplete entry: ${JSON.stringify(e)}`);
  }
});

test("each kind gets its own URL shape", () => {
  const by = Object.fromEntries(toEntries({ posts, docs, projects }).map((e) => [e.title, e.href]));
  assert.equal(by.A, "/writing/a");
  assert.equal(by.Arch, "/writing/eidos/architecture");
  assert.equal(by.P, "/writing/projects/p");
});

test("the blurb comes from whichever field that kind carries", () => {
  const by = Object.fromEntries(toEntries({ posts, docs, projects }).map((e) => [e.title, e.blurb]));
  assert.equal(by.A, "ex-a");        // excerpt
  assert.equal(by.Arch, "sum");      // summary
  assert.equal(by.P, "desc");        // description
});

test("entries are newest first across all kinds", () => {
  const dates = toEntries({ posts, docs, projects }).map((e) => e.date.valueOf());
  assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
});

test("kind counts describe what is present", () => {
  assert.deepEqual(countByKind(toEntries({ posts, docs, projects })), {
    essay: 2,
    specification: 1,
    project: 1,
  });
});

test("category counts cover essays only", () => {
  // Specifications and projects have no category; counting them would invent one.
  assert.deepEqual(countByCategory(toEntries({ posts, docs, projects })), {
    software: 1,
    meta: 1,
  });
});

test("an absent kind gets no count, so no empty chip is advertised", () => {
  const counts = countByKind(toEntries({ posts, docs: [], projects: [] }));
  assert.ok(!("specification" in counts));
});

test("the kind list is closed", () => {
  assert.deepEqual([...KINDS], ["essay", "specification", "project"]);
});

test("toEntries does not mutate its inputs", () => {
  const snapshot = structuredClone({ posts, docs, projects });
  toEntries({ posts, docs, projects });
  assert.deepEqual({ posts, docs, projects }, snapshot);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test` — expected: `Cannot find module … writing-index.mjs`.

- [ ] **Step 3: Write the module**

```javascript
// One ordered list across the three collections, so /writing/ can show everything
// written in a single sequence and count what its chips describe.
//
// The three collections carry different frontmatter — an essay has an excerpt and
// a category, a specification document has a summary and an order, a project has
// a description — so each is mapped into one shape here rather than being
// special-cased at every call site.

/** The kinds a chip may filter by. Closed, for the same reason categories are. */
export const KINDS = ["essay", "specification", "project"];

/**
 * Eidos documents carry no date, only an `order`. They are one continuous
 * specification rather than dated pieces, so they sort among themselves by that
 * order and land beneath everything dated. The epoch is the mechanism; the intent
 * is "the specification is a fixture, not a recent event."
 */
const specDate = (order) => new Date(order * 1000);

/**
 * @param {{ posts: object[], docs: object[], projects: object[] }} collections
 * @returns {{ kind: string, title: string, href: string, blurb: string, date: Date, category?: string }[]}
 */
export function toEntries({ posts = [], docs = [], projects = [] }) {
  const entries = [
    ...posts.map((p) => ({
      kind: "essay",
      title: p.data.title,
      href: `/writing/${p.id}`,
      blurb: p.data.excerpt,
      date: p.data.date,
      category: p.data.category,
    })),
    ...docs.map((d) => ({
      kind: "specification",
      title: d.data.title,
      href: `/writing/eidos/${d.id}`,
      blurb: d.data.summary,
      date: specDate(d.data.order),
    })),
    ...projects.map((p) => ({
      kind: "project",
      title: p.data.title,
      href: `/writing/projects/${p.id}`,
      blurb: p.data.description,
      date: p.data.date,
    })),
  ];

  return entries.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

const tally = (values) => {
  const counts = {};
  for (const v of values) if (v) counts[v] = (counts[v] ?? 0) + 1;
  return counts;
};

/** How many entries of each kind. Kinds with none are omitted — no empty rooms. */
export function countByKind(entries) {
  return tally(entries.map((e) => e.kind));
}

/** How many essays in each category. Only essays carry one. */
export function countByCategory(entries) {
  return tally(entries.map((e) => e.category));
}
```

Note `specDate` keeps the four documents ordered relative to each other while placing them below any real date — which is what the test's newest-first assertion checks.

- [ ] **Step 4: Run the test and watch it pass**

Run: `npm test` — expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/writing-index.mjs src/lib/writing-index.test.mjs
git commit -m "feat: gather essays, specification and projects into one ordered list"
```

---

## Task 6: The hub

**Files:** Rewrite `src/pages/writing/index.astro`; create `src/pages/writing/essays.astro`, `src/pages/writing/category/[id].astro`; extend `src/styles/writing.css`; update `src/pages/writing/sitemap.xml.ts`

**Interfaces consumed:** `toEntries`, `countByKind`, `countByCategory` (Task 5); `CATEGORY_LABELS` from `src/lib/post-filter.mjs` — **note that Task 7 deletes that module**, so move `CATEGORY_LABELS` and `CATEGORY_IDS` into `writing-index.mjs` as part of this task and update the import.

- [ ] **Step 1: Build the hub**

`/writing/` renders, inside the existing `.page` and `<ContentsNav />`:

1. A section label in the treatise idiom — small caps, no roman numeral, since this is not a treatise section.
2. A short orienting paragraph. **Leave the prose to Alex**: put a single sentence in place and mark it clearly in the report as needing his voice. Do not write paragraphs in his register and let them ship unnoticed.
3. The chip row — kinds on the first line, essay categories on the second.
4. The entry list: `.essay` for essays and specification documents, `article.entry` for projects, each with its blurb and a margin note carrying kind and date.

Chips are `<a>` elements styled in the small-caps idiom, with a hairline border, `--bone-muted` text, and `--bone` on hover. **No `--verify`, no pills, no filled backgrounds** — a chip is a link, not a button. The current chip is selected when its own URL is the page being rendered; mark it with `aria-current="page"` and style that state with `--bone`, matching how `ContentsNav` does it.

- [ ] **Step 2: Build the filtered views**

`src/pages/writing/essays.astro` renders the same hub layout filtered to `kind === "essay"`.
`src/pages/writing/category/[id].astro` uses `getStaticPaths` over categories with at least one published essay, and renders the same layout filtered to that category.

Both carry a margin note stating the filter and a link back to `/writing/`.

- [ ] **Step 3: Carry the category-drift test across**

`src/lib/post-filter.test.mjs` holds a test that reads the `CATEGORIES` enum out of `content.config.ts` and fails if the label map disagrees with it. **Task 7 deletes that file**, so move this test into `src/lib/writing-index.test.mjs` along with the label map, or the guard is silently lost:

```javascript
test("the label map covers exactly the categories the schema accepts", () => {
  // The Zod enum in content.config.ts decides what may be authored; this map
  // decides what a chip can say. An id in one and not the other is how a filter
  // silently splits in two, so the two are compared rather than trusted.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const config = readFileSync(path.join(here, "..", "content.config.ts"), "utf8");
  const literal = config.match(/CATEGORIES\s*=\s*\[([^\]]*)\]/);
  assert.ok(literal, "could not find the CATEGORIES literal in content.config.ts");

  const schemaIds = [...literal[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...CATEGORY_IDS].sort(), schemaIds.sort());
  for (const id of CATEGORY_IDS) assert.ok(CATEGORY_LABELS[id], `category "${id}" has no label`);
});
```

Verify it still bites: temporarily add a category to `content.config.ts`'s enum and confirm the test fails, then revert.

- [ ] **Step 4: Add the new URLs to both sitemaps**

`src/pages/writing/sitemap.xml.ts` gains `/writing/essays` and each `/writing/category/<id>`. The site-wide sitemap picks them up automatically.

- [ ] **Step 5: Verify**

```bash
npm run build && npm test && node scripts/content-gate.mjs dist
echo "routes:"; find dist/writing -name index.html | sed 's#dist##; s#/index.html##' | sort
echo "JS on the hub:"; grep -c '<script' dist/writing/index.html    # expect 0
echo "brass on the hub:"; node -e "
const h=require('fs').readFileSync('dist/writing/index.html','utf8');
console.log((h.replace(/:root\{[^}]*\}/g,'').match(/a9884c/gi)||[]).length);
"                                                                    # expect 0
```

Expected: the hub, `/writing/essays`, a category page per populated category, every essay at `/writing/<slug>`, zero JS, zero decorative brass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: rebuild /writing/ as the hub for everything written"
```

---

## Task 7: Remove the island

**Files:** Delete `src/components/BlogList.tsx`, `src/components/CategoryFilter.tsx`, `src/lib/post-filter.mjs`, `src/lib/post-filter.test.mjs`; modify `astro.config.mjs`, `package.json`

- [ ] **Step 1: Confirm nothing still imports them**

```bash
grep -rn "BlogList\|CategoryFilter\|post-filter" src/ astro.config.mjs
```

Expected: no hits. If `CATEGORY_LABELS` still resolves to `post-filter.mjs`, Task 6 did not move it — do that first.

- [ ] **Step 2: Delete**

```bash
git rm src/components/BlogList.tsx src/components/CategoryFilter.tsx \
       src/lib/post-filter.mjs src/lib/post-filter.test.mjs
```

Remove the `react()` integration and its import from `astro.config.mjs`, then:

```bash
npm uninstall @astrojs/react react react-dom @types/react @types/react-dom
```

- [ ] **Step 3: Verify the site ships no React**

```bash
npm run build && npm test && node scripts/content-gate.mjs dist && node scripts/content-gate.mjs --selftest
echo "pages with any script tag:"
for f in $(find dist -name '*.html'); do n=$(grep -c '<script' "$f"); [ "$n" != "0" ] && echo "  $n  ${f#dist}"; done
grep -rl "react" dist/_astro/ 2>/dev/null || echo "no React chunk in the build"
```

Expected: exactly one page with a script tag — `/index.html`, the treatise's inline plate observer — and no React chunk anywhere.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove the last island, and React with it"
```

---

## What this plan leaves undone

**Phase D** — rebuilding `/writing/eidos`, its documents, `/writing/projects`, its detail page, and `/writing/about` in the approved vocabulary. **Phase E** — the cutover, which needs the ordered care the spec's risk 1 describes: redirect pages live before the sitemap stops listing old URLs.

Both get their own plan. Phase D's vocabulary depends on the hub being seen first, and Phase E should not be planned until what it is cutting over is final.
