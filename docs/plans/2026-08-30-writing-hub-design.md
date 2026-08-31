# `/writing/` as the hub, and the retirement of `/blog/` — Design

**Date:** 2026-08-30
**Status:** proposed, pending implementation plan
**Repo:** `adbarc92/portfolio-treatise`
**Supersedes:** parts of [`2026-08-30-writing-design-system-v2-design.md`](2026-08-30-writing-design-system-v2-design.md) — see *What this changes* below. That document's visual vocabulary stands; its information architecture does not.

---

## Goal

Give the site one front door for everything written. Today `/writing/` and the treatise's
`III. Essays` section introduce the same material twice, and `/writing/blog` is a third index of
the same essays. This collapses the three into a relationship: the root **previews**, `/writing/`
**lists and filters**, and `/blog/` stops existing.

## Fixed decisions

Settled in conversation on 2026-08-30. The plan does not revisit them.

1. **`/writing/` is the hub.** It previews everything written — essays, Eidos specification
   documents, and projects — newest first, with filter chips.
2. **Chips filter by kind first**, with essay categories nested beneath. Chips are links to
   prerendered pages, never client-side filtering.
3. **The root's `III. Essays` becomes a preview**, fed by the content collection.
4. **`content/blog/` is the source of truth for essays.** `claims.yaml` keeps claims and
   evidence and stops holding a second copy of the essay list.
5. **`/writing/blog` is retired**, redirecting to `/writing/`.
6. **Essay URLs move** from `/writing/blog/<slug>` to `/writing/<slug>`, with redirects.
7. **Feed guids are pinned to the historical URLs** so nothing republishes. See *The feed*.

## What this changes in the v2 design

| v2 section | Status |
| --- | --- |
| §2.11 Section front matter | **Superseded.** `/writing/` is an index, not front matter. |
| §2.13 Filtered views | **Revised.** Filters live at `/writing/` and span kinds, not only essay categories. |
| Non-goal: "Changing any URL that exists today" | **Explicitly overridden** for `/blog`. Every other URL still frozen. |
| §§2.10, 2.12, 2.14–2.16, and the whole visual vocabulary | **Stand unchanged.** Already built and merged. |

## Non-goals

- **Changing `/writing/eidos`, `/writing/projects`, `/writing/about`,** or the four Eidos
  document URLs. Only `/blog` moves.
- **Redesigning the treatise** beyond replacing how its Essays section sources its list.
- **Re-authoring prose.** The two political essays stay `draft: true`.
- **Rebuilding the pages Phase 4 already owed** — this design changes *what they are*, and the
  plan that follows absorbs both.

---

## The URL map

| Today | Tomorrow | Mechanism |
| --- | --- | --- |
| `/writing/` | the hub — all writing, previews, chips | rebuilt |
| `/writing/blog` | → `/writing/` | redirect page |
| `/writing/blog/<slug>` | → `/writing/<slug>` | redirect page |
| — | `/writing/<slug>` | new home for essays |
| — | `/writing/essays` | the Essays kind-filter |
| — | `/writing/category/<id>` | essay category filters |
| `/writing/eidos` | unchanged — also serves as the Specification filter | — |
| `/writing/projects` | unchanged — also serves as the Projects filter | — |
| `/writing/about` | unchanged | — |
| `/writing/eidos/<slug>`, `/writing/projects/<slug>` | unchanged | — |

The kind filters are not new pages invented for the chip row: `/writing/eidos` and
`/writing/projects` already exist and already list exactly what those chips mean. Only Essays
needs a home, at `/writing/essays`. A chip row that points at pages the site already has is
better than one that invents a parallel set.

### The honest limit on redirects — read this before promising a 301

**GitHub Pages serves static files only.** There is no `.htaccess`, no `_redirects`, no rewrite
rule, and therefore **no true 301 is achievable on this host.** What Astro's `redirects` config
emits for a static build is an HTML page carrying a meta refresh and a canonical link:

```html
<meta http-equiv="refresh" content="0;url=/writing/eidos-an-architecture-for-cheap-code">
<link rel="canonical" href="https://alexanderdbarclay.com/writing/eidos-an-architecture-for-cheap-code">
```

Search engines treat this as a **soft redirect**. It is followed, and the canonical carries most
of the ranking signal, but it is weaker and slower to be honoured than a server-issued 301. A
reader following an old link sees a blank flash before arriving.

This is the best available on this host, and it is a real, permanent cost of moving the URLs
rather than a temporary inconvenience. It is recorded here so nobody later reads "redirect" and
assumes a 301 was shipped.

Mechanically, both redirects are declarations in `astro.config.mjs`, the second a dynamic pattern
so it covers every essay without enumerating them:

```js
redirects: {
  "/writing/blog": "/writing/",
  "/writing/blog/[slug]": "/writing/[slug]",
}
```

The old page files under `src/pages/writing/blog/` are deleted; the redirect declaration is what
keeps their URLs resolving.

### Reserved slugs

`src/pages/writing/[slug].astro` will sit beside the static routes `about.astro`,
`eidos/`, `projects/`, and `essays.astro`. Astro resolves static routes before dynamic ones, so
those names win — which means **an essay slugged `about`, `eidos`, `projects`, `essays`, or
`category` would be silently unreachable.** The build must fail on such a collision rather than
publish an essay nobody can read. This is new: under `/writing/blog/<slug>` no such collision was
possible.

---

## The hub

`/writing/` lists every published piece of writing, newest first, as index entries in the form
`DESIGN-SYSTEM` §2.12 already defines — a hairline top rule, no cards. **Essays and Eidos
documents both use `.essay`**, since both are prose under a title; **projects use
`article.entry`**, whose small-caps head and mono meta line is what §2.6 was written for. Kind is
already legible from the chip row and the margin note, so it does not also need a third entry
form.

Above the list, a chip row:

```
All (N) · Essays (n) · Specification (n) · Projects (n)
        Software (n) · Politics (n) · …
```

Kind chips first, then essay categories on a second line. Chips are links, set in the small-caps
idiom the contents nav uses, not buttons and not pills. Only kinds and categories with at least
one published entry get a chip — the existing "no empty rooms" rule, which §2.13 already states.

**A preview is a title, a date, and one line.** For essays that line is the `excerpt`; for
projects, the `description`; for Eidos documents, the `summary`. Every collection already carries
the field, so nothing new needs authoring.

## The root's Essays section

`III. Essays` becomes a preview: the **three most recent published essays**, drawn from
`content/blog/`, each a title and its own excerpt, followed by a link to `/writing/`. Three
because it is enough to show range and not so many that the treatise turns into an index.

This is the change that makes `claims.yaml` stop being the essay list. Today it holds titles,
abstracts, `series_position`, and hardcoded absolute URLs — a second copy that has **already
drifted**: `The Price of the Ticket` is `draft: false` in `claims.yaml` while its own file is
`draft: true`. One more essay written twice is one more chance to publish something that is not
ready.

`claims.yaml` keeps everything else: the thesis, the projects' claims, the evidence links, the
workshop, the author. Only the `essays:` block is retired.

**`AGENT-PROMPT.md` must be amended.** It states `claims.yaml` is the single source of truth for
rendered content. That stops being true here, and the document should say what remains true:
`claims.yaml` governs claims and their evidence; content collections govern content. Leaving the
rule as written would make the next agent restore the duplication in good faith.

## The feed

Moving essay URLs would ordinarily republish every post into every subscriber's reader, because
the feed's guid is the link. It does not have to be.

The guid is pinned, permanently, to the **historical** `/writing/blog/<slug>` URL and marked
`isPermaLink="false"`; `<link>` points at the new location:

```xml
<link>https://alexanderdbarclay.com/writing/eidos-an-architecture-for-cheap-code</link>
<guid isPermaLink="false">https://alexanderdbarclay.com/writing/blog/eidos-an-architecture-for-cheap-code</guid>
```

Subscribers see a byte-identical guid and nothing republishes. New readers follow the new link.

The cost is that the feed carries a URL shape the site no longer uses, forever. That is the right
trade: a guid is an identifier, not an address, and the whole point of `isPermaLink="false"` is
to say so. **The implementation must derive the guid from the slug and the historical prefix, and
a test must pin it** — a future refactor that "tidies" the guid to match the link would resend
every essay to every subscriber, silently, once.

### `@astrojs/rss` cannot do this, and must be dropped from this endpoint

Verified in the installed package: `@astrojs/rss` hardcodes the guid to the item's link and
offers no way to override it —

```js
// node_modules/@astrojs/rss/dist/index.js:145
item.guid = { "#text": itemLink, "@_isPermaLink": "true" };
```

There is no `guid` field in its item schema. So the choice is not between two library
configurations; it is between **hand-building the feed** and **accepting the republish**.

The feed is therefore built by hand, as `/writing/sitemap.xml` already is — a template string
over the same collection query. It is roughly thirty lines, it removes a dependency's opinion
from the one file whose correctness is measured in other people's inboxes, and the repo already
has the pattern. `@astrojs/rss` stays a dependency only if something else uses it; nothing does,
so it goes.

Hand-building means owning XML escaping. `src/lib/escape.ts` was deleted during the
consolidation because Astro escapes for us, so this needs a small, tested escape helper. Note
that the live feed emits `&apos;` for an apostrophe; a raw `'` is equally valid XML and readers
key on the guid, not the description bytes, so **the verification diffs guids specifically**
rather than the whole document.

---

## Risks

**1. This is a second cutover, and it is riskier than the first.** The first changed which
deployment served a path; this changes the paths themselves, on a site whose canonical tags, OG
tags, sitemap, and feed all encode them. Redirect pages must be live *before* the sitemap stops
listing the old URLs, or a crawler finds neither.

**2. Soft redirects are the only kind available.** See above. If `/writing/blog/eidos-...` is
the link posted to LinkedIn, it will keep working — through a meta refresh, with a visible flash.

**3. The Eidos essay link is recorded in `claims.yaml`** as an absolute URL and rendered on the
live root. It must be updated in the same change, or the treatise's own front page points at a
redirect.

**4. Reserved-slug collisions** silently unpublish an essay. Mitigated by a build-time check, and
that check is not optional.

**5. `/writing/` grows a second responsibility.** It is now both a section landing and a filtered
index. If it later needs pagination, this design has no answer and will need one.

---

## Verification

Presentation is judged by eye. Everything else is mechanical, as at the first cutover.

1. Build green; tests green; content gate and canary clean.
2. **Every URL in the current live sitemap still resolves** — the twelve, each either 200 or a
   redirect page pointing at its new home. A URL that resolves to nothing is a stop.
3. The emitted route list contains the new hub, `/writing/<slug>` for every published essay,
   `/writing/essays`, and one `/writing/category/<id>` per category with entries.
4. **Feed guids diffed against the currently live feed — byte-identical.** This is the check that
   protects subscribers, and it is not optional.
5. Feed `<link>` elements point at the new URLs.
6. Canonicals, `og:url`, and both sitemaps agree with the new URLs.
7. Zero `<script>` on every page except the treatise's plate observer.
8. The treatise page changes only in its Essays section.
9. Contrast: body ≥ 10:1, muted ≥ 4.5:1, per §4.
10. A reserved-slug collision fails the build. Proven by temporarily adding one.

---

## Phases

**Phase A — the sources.** Retire `claims.yaml`'s `essays:` block; point the root's section at
`content/blog/`; amend `AGENT-PROMPT.md`. The root gains a preview and nothing else moves.

**Phase B — the move.** `/writing/<slug>` becomes the essay route; redirect pages for
`/writing/blog` and `/writing/blog/<slug>`; the reserved-slug check; feed guids pinned and
tested; canonicals and sitemaps updated.

**Phase C — the hub.** Rebuild `/writing/` as the index with chips; add `/writing/essays` and
the category pages; delete the React island and its dependencies.

**Phase D — the remaining pages.** `/writing/eidos`, its documents, `/writing/projects`, its
detail page, and `/writing/about`, in the vocabulary the reference essay page established. This
absorbs what the v2 plan called Phase 4.

**Phase E — verify and cut over.** The checklist above, then deploy in the order risk 1 requires.

---

## Deferred

- **Pagination** for `/writing/`, until the list is long enough to need it.
- **Tag pages.** Still deferred; tags remain text.
- The two CI gates `AGENT-PROMPT.md` specifies and nobody built.
- A new `og:image` in the v2 palette.
