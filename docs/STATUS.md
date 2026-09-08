# Project Status — `alexanderdbarclay.com` (`adbarc92/portfolio-treatise`)

## State summary

_Last updated: 2026-09-08_

**TL;DR.** **The consolidation is done and live, the `/writing/` hub with it, and as of
2026-09-07 CI deploys on its own.** One repository serves the whole domain: the treatise at the
root, everything written under `/writing/*`. Essays live at `/writing/<slug>`; `/blog/` is retired
behind soft redirects; the site ships no React. This document moved here from `adbarc92/writing`,
which is archived.

**Deployment is no longer manual.** `PAGES_DEPLOY_TOKEN` was created and set on 2026-09-07, and
the `build-gate-deploy` workflow succeeded end to end for the first time (`treatise@53eb1bd`).
Every prior CI failure — 9 of them — was that one absent secret; the guard at the top of the
deploy job did exactly what it was written to do. `npm run deploy` still works and is still the
fallback. The claim in `CLAUDE.md` that CI "has never once succeeded" is now stale.

**Open**: nothing. Working tree clean, `main` at `4c3dfca`, zero open PRs.

**Deployment, current shape.** A merge to `main` deploys. `build-gate-deploy` builds, gates,
refuses on an empty artifact, and pushes to `adbarc92.github.io`; that repo's `pages.yml`
publishes. All actions are on current majors (checkout v7, setup-node v7, upload-artifact v7,
download-artifact v8, upload-pages-artifact v5, deploy-pages v5) as of 2026-09-07 — no Node 20
deprecation annotations remain. `npm run deploy` is the fallback and still works.

**Next steps**

0. **START HERE — check whether the three plate repos have settled.** Four of the five declared
   plates do not exist; `II. Plates` is named for something most of its entries do not yet have.
   The work is **blocked on Alex, deliberately**: Command-Center, mcp-browser-bridge and Reqdrive
   were all in flight as of 2026-09-08 and he does not want a plate pinned to a moving tree. Ask
   before starting; do not begin extractor work on an unsettled repo. The findings that survive
   are in the session log below — read them before re-deriving anything.
1. **The `PAGES_DEPLOY_TOKEN` expires.** It is a fine-grained PAT, so a year at most from
   2026-09-07. Expiry does *not* trip the "not set" guard — it fails later, at the clone or push,
   as a 403. That failure signature is the thing to recognise.
2. `/writing/*` still has no background. The gear system was deliberately not ported at
   consolidation; the redesign starts from a clean slate.
3. `scripts/deploy-local.mjs` still fails on an empty diff, the gap `deploy.yml` had until #21.
   Left alone deliberately: it is interactive, so its failure explains itself at a terminal.
4. Nothing else is known-broken. The design-system audit that ran through #17 and #20 covered the
   projects and eidos routes; **the essay and category routes were not audited** for the same
   dead-class and dead-token drift.

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

**Older next steps, reconciled 2026-09-08** — this list predates the 2026-09-07/08 work and had
gone partly false. Corrected in place rather than left to contradict the list above.

1. **Phase D** - *mostly done.* `/writing/projects` and its detail page were rebuilt (#17, #26)
   and `/writing/eidos`'s index in #20. Still outstanding: the **eidos document pages** and
   **`/writing/about`**, neither of which has been rebuilt in the v2 vocabulary.
2. **Phase E** - still open: drop `/writing/blog` from `/writing/sitemap.xml` once the redirect
   pages are indexed.
3. ~~Add `PAGES_DEPLOY_TOKEN`~~ - **done 2026-09-07**; CI has deployed on every merge since. Of
   the two specified-but-missing gates, one now exists (`scripts/style-gate.mjs`, #25).
4. Post the Eidos essay - still open, and still `/writing/eidos-an-architecture-for-cheap-code`,
   not the `/writing/blog/` form. Run it through LinkedIn's Post Inspector first.
5. The political essays' voice pass and figure-checking, when Alex wants them - still open.

---

## Session log

### 2026-09-08 — The Catalogue; a style gate; and why the plates are still four short

Merged **#24, #25, #26**, all deployed. `main` at `4c3dfca`.

- **#24 — `III. Essays` → `Writing`.** `/writing/` lists essays, the specification and the
  projects, and it is the only link on the root reaching any of them; labelled "Essays" it
  advertised a third of itself. The root's own section keeps the name `Essays` — it previews only
  those. Also pinned the parity of the two `sectionList` copies (ContentsNav.astro and
  index.astro), which both feed roman numerals and silently renumber the page if they drift.
- **#25 — `scripts/style-gate.mjs`.** A site-wide audit found the essay and category routes
  **clean**, but a clean audit is worth little: three defects shipped on 2026-09-07 with one
  shape — markup referencing a CSS vocabulary that does not exist — and nothing caught any of
  them, because a class with no rule and a `var()` with no definition are both valid HTML and
  valid CSS. The gate walks `dist/` and fails the build on either. `--selftest` plants a canary
  carrying both. Shiki's `.line` is the sole `NOT_OURS` entry. `deploy-local.mjs`'s empty-diff
  throw fixed at the same time, so both deploy paths now behave alike.
- **#26 — the Catalogue (§2.17).** The site held two disjoint answers to "what has he built":
  four projects on the root from `claims.yaml`, two different ones under `/writing/projects` from
  an Astro collection, no link between them, and the word "projects" appearing nowhere on the
  root. `claims.yaml`'s new `catalogue:` is now the only source of both; `content/projects/` is
  deleted. It is a **separate block, not more `projects:` entries**, on Alex's framing: a project
  entry argues a system can be trusted and cites tests; a catalogue entry argues a product
  shipped and found a buyer, and most of that work is closed-source, so it cites the storefront —
  the one thing a reader can open. `SOURCE CLOSED` / `SOURCE OPEN` says which case each is. No
  plates, because §2.5 forbids inventing structure and a closed repo can never redeem a
  `PLATE · planned` promise. An entry citing nothing at all fails the build. `/writing/sitemap.xml`
  and `/writing/rss.xml` were diffed against a build of `main`: byte-identical. Frozen URLs held.
- Fixed while there: Portfolio Site's GitHub link pointed at `adbarc92/writing`, archived since
  the consolidation.

**The plate gap — findings to reuse, not re-derive.** Only **one plate exists** (III, Halyard).
I, II, IV and V are `planned` with `source: null` and render as a margin note only.

- **The cost is the drawing, not the extractor.** `HalyardPlate.astro` is 184 lines of
  hand-placed coordinates — every node position and bezier path chosen by hand. The extractor
  supplies the truth; the component supplies the picture. That is §2.5 working as designed
  ("derived … then composed by hand"), but it makes each plate a design task.
- A **plate-drift gate** already lives inside the component and throws when extraction and
  drawing disagree, so plates cannot rot silently — but an upstream change can break this repo's
  build until the figure is redrawn.
- **Per repo** (all three public, all present locally, all in different languages):
  - `mcp-browser-bridge` (TypeScript) — closest to ready. `src/protocol.ts` holds `ErrorCodes`
    as a pure-data literal, the shape Halyard's grammar already parses, and its error paths
    (`TIMEOUT`, `NOT_CONNECTED`, `ELEMENT_NOT_FOUND`) map onto the dashed fail-safe idiom.
  - `command-center` (Rust) — `crates/fleet-core/src/phase.rs` has `enum Phase` and
    `TERMINAL_PHASE_STRS` as pure data, but **no transition table**: `is_terminal()` and friends
    are predicates and the edges live in control flow. States are extractable, edges are not. A
    plate without edges is a list. Would need a declared transition table in *that* repo first.
  - `reqdrive` (**Bash**, `lib/*.sh`) — no literal to parse at all. Either add a declarative
    manifest there, or drop its plate rather than leave a permanent `planned`.
- **Hazard for whoever writes the next extractor.** `command-center` carries four stale
  `.claude/worktrees/`, at least one holding a `phase.rs` that **differs from the real one**.
  Halyard's extractor is safe only because it names one exact path; anything that globs for a
  filename could engrave an abandoned agent branch, stamp it with the real repo's commit hash,
  and pass every gate — the drift gate would not catch it, because extraction and drawing would
  agree with each other and both be wrong. Pin exact paths, and check whether
  `workingTreeClean` merely records or actually fails.
- **The cheaper alternative**: renumber so the plates that exist are I and II and let the rest
  appear when drawn. `claims.yaml` already concedes the numbering is provisional, and Halyard
  being PLATE III while appearing first is the visible symptom.

**Parked by Alex, 2026-09-08.** All three repos are in flight; he does not want a plate pinned to
a moving tree. Check their status before proposing any of this again.


### 2026-09-07 (wrap) — CI deploys; the actions leave Node 20

Closing state for the day. **PRs #16-#22 all merged, no open PRs, tree clean at `d61df85`.**
Sessions before this one deployed by hand; this one is the first the site published itself.

- **#22 — actions bumped off Node 20.** checkout v4→v7, setup-node v4→v7, upload-artifact v4→v7,
  download-artifact v4→v8, upload-pages-artifact v3→v5, deploy-pages v4→v5. **The dangerous one
  was `upload-pages-artifact`:** v5 added `include-hidden-files`, defaulting to `false`, which
  expands to `--exclude=.[^/]*` and would have dropped `.nojekyll` from the published artifact —
  v3 excluded only `.git` and `.github`. Set to `true` explicitly, and `.nojekyll` verified still
  serving 200 after the deploy. A naive bump would have silently changed what is published.
  `checkout` v5's breaking change concerns `pull_request_target` and both workflows are
  push-triggered; `upload-artifact` v7 and `download-artifact` v8 both keep zip/unzip by default,
  so the directory artifact still round-trips.
- **#22 also guards the deploy on a non-empty `dist/index.html`.** The step deletes the entire
  target repo before copying the artifact in, and nothing between the download and the delete had
  checked the artifact arrived intact. Added because bumping the artifact actions is precisely the
  change that could have made it matter.
- **#21 — empty deploys no longer fail the job.** `git commit` exits 1 on an empty diff, which
  `bash -e` turns into a failed job. Guarded on `git diff --staged --quiet`; verified by #21's own
  merge, which logged `gated output unchanged — nothing to deploy` and went green.
- **Verified live, not from the build**, after every merge: six routes 200 (`/`, `/writing/`,
  `/writing/projects`, `/writing/projects/hexy`, `/writing/eidos`, `/writing/eidos/architecture`),
  `.nojekyll` 200, zero dead classes in served HTML, no `var(--color-*)` in any served stylesheet.

**One thing worth carrying forward.** Three separate defects this session shared a single shape:
markup referencing a CSS vocabulary that does not exist — `.card`, `.tag`, `.tags`, then
`--color-accent`, `--color-text-muted`, `--font-mono`. None failed the build, none failed a test,
and all three were invisible until something rendered wide enough to clip. `grep -rn 'var(--'`
against the tokens `foundation.css` actually defines is a cheap check; the essay and category
routes have not had it run against them.

### 2026-09-07 (later) — `/writing/eidos` to spec, stale deploy docs corrected

Merged **#18**, **#20**, **#19** in that order, each deploying on merge.

- **#18** — the mono meta line restated on the project detail page. `foundation.css` styles
  `.entry-head .entry-meta` as a *descendant* selector; the index supplies that ancestor and the
  detail page does not, so its tech line had fallen back to body serif.
- **#20 — `/writing/eidos` had the projects page's disease, worse.** Same `.card`/§2.12 conflict,
  and underneath it **every custom property the page styled against was undefined**:
  `--color-accent`, `--color-accent-dim`, `--color-text-muted`, `--font-mono` — React-era names
  never ported, 12 references across three files resolving to nothing. So the version badge had
  no fill, ordinals and summaries were not muted, and none of the mono text was mono. Rebuilt on
  `.essay`, as `WritingIndex.astro` already renders specifications on the hub. The eidos document
  page also had `position:sticky` on its sibling nav (§2.15 forbids it in as many words) and
  marked the current sibling with the accent where §2.15 asks for `--bone`. **No undefined custom
  property remains in `src/`.**
- **#20 also corrected the docs.** `CLAUDE.md`, `AGENT-PROMPT.md` and `deploy.yml`'s header all
  described a deployment that no longer exists. `AGENT-PROMPT.md` additionally carried a wrong
  root cause — an exhausted Actions quota — where the truth was one unset secret.
- **#19 deployed nothing, as predicted.** Docs-only, so `dist/` came out byte-identical and
  `git commit` exited 1 with "nothing to commit, working tree clean". Its content was already
  live via #20. This is next-step 1.
- Verified against `https://alexanderdbarclay.com` rather than the build: six routes 200, zero
  dead classes in the served eidos HTML, no `var(--color-*)` in any served stylesheet, the mono
  meta rule present, and `position:sticky` gone from the eidos document page.

### 2026-09-07 — Hexy ships; the projects index returns to spec; CI deploys for the first time

Three merges (**#16**, **#17**, **#18** open) and one secret. The site now publishes itself.

- **#16 — Hexy added.** New `content/projects/2026-09-07-hexy.md`; sorts first by date. Source
  repo is private, so the entry carries no GitHub link — `links.itch` was added to the projects
  schema rather than reusing `links.live`, whose detail-page label ("Live Demo") misdescribes a
  storefront. Named link kinds keep the set closed, as `CATEGORIES` is.
- **The request that prompted it was aimed at the wrong repo.** It scoped the work against
  `adbarc92.github.io` as a React/Vite SPA, including a `404.html` SPA-redirect fix. That repo's
  local checkout is from 2024-11 and its `origin/main` is build output published from here, with
  **no merge base** between them. No SPA fix was applicable or made: the site is static Astro and
  every route is a real HTML file.
- **#17 — the projects index rebuilt to §2.12.** Adding an entry with eight tags exposed a
  pre-existing bug: `.card`, `.grid`, `.tag` and `.tags` were referenced by the markup and had
  **zero CSS rules anywhere**, live included. Unstyled, `.tag` spans were inline text inside
  `.entry{overflow:hidden}` — measured at 1440px, "playwright" overflowed its card by 5px and
  "github-actions" by 49px. The styles were missing because §2.12 forbids the structure
  ("never cards, never a grid") and §6 lists card grids as reject-on-sight; the page had drifted
  from the spec and the dead classes were the fossil. Rebuilt on what `foundation.css` defines —
  `article.entry`, `.entry-head`, `.entry-meta`, `.body-grid`, `.margin-note` — the same
  vocabulary `WritingIndex.astro` already uses for projects on the hub. Net −31 lines. Verified by
  instrumenting the rendered page against every `overflow:hidden` ancestor: 0 clipped at 1440px
  and at 375px, `scrollWidth == clientWidth`.
- **#18 — follow-up, open.** `foundation.css` styles `.entry-head .entry-meta` as a *descendant*
  selector. The index supplies that ancestor; the detail page does not, so its tech line fell back
  to body serif rather than the mono meta line #17 claimed for it. Caught by screenshotting the
  live page after deploying, not by the build.
- **CI works; it was never broken.** `gh secret list` was empty. The `build` job had been passing
  every step all along — install, tests, build, gate selftest, gate, artifact — and only `deploy`
  failed, on its own `test -n "$PAGES_TOKEN"` guard. A fine-grained PAT scoped to
  `adbarc92.github.io` alone (Contents RW, Workflows RW) was set as `PAGES_DEPLOY_TOKEN`;
  `build-gate-deploy` then went green, pushed `deploy: treatise 53eb1bd`, and the target's
  `pages.yml` published it. Verified against `https://alexanderdbarclay.com`, not the build: all
  three project URLs 200, Hexy's eight tags rendering in full, zero dead classes in the served
  HTML, the itch.io link present and no `github.com` reference anywhere on its page.
- **Notes for whoever touches the deploy next.** The target has no `CNAME` file — the custom
  domain lives in Pages settings (`build_type: workflow`), so `deploy.yml`'s `if [ -f site/CNAME ]`
  is a permanent no-op. `deploy-target/pages.yml` is byte-identical to what is installed, so the
  push carries no workflow-file diff today; `workflow` scope is held for the day it does. And if
  `dist/` ever comes out byte-identical to what is live, `git commit` exits non-zero and fails the
  job under `bash -e` — that is not a token problem.

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
