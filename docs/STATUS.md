# Project Status — `alexanderdbarclay.com` (`adbarc92/portfolio-treatise`)

## State summary

_Last updated: 2026-08-31_

**TL;DR.** **The consolidation is done and live, and so is the `/writing/` hub.** One repository
serves the whole domain: the treatise at the root, everything written under `/writing/*`. All eight
consolidation phases and the hub's Phases A-C are complete and **deployed** (`treatise@e9fa18c`,
2026-08-31). Essays now live at `/writing/<slug>`; `/blog/` is retired behind soft redirects; the
site ships no React. This document moved here from `adbarc92/writing`, which is archived.

**Where things live**

| Repo | Role | Visibility |
| --- | --- | --- |
| `adbarc92/portfolio-treatise` | this one — the source for the whole site | public |
| `adbarc92/adbarc92.github.io` | publish target, build output only | public |
| `adbarc92/writing` | **archived** — the essays' former home, kept for rollback | public |

**Phases** — all merged.

| | Phase | |
| --- | --- | --- |
| 0 | Land the five orphaned PRs | done |
| 1–2 | Scaffold; content and collections | done |
| 3–4 | `/writing/*` routes; the filter island | done |
| 5–6 | Feed, sitemap, metadata parity; one test runner | done |
| 7 | **Cutover — deployed and verified 2026-08-30** | done |
| 8 | Cleanup — docs folded in, `CLAUDE.md` written, `AGENT-PROMPT.md` corrected, old repo archived | done |

**Verified at cutover** — against the live site, not the build.

| Check | Result |
| --- | --- |
| All 12 `/writing/*` URLs | 200, served by the new deployment |
| Essay canonical, `og:image`, `og:title`, `twitter:card` | intact; the OG card resolves |
| `/writing/rss.xml` | 200, **guids unchanged** — no post republished |
| `/writing/sitemap.xml` | 200, byte-identical to the pre-cutover one |
| `/sitemap-index.xml` | 200 — now covers the treatise *and* the essays |
| Treatise root | 200, byte-identical to its pre-consolidation build |
| Build / tests / gate | green; 90 tests; content gate and canary clean |

**Decisions that departed from the design doc**

- **The gear background was not ported.** The doc pairs it with the category filter in phase 4;
  only the filter was built, because porting ~1,700 lines and a ~2 MB Three.js bundle already
  slated for redesign is work spent carrying across the thing being replaced. **`/writing/*`
  currently has no background** — the redesign starts from a clean slate rather than a refactor.
- **`node:test` stays the single runner.** The doc chose Vitest "because it is the larger
  suite" — 41 against 11. That arithmetic died: this suite is now 90, and almost none of the
  old repo's 41 had anywhere to go, since they covered `escape.ts`, `marked` configuration, and
  `BASE_PATH` helpers the migration deletes. All 41 were audited against what replaced them
  before this was decided; no coverage was lost.

**The `/writing/` hub - Phases A-C, live.** The root's `III. Essays`, `/writing/`, and
`/writing/blog` were three doors onto the same essays. The [hub design](plans/2026-08-30-writing-hub-design.md)
and its [plan](plans/2026-08-30-writing-hub-plan.md) (both merged, #13) collapsed them: the root
**previews**, `/writing/` **lists and filters everything written**, and `/blog/` is gone.
Implemented and merged in **#14**, deployed and verified live the same day.

| Verified against the live site | Result |
| --- | --- |
| All 15 URLs - new, old, feed, sitemaps | 200 |
| `/writing/blog/*` | soft-redirect pages: meta refresh + canonical to the new URL |
| **`/writing/rss.xml` guids** | **byte-identical to the pre-deploy feed - nothing republished** |
| Feed `<link>` / `isPermaLink` | new URLs / `"false"` |
| Treatise root | `plates`, `workshop`, `author` byte-identical; only `essays` changed |
| Hub | 0 `<script>`, 0 React, chips and counts correct |
| Contrast | bone 13.40:1, muted 5.16:1; `--plate-line-faint` (2.11:1) borders only |

**What the hub changed structurally**

- **Essays moved** `/writing/blog/<slug>` to `/writing/<slug>`. Old paths persist as redirect
  pages. **These are soft redirects, not 301s** - GitHub Pages serves static files only, so no
  server-issued redirect is possible on this host. Do not describe them as 301s.
- **The feed is hand-built** (`src/lib/feed.mjs`). `@astrojs/rss` hardcodes `guid` to the item
  link with no override, so keeping it would have republished every essay to every subscriber.
  Guids are pinned to the historical `/writing/blog/<slug>` URLs with `isPermaLink="false"`.
  `@astrojs/rss` is uninstalled.
- **`claims.yaml`'s `essays:` block is retired**; `content/blog/` is the only essay list, and
  `AGENT-PROMPT.md`'s single-source rule is amended accordingly. The two lists had already
  drifted - claims.yaml marked *The Price of the Ticket* `draft: false` against its own file's
  `draft: true` - so that essay correctly stopped appearing.
- **A reserved-slug guard** (`src/lib/reserved-slugs.mjs`) fails the build if an essay slug would
  be shadowed by a static route under `src/pages/writing/`.
- **The React island is gone**, and React with it. One `<script>` remains site-wide: the
  treatise's inline plate observer.
- `/writing/blog` is **deliberately still listed** in `/writing/sitemap.xml` - the design's risk 1
  requires redirect pages indexed before the sitemap drops the old URLs. Phase E removes it.

**Known gaps**

- **CI has still never succeeded** - 8 runs, 8 failures, zero steps executed. The deploy job guards
  on a `PAGES_DEPLOY_TOKEN` secret **that does not exist**, so CI cannot deploy. Every deploy is
  manual via `npm run deploy`. **A merge deploys nothing.**
- **Rollback is three steps, not one** - unarchive `adbarc92/writing`, re-enable Pages, re-run its
  `deploy.yml`. Note this now also predates the URL move.
- Two of the four gates `AGENT-PROMPT.md` specifies were never built - the link gate and the
  rendered-page claims gate.
- **Six `/writing/*` pages still render wrong** - `/writing/eidos`, its four documents,
  `/writing/projects`, its detail page, and `/writing/about` carry `class="page"` and reference
  dead `--color-*` variables. Expected: **Phase D rebuilds them.**
- **The Eidos documents list in reverse on the hub** (Infrastructure 04 above Architecture 01).
  `specDate = order * 1000` plus a newest-first sort does it. Alex reviewed and accepted it;
  `new Date(-order * 1000)` would restore 01 to 04 and still pass every test.
- The two political essays are `draft: true`, pending Alex's voice pass; every figure in *The
  Price of the Ticket* needs a source. They are listed with `[DRAFT]` badges in `npm run dev`
  and never in a build.
- `og:image` is a single site-wide card, still in the pre-v2 palette.
- This repo has no `README.md`.

**Next steps**

1. **Phase D** - rebuild `/writing/eidos`, its documents, `/writing/projects`, its detail page,
   and `/writing/about` in the approved v2 vocabulary. Needs its own plan; the hub is now visible,
   which was the precondition.
2. **Phase E** - the cutover's remaining tidy-up: drop `/writing/blog` from `/writing/sitemap.xml`
   once the redirect pages are indexed.
3. Testing and CI improvements, parked by Alex: add `PAGES_DEPLOY_TOKEN` so a merge can deploy at
   all, and decide whether to build the two specified-but-missing gates.
4. Post the Eidos essay - **its URL has now moved**, so post
   `/writing/eidos-an-architecture-for-cheap-code`, not the `/writing/blog/` form. Run it through
   LinkedIn's Post Inspector first to prime the cache.
5. The political essays' voice pass and figure-checking, when Alex wants them.

---

## Session log

### 2026-08-31 - The `/writing/` hub ships; `/blog/` is retired (PR #14)

Implemented all seven tasks of the [hub plan](plans/2026-08-30-writing-hub-plan.md), Phases A-C,
from the [handoff brief](handoffs/c4c01ade-e5b0-44ea-9dec-3afff5ebdc5e.md). Merged as **#14** and
**deployed** (`treatise@e9fa18c`); Pages published in 23s and every check was re-run against the
live site afterwards.

- **Tasks 1-2** - reserved-slug guard, then essays moved to `/writing/<slug>` with
  `astro.config.mjs` `redirects` covering `/writing/blog` and `/writing/blog/[slug]`. Guard proven
  by planting a colliding file: build exits 1, clean after removal.
- **Task 3** - the feed hand-built so guids survive the move. Diffed against the **live** feed
  before and after deploying: byte-identical. `@astrojs/rss` uninstalled.
- **Task 4** - the root previews `content/blog/`; `claims.yaml`'s `essays:` block and
  `AGENT-PROMPT.md`'s single-source rule retired. The drift published nothing: *The Price of the
  Ticket* correctly disappeared from the root.
- **Tasks 5-6** - `writing-index.mjs` gathers the three collections into one ordered list;
  `/writing/` rebuilt as the hub with `/writing/essays` and `/writing/category/<id>`. Chips are
  prerendered links, no client JS.
- **Task 7** - `BlogList`, `CategoryFilter`, `post-filter` and React deleted. Net **-1,030 lines**.

**Departures from the plan, all deliberate.** `ContentsNav.astro` also read `claims.essays` and
would have broken the build - repointed at the collection. Added `src/components/WritingIndex.astro`
so the hub and its two filtered views share one layout. Fixed a stale `/writing/blog/...` link on
the eidos index (the design's risk 3). Restored dev-only draft visibility on the hub, which the
plan did not specify and a first pass had dropped - that is where Alex's voice pass happens. The
plan's `@astrojs/rss` removal guard matched its own explanatory comments, so real imports were
checked instead; its brass check read the HTML while the CSS is a linked file, so the stylesheet
was checked directly.

**State delta.** Essays are at `/writing/<slug>`; `/blog/` exists only as redirect pages; the site
ships no React and one `<script>` total; `content/blog/` is the sole essay list. Tests went 94 to 99
(post-filter's 21 removed, 26 added; the category-drift guard was carried across and re-proven).
Phases D and E remain unplanned by design.

### 2026-08-30 (hub) — Design system v2 lands; `/writing/` is redesigned around it

- **Merged design system v2, phases 1–3** (#12): `foundation.css` extracted verbatim from
  `treatise.css`, one shared contents nav, a Shiki theme built from the site's own tokens, and one
  essay page rebuilt in the treatise's idiom. Subagent review caught four defects **in the plan**
  that implementers had transcribed faithfully — three contrast violations (2.11:1 and 2.49:1
  against a 4.5:1 floor) and a contents nav that emitted `/#essays`, silently orphaning four frozen
  URLs from site navigation. All fixed; the code theme now asserts its own contrast floor.
- **Alex reviewed the reference page and approved it**, then identified the real problem: the site
  had three indexes of the same essays, and `/writing/` needed conceptual work rather than styling.
- **Designed and planned the hub.** Two findings changed the design while writing it. GitHub Pages
  serves static files only, so **no true 301 is achievable** — Astro's redirects are meta-refresh
  pages, which search engines treat as soft. And `@astrojs/rss` **hardcodes the guid to the item
  link** with no override, so with essay URLs moving it cannot be used without republishing every
  post into every subscriber's reader; the feed is hand-built with the guid pinned to the
  historical URL.
- **Handed off before implementation**, at Alex's request:
  [`handoffs/c4c01ade-…`](handoffs/c4c01ade-e5b0-44ea-9dec-3afff5ebdc5e.md).

### 2026-08-30 (phases 1–3) — Design system v2, built

Implemented the plan's phases 1–3 in `portfolio-website` on `feat/design-system-v2-phases-1-3`,
task-by-task, then closed a whole-branch review's six findings.

- **Extended `DESIGN-SYSTEM.md`** with §§2.10–2.16 and extracted `src/styles/foundation.css`
  verbatim from `treatise.css`, so both halves of the site now share one set of tokens, faces,
  and layout primitives. The treatise's rendered output did not move — checked by diff at every
  step.
- **One `<ContentsNav>` component** now serves the treatise and the essays, replacing the
  inline nav that only ever emitted anchors. Its link logic moved into a plain, tested function
  (`src/lib/contents-nav.mjs`) once review caught that the off-root anchors it had been emitting
  orphaned `/writing/*` from the contents nav — `III. Essays` now points at `/writing/` per
  §2.10, and the treatise's markup is unchanged apart from that one href.
- **A Shiki theme built from the design system's own tokens** (`src/lib/code-theme.mjs`)
  replaced `github-dark`. Review also caught that its original oxblood keyword colour measured
  2.49:1 against the ground, below §4's 4.5:1 floor for muted text at code-block scale; keywords
  are now `--bone`, bold — distinguished by weight, not a hue that failed the floor. `--oxblood`
  is not a design-system token change, it is a correction of what §2.14 mandated in error.
- **The reference essay page** (`/writing/blog/hello-world`) is rebuilt on the body grid, in the
  treatise's idiom, with zero client JS. This is the plan's Phase 3 stop: a visual verdict on
  this one page before the other seven are touched.
- Also fixed while reviewing: the v2 preamble undercounted its own sections (§§2.10–2.15 →
  2.10–2.16); the plan still named `.doc-nav` as a Phase 4 convention after a later commit
  correctly deleted it as unused; and `foundation.css` gained `img{max-width:100%;display:block}`
  — dropped along with old `writing.css`, harmless today because no essay carries an image yet,
  but the next one that does would have overflowed the measure.

### 2026-08-30 (design) — The essays join the treatise's design system

Design and plan only; no site code changed.

- **Merged the v2 design** (#10). Scope was measured against `DESIGN-SYSTEM.md` §6 rather than
  asserted: the writing site trips the blue-grey ground, card grids with radii, navbar chrome, a
  third typeface, and brass spent decoratively — five of the six anti-patterns the document says
  to reject on sight — and breaks §4's zero-JS floor on one page. So the spec says plainly that
  this is a rewrite of the presentation layer, not a restyle.
- **The gear background is disposed of by deletion.** Under this system there is no animated
  WebGL ground; gradients are banned and the whole motion inventory is "plates draw themselves,
  links thicken on hover." If the gears return it is as an engraved plate derived from a real
  repository, which is a different conversation.
- **Wrote the plan for phases 1–3**, stopping at the spec's visual-verdict gate. Writing tasks
  for eight pages before agreeing what one page looks like would be waste.
- Two findings while planning. `.entry` and `.essay` already exist in `treatise.css`, so the
  index vocabulary is reusable rather than inventable. And `.cite-mark` — the brass `↳` — is part
  of the citation system, so the essays' editorial margin notes must not use it; a redesign that
  did would reintroduce the exact brass-as-decoration violation it exists to fix. That became
  §2.16.

### 2026-08-30 (cutover) — Phases 7 and 8: the consolidation is live

The site is now served from one repository. Full detail in the phase PRs; the short version:

- **Deployed** `treatise@c5e6581` to the publish target, gates first. The root updated while
  `/writing/*` was still served by the old project site — both correct, exactly the window the
  design predicted. Disabling Pages on `adbarc92/writing` handed the path over.
- **Verified against the live site**, not the build: all twelve URLs 200 from the new
  deployment, the essay's canonical and OG card intact, the feed's guids unchanged so no post
  republished, both sitemaps serving, and the treatise root byte-identical to what it had been.
- **Made `portfolio-treatise` public**, per the design's fixed decision. This also releases the
  private Actions quota that was the probable cause of eight straight CI failures — though CI
  still cannot deploy, because `PAGES_DEPLOY_TOKEN` does not exist.
- **Folded `docs/` across** from the absorbed repo — this file, the handoff, and ten plans —
  wrote the `CLAUDE.md` the treatise never had, and corrected `AGENT-PROMPT.md`, which claimed
  four CI gates when two are built and described a CI pipeline that has never run a step.
- **Archived `adbarc92/writing`.** Kept rather than deleted so the cutover stays reversible,
  though rollback is now three steps rather than the one the design doc described.

Two things the plan got wrong, recorded because both would mislead a later reader: rollback is
not a single switch, and `adbarc92/writing` will now fail any push to main, since its
`deploy.yml` targets a Pages site that no longer exists. Archiving stops that.

### 2026-08-30 (later) — Consolidation phases 5 and 6

Metadata parity and the test-runner question. Merged as PR #8 in `portfolio-treatise`. Still
nothing deployed.

- **Phase 5 — parity.** The full head on every page: author, the Open Graph set, `twitter:card`,
  the feed's alternate link, and `og:type` of `article` on posts, specs, and projects. Verified by
  diffing the built `<head>` of all eight page shapes against the live pages, and the feed and
  sitemap against theirs. All identical.
- **Three things that would have broken quietly.** The OG image was not in the treatise repo at
  all — every live page references `/writing/images/og.png`, which existed only here, so the cards
  would have 404'd at cutover with nothing in the build to hint at it. `@astrojs/rss` appends a
  trailing slash to item links by default, and the item link is the guid, so every old post would
  have republished into every subscriber's reader as new. And the emitted sitemap kept a trailing
  slash the canonicals drop, pointing search engines at URLs that redirect to the canonical form.
- **The site-wide sitemap now covers the treatise and the essays together**, which neither half
  could do while they were separate builds. `/writing/sitemap.xml` is kept beside it, byte-identical
  to the live one, because search engines have already fetched that URL.
- **Phase 6 — the runner.** The design doc's premise was stale; see the decisions section above.
  The audit verified rather than assumed that Astro's pipeline still renders GFM tables and still
  highlights all three code blocks — under `github-dark`, the same theme `highlight.js` used, so
  that risk was smaller than feared. It also caught Shiki inlining its theme's background onto the
  `<pre>`, which beat the stylesheet and left code blocks as GitHub-coloured panels inside the
  site's own border. A transformer drops that one declaration and keeps Shiki's token colours.
- **The filter island was checked in a browser** and works, closing the one gap tests could not.

### 2026-08-30 — Consolidation phases 3 and 4

Built the essay routes and the category filter in `portfolio-treatise`. Opened as a stacked pair,
#6 then #7. Nothing deployed.

- **Phase 3 — routes.** Eight page files under `src/pages/writing/` emitting the twelve URLs the
  live sitemap lists, verified by diffing the emitted route list against it rather than by
  inspection. The prefix comes from the directory, not from config: `base` stays `"/"` so the
  treatise does not move with it. Three plain modules carry logic the structure cannot: UTC date
  formatting, the draft rule, and a remark plugin restoring the `/writing` prefix on the four
  root-relative links content authors already wrote.
- **Fixed a latent defect in the content gate.** Pointing it at essay prose for the first time
  failed the build twice, on text mentioning nothing retracted — `rediscovered` matched "Redis" as
  a substring, and `restored is` matched it once whitespace was stripped. Both were false positives
  from an unbounded matcher. Terms now match on word boundaries while still tolerating mangling, so
  `R-e-d-i-s` and `ChromeWebStore` are still caught. No term was removed; scoping was not available
  as the fix, because the false positives were in reader-facing prose.
- **Phase 4 — the filter island, narrowed.** Only the category filter was built. The gear
  background was left for its own phase rather than ported, since it is already slated for
  redesign. The island server-renders, so a reader without JavaScript still sees every essay.
- **Corrected this document**, which had described phases 1 and 2 as unreviewed open PRs some hours
  after they merged, and clarified that the survivor repository is named `portfolio-treatise` while
  its clone directory is `portfolio-website`.

### 2026-08-29 — Embargo lift, funnel closed, consolidation begun

Long session across three repositories. Full detail in
[`handoffs/fd313ec2-4ab1-4de7-806e-bd92f74a42b1.md`](handoffs/fd313ec2-4ab1-4de7-806e-bd92f74a42b1.md).

- **Lifted the embargo** in the treatise. The gate was doing three jobs and only one was the
  embargo — it also holds the retracted-claims list and the banned vocabulary, neither of which
  lifted — so it was renamed `content-gate.mjs` and kept rather than deleted, and its canary was
  promoted from a CLI flag into real tests.
- **Closed the funnel.** The front page had no path to the essays. The cause was not a missing
  link: the Essays section was gated on `url: ""`, exactly as designed. Filling it opened the
  section. Discovered while verifying that **the treatise's CI has never once succeeded** and every
  deploy has been manual — the merge alone would not have shipped it. Deployed by hand; the root
  now links to Eidos.
- **Drafted the two political-economy essays** the treatise had specified since July, under the
  `politics` category, `draft: true`.
- **Corrected documentation drift** in both repos: two plan premises that later tasks overturned,
  and a deploy target that was never used.
- **Began consolidation.** Design merged; phases 1 and 2 built. Registering React broke the content
  gate on `case"seamless":` inside React's attribute table, which surfaced a real defect — the two
  term lists needed different scopes, and now have them.

### 2026-08-28 — Repo hygiene and documentation refresh

Audited the repo and reconciled git, GitHub, and the docs. Found `CLAUDE.md` badly drifted from reality and the local branch topology pointing at the wrong remote.

- Rewrote `CLAUDE.md` against verified facts: the gear background is Three.js/WebGL (not SVG), a test framework *is* configured (Vitest, 40 tests), the build ends in a prerender step, the content pipeline is split across `markdown`/`frontmatter`/`site`/`dates`/`escape`, and the pages list now includes Eidos. Replaced the obsolete `master` / `new` branch section with a Remotes and branches section that spells out which repository actually publishes what.
- Retargeted local `main` onto this project's `main` (verified lossless — it was a strict ancestor) and repointed its upstream away from the treatise repo.
- Deleted the merged `feat/essays-and-taxonomy` and `fix/og-card-and-contact-links` branches.
- Dropped the treatise repository as a remote and renamed `writing` → `origin`, so bare `git push` / `git fetch` now act on this project rather than on the treatise's publish branch.
- Enabled HTTPS enforcement on the repo's Pages settings (`https_enforced` was `false`).
- Added `portfolio-website.zip` to `.gitignore`.
- Created this file.

### 2026-08-15 — Open Graph card and real contact links (PR #1)

Closed the two gaps that stood between the site and being worth promoting.

- Generated a 1200×630 Open Graph card in the site palette and set `SITE.image`; the existing prerender wiring picked it up and flipped `twitter:card` to `summary_large_image`.
- Replaced the `yourusername` placeholders on `/about` with the real GitHub and LinkedIn profiles.
- Marked the essays-and-taxonomy plan as shipped and corrected the design doc's status header.

### Earlier — Essays, taxonomy, and the Eidos section

Fifteen-task plan delivered across `feat/essays-and-taxonomy`: category taxonomy and draft state, prose styles, the Eidos essay and its four specification documents, category filtering, per-page head metadata, static prerendering, RSS and sitemap, a Vitest suite for the pure logic, and the move to serving from `/writing` as a Pages project site. See [`plans/2026-08-10-essays-and-taxonomy-plan.md`](plans/2026-08-10-essays-and-taxonomy-plan.md).
