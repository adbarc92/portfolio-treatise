# Project Status — `alexanderdbarclay.com` (`adbarc92/portfolio-treatise`)

## State summary

_Last updated: 2026-08-30_

**TL;DR.** **The consolidation is done and live.** One repository now serves the whole domain:
the treatise at the root, the essays under `/writing/*`. All eight phases are complete. This
document moved here from `adbarc92/writing`, which is archived.

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

**Known gaps**

- **CI has still never succeeded** — 8 runs, 8 failures, zero steps executed. Going public
  should remove the Actions-quota cause, but the deploy job guards on a `PAGES_DEPLOY_TOKEN`
  secret **that does not exist**, so CI cannot deploy until it is added. Every deploy remains
  manual via `npm run deploy`. **A merge deploys nothing.**
- **Rollback is three steps, not one.** The design doc said re-enabling Pages on
  `adbarc92/writing` "reclaims `/writing/*` immediately." That repo published via a workflow,
  not a branch, and is now archived — so rollback is unarchive, re-enable Pages, re-run
  `deploy.yml`. The workflow is intact and last ran green on 2026-08-30.
- Two of the four gates `AGENT-PROMPT.md` specifies were never built — the link gate and the
  rendered-page claims gate. That document now says which. The merged repo is a better home for
  them, since one link gate would cover both halves.
- The two political essays are `draft: true`: prose drafted from the approved abstracts rather
  than written, and every figure in *The Price of the Ticket* needs a source.
- The React runtime is ~187 KB (~61 KB gzipped) on the blog index, to filter two published
  posts. Named rather than decided.
- `og:image` is a single site-wide card.
- This repo has no `README.md`, which is now visible to anyone who finds it.

**In flight: design system v2.** The essays are being brought onto the treatise's design system.
The [design](plans/2026-08-30-writing-design-system-v2-design.md) is merged and authoritative,
and **phases 1–3 of the [plan](plans/2026-08-30-writing-design-system-v2-plan.md) are built**:
`foundation.css` now shares tokens, faces, and layout primitives between both halves; one
`<ContentsNav>` component serves the treatise and the essays; code blocks render from a Shiki
theme built from the design system's own tokens; and the reference essay page is rebuilt in the
treatise's idiom. Measured against §6, the writing site had tripped most of the anti-patterns the
document says to reject on sight, so the scope was a rewrite of the presentation layer rather than
a restyle. **This also disposes of the gear background by deletion** — under this system there is
no animated WebGL ground — which answers the request that opened the session. **Awaiting a visual
verdict on the reference essay page** — the plan's deliberate stop — before the remaining seven
pages are touched.

**Next steps**

1. **A visual verdict on the reference essay page** — phases 1–3 are built and the plan stops
   here deliberately, before the other seven pages are touched.
2. Phases 4–6 get their own plan after that verdict, since the verdict may change the vocabulary
   they would be written against.
3. Testing and CI improvements: add `PAGES_DEPLOY_TOKEN` so a merge can deploy, and decide
   whether to build the two specified-but-missing gates.
4. Post the Eidos essay — run it through LinkedIn's Post Inspector first to prime the cache.
5. The political essays' voice pass and figure-checking, when Alex wants them.

---

## Session log

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
