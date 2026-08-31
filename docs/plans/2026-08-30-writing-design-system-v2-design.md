# Design System v2: the essays join the treatise — Design

**Date:** 2026-08-30
**Status:** proposed, pending implementation plan
**Repo:** `adbarc92/portfolio-treatise` (the whole site)

---

## Goal

One publication. Since the consolidation, `alexanderdbarclay.com` is served from one repository
and one build, but it still looks like two websites: an illuminated treatise at the root and a
blue-grey developer portfolio under `/writing/*`. This closes that gap by bringing the essays
under the treatise's design system, and by extending that system to cover what it was never
written for.

It also disposes of a question that has been open since the start of the session — the gear
background being "too busy, and inelegant." Under this system there is no animated WebGL
background. The problem is solved by deletion rather than by redesign.

## Fixed decisions

Settled in conversation on 2026-08-30. The plan does not revisit them.

1. **One system, extended.** `DESIGN-SYSTEM.md` goes to **v2** and grows the component
   vocabulary the essays need. It is not forked, and the essays are not an exception to it.
2. **Essays adopt the body grid**, with **editorial** margin notes — author-written asides,
   dates, categories, series position — **not** gated by `claims.yaml`. The treatise's citation
   machinery stays the treatise's.
3. **Filtering becomes static pages.** `/writing/blog/category/<id>` is prerendered. Zero client
   JS returns to the whole domain.
4. **One contents nav across both halves**, and `/writing/` stops being a second front door: it
   becomes the Essays section's own front matter.

## Non-goals

- **Changing any URL that exists today.** All twelve are frozen. New category pages are
  additive.
- **Changing `<head>` semantics.** Titles, descriptions, canonicals, OG, `twitter:card`, and the
  feed were verified identical to the live site at cutover and stay that way. This is a
  presentation change.
- **Re-authoring prose.** No essay text changes. The two political drafts stay `draft: true`.
- **A new `og:image`.** The current card is in the old palette and will be off-brand. Replacing
  it is follow-on work; smuggling a new image into a layout change would hide it.
- **Bringing the gears back.** See *Deferred*.

---

## Current state: what actually violates the system

`DESIGN-SYSTEM.md` §6 lists anti-patterns to "reject on sight." The writing site, as built,
trips most of them. This is the honest measure of the work — it is a rewrite of the presentation
layer, not a restyle.

| §6 anti-pattern | Where |
| --- | --- |
| blue-grey dark mode | `--color-bg: #0f1117`, the whole palette |
| card grids with shadows and radii | blog index, projects, Eidos contents |
| SaaS navbar chrome | fixed bar with `backdrop-filter: blur(12px)` |
| brass/`--verify` used decoratively | gold `#c8a44e` on tags, chips, links, borders, badges |
| a third typeface | `system-ui` sans, where the system allows Newsreader + JetBrains Mono only |
| gradients | in the gear background (already removed) |

And §4's quality floor — *"Zero client JS except the ~20-line plate-draw observer"* — is broken
by one page: the blog index hydrates a React island of roughly 187 KB (~61 KB gzipped) to filter
two published posts.

`--verify` is the sharpest of these. The system reserves brass for proven claims and says
scarcity is semantic. The writing site spends the same hue on every tag and every link, which
does not merely look different — it spends the site's one meaning-bearing colour on decoration.

---

## What v2 adds to `DESIGN-SYSTEM.md`

The current document describes a single continuous page. It has no component for a list of
entries, a filtered view, a section front page, or a code block. v2 adds these as numbered
components in the existing style, and bumps the version header with a note that the reference
implementation remains authoritative where the two disagree.

- **2.10 Contents nav (site-wide).** Extends 2.1 from anchors on one page to links across pages.
  It lists the treatise's roman-numeral sections and the essays' sections in one sequence, and
  every page carries the same list. From a writing page, treatise sections link to anchors on
  the root (`/#plates`); from the root, essay sections link to their pages (`/writing/blog`).
  Still no logo, no CTA, no sticky behaviour. The current entry `III. Essays` becomes the link
  to `/writing/`, and the essays' four sub-sections hang beneath it.
- **2.11 Section front matter.** What `/writing/` becomes: epigraph, orientation, sub-sections.
- **2.12 Index entries.** The list form for essays and projects, generalising 2.6 and 2.7.
- **2.13 Filtered views.** Category pages, and the rule that only categories with published
  posts get a link — the existing "no empty rooms" behaviour, restated as a system rule.
- **2.14 Code blocks.** New. See below.
- **2.15 Document navigation.** Prev/next and the contents list for the Eidos specification.

§1.1 gains no colours. If a component appears to need one, that is a signal the component is
wrong, not the palette.

---

## Stylesheet architecture

Today: `treatise.css` (174 lines) and `writing.css` are separate, and `writing.css` is
deliberately scoped so its global reset cannot reach the treatise.

Target:

| File | Holds |
| --- | --- |
| `foundation.css` | tokens, `@font-face`, reset, base type, `.page`, `.body-grid`, `.margin-note`, `.section-label`, contents nav |
| `treatise.css` | plates, marginalia, claims-specific rules, front matter, colophon |
| `writing.css` | index entries, category pages, code blocks, document navigation |

Both halves import `foundation.css`. The fonts are already self-hosted in `public/fonts/`;
the writing pages currently load neither face and must, with the serif preloaded per §1.2.

### The risk this creates, stated plainly

The treatise's built `index.html` has been **byte-identical** through every phase of the
consolidation, and it is the page carrying the Lighthouse ≥ 95 bar. Splitting its stylesheet
changes how Astro bundles and inlines CSS, so byte-identity is no longer achievable.

The invariant weakens to: **the treatise's rendered CSS rule set is identical as a set, and its
markup is unchanged apart from the style block.** That is checkable — parse both stylesheets,
normalise, compare — but it is a weaker guarantee than the one it replaces, and it is the
single largest risk in this plan.

**Fallback, if the extraction proves unsafe:** duplicate the tokens and `@font-face` into
`writing.css` and never touch `treatise.css`. Worse for coherence, zero risk to the treatise.
The implementation plan must treat the extraction as a step that can be abandoned without
abandoning the redesign.

---

## Page specifications

Twelve existing URLs, unchanged. Two new.

### `/writing/` — section front matter (2.11)

Epigraph, a short orientation paragraph in the author's voice, then the sub-sections as a
contents list. Drops the duplicated "Alex Barclay / Software Engineer" identity, which competes
with the root's front matter.

### `/writing/blog` — essay index (2.12)

Per §2.7: hairline top rule per entry, italic serif title as the link (underline appears on
hover, in oxblood), one-line abstract from `excerpt` in `--bone-muted`, margin note carrying the
date and category. Categories render as a small-caps list of links above the entries — not
chips, not buttons.

### `/writing/blog/<slug>` — essay

Body grid. Serif title, prose at `--measure`. The margin carries date, category, and any
editorial asides. Tags render as mono text in the margin and **are not links** — see
*Decisions taken in the spec* below.

### `/writing/blog/category/<id>` — filtered view (2.13) — **new**

Prerendered per category that has at least one published post. Today that is `software` and
`meta`; `politics` appears when the drafts ship. Identical to the index, plus a margin note
stating the filter and linking back to everything.

### `/writing/projects` and `/writing/projects/<slug>`

Per §2.6: hairline rule, small-caps name, mono meta line, prose. Not a grid, no cards. No
project carries a thumbnail (`thumbnail: ""`), so no image treatment is forced; if one is added
later it takes the plate frame, not a card. External links render as a mono line.

### `/writing/eidos` and `/writing/eidos/<slug>`

Contents list with the version in mono. On a document, the body grid, with the document list and
prev/next in the margin column, replacing the sticky sidebar.

### `/writing/about`

Prose in the measure. No margin column unless the content earns one.

---

## Code blocks (2.14) — the gap

The treatise renders **zero** code blocks, so the system has never had a rule for `<pre>`. The
essays have three, currently in Shiki's `github-dark`, which is a foreign object on
bone-over-lampblack.

v2 specifies a Shiki theme built from the existing tokens: bone on the page ground, a
`--plate-line-faint` hairline frame, no fill, mono at the plate-label size. A code block should
read as a small plate, not an imported widget.

**No new colours.** Syntax distinction comes from three existing values only — `--bone` for
code, `--bone-muted` for comments and punctuation, and `--oxblood` for keywords — plus weight.
`--verify`/brass is not available here: it means "proven claim" and a syntax highlighter has no
claims to prove. If three values prove insufficient for legibility, that is a finding to bring
back to §1.1 as a documented revision, not a decision to make inside a stylesheet.

This replaces `shiki-surface.mjs`, whose only job was stripping the imported theme's background.

---

## What is deleted

- `src/components/BlogList.tsx`, `src/components/CategoryFilter.tsx`
- `src/lib/post-filter.mjs`'s URL-writing half (`nextSearch`); its selection logic survives to
  build the static category pages
- `@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom`
- The React integration in `astro.config.mjs`
- `shiki-surface.mjs`, superseded by a real theme
- The fixed navbar, every card, the gold-as-decoration palette, the `#0f1117` ground

**Result: the site ships no client JS except the treatise's ~20-line plate-draw observer** —
which is exactly what §4 permits, and nothing more. The floor applies to the whole domain again
rather than to one half of it.

---

## Invariants that must not change

Verified at cutover; re-verified after this work.

1. The twelve `/writing/*` URLs return 200.
2. Canonicals keep the trailing-slash asymmetry: `/writing/` keeps its slash, everything else
   drops it.
3. `<head>` semantics are unchanged — title, description, canonical, `og:*`, `twitter:card`,
   feed alternate.
4. **Feed guids are unchanged.** A changed guid republishes every post into every subscriber's
   reader.
5. Dates format in UTC.
6. Drafts appear in `npm run dev` and never in a build.
7. `base` stays `"/"`.
8. The new category pages appear in **both** sitemaps — `/writing/sitemap.xml` and the
   site-wide one.

Note that invariant 8 means `/writing/sitemap.xml` stops being byte-identical to the
pre-cutover one. That is correct: it gains URLs rather than losing them.

---

## Decisions taken in the spec

Small choices that would otherwise be made silently during implementation.

- **Tag links are removed, not rebuilt.** Tags currently link to `/writing/blog?tag=…`, which
  the island read. With the island deleted those links go nowhere, so tags become mono text.
  Tag pages are deferred: two published posts do not justify a page per tag, and the URLs would
  be hard to withdraw later.
- **Eidos keeps prev/next.** I raised whether a paginated specification is a holdover from the
  SPA, since the treatise idiom is one continuous document. It is kept: the four documents are
  genuinely sequential, `order` already encodes that, and the alternative — one long page —
  changes four frozen URLs. Recorded because it was questioned and should not be re-litigated
  without a reason.
- **`/writing/` keeps a distinct page rather than redirecting to `/writing/blog`.** The URL is
  frozen and must return 200; a redirect would also strand the section's own front matter.

---

## Verification

Presentation is verified by eye; everything else is verified mechanically, as at cutover.

1. Build green; `npm test` green.
2. **Zero `<script>` tags** on every page except the treatise's inline plate observer.
3. Route list still contains the twelve, plus exactly the new category pages.
4. `<head>` diffed against the live pages for all eight shapes — identical.
5. Feed diffed against live — guids unchanged.
6. Both sitemaps contain the twelve plus the category pages, canonicalised.
7. Treatise CSS rule set unchanged as a set; treatise markup unchanged apart from the style
   block.
8. Contrast: body ≥ 10:1, muted ≥ 4.5:1 against `--ink-ground`, per §4.
9. Keyboard-only pass and a 380px-width pass, which §4 requires before any phase is done.

---

## Phases

Each ends green. Nothing deploys until the last.

**Phase 1 — v2 of the document.** Write the new components into `DESIGN-SYSTEM.md`. No code.
Approving this is approving the vocabulary everything else is built from.

**Phase 2 — foundation.** Extract `foundation.css`; prove the treatise's rule set is unchanged.
Abandonable in favour of the duplication fallback without blocking later phases.

**Phase 3 — the reference page.** One essay page, fully in the new idiom, including the code-block
treatment. **Stop and get a visual verdict here.** Disagreeing about the look on one page is far
cheaper than on eight.

**Phase 4 — propagate.** The remaining pages, in the order: essay index, Eidos document, Eidos
contents, projects, project, about, `/writing/` front matter.

**Phase 5 — static categories and the island's removal.** Category pages; delete the islands and
the React dependencies; confirm zero JS everywhere.

**Phase 6 — verify and cut over.** The full checklist above, then deploy.

---

## Deferred

- **The gears.** Not restored as a background under any reading of this system. If they return,
  it is as an engraved plate derived from something real — which, per §6, means derived from a
  repository, not decorative. That is its own design conversation and it is not this one.
- **A new `og:image`** in the v2 palette.
- **Tag pages.**
- **The two missing CI gates**, still specified in `AGENT-PROMPT.md` and still unbuilt.
