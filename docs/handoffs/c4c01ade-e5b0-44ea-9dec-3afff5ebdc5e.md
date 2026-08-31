# Handoff — implement `/writing/` as the hub, and retire `/blog/`

**Written:** 2026-08-30 20:30 MDT · **Branch:** `docs/writing-hub-design` · **Session:** `c4c01ade-e5b0-44ea-9dec-3afff5ebdc5e`

## ⏳ Background operations in flight

**None.** This is a deliberate pre-implementation handoff, not an idle one. Nothing is running,
nothing is queued, no process to poll. The design and plan are written and reviewed; the code is
not started. Start from *Successor's next action*.

## Goal

`alexanderdbarclay.com` currently has three doors onto the same essays — the treatise's
`III. Essays` section, `/writing/`, and `/writing/blog`. Collapse them into a relationship: the
root **previews**, `/writing/` **lists and filters everything written**, and `/blog/` stops
existing. Essays move from `/writing/blog/<slug>` to `/writing/<slug>`.

## Read this first

- **Spec:** [`docs/plans/2026-08-30-writing-hub-design.md`](../plans/2026-08-30-writing-hub-design.md)
- **Plan (7 tasks, phases A–C):** [`docs/plans/2026-08-30-writing-hub-plan.md`](../plans/2026-08-30-writing-hub-plan.md)
- **Repo conventions and traps:** [`CLAUDE.md`](../../CLAUDE.md) — read the "Things that will bite you" section before touching anything.

Both plan documents are on this branch, in **PR #13, open and unmerged**. If you start from
`main` you will not have them.

## State

**Done and merged** (all on `main`):

| | |
| --- | --- |
| Consolidation phases 0–8 | one repo serves the whole domain; live and verified |
| Design system v2, phases 1–3 | `#12` — `foundation.css`, `ContentsNav`, a token-built Shiki theme, and **one rebuilt essay page that Alex has approved by eye** |

**Open:** PR #13 — the spec and plan this brief hands off. Nothing else.

**In flight (uncommitted):** nothing. Working tree is clean.

**Not started:** every task in the plan.

## Successor's next action

```bash
cd portfolio-website
git switch docs/writing-hub-design   # the plan lives here, not on main
npm test                             # expect 94 passing before you change anything
```

Then execute [the plan](../plans/2026-08-30-writing-hub-plan.md) from **Task 1**, in order. It is
written for subagent-driven execution but reads fine for a single agent.

Branch for the work off `docs/writing-hub-design` (or off `main` after #13 merges — but then
re-add the plan, or you are working from memory).

## The three things most likely to go wrong

**1. Feed guids.** Essay URLs are moving. The guid must stay pinned to the historical
`/writing/blog/<slug>` URL with `isPermaLink="false"`, or every subscriber receives every essay
again — once, silently, with no way to take it back. `@astrojs/rss` **cannot do this**: it
hardcodes `item.guid = { "#text": itemLink, "@_isPermaLink": "true" }` (`dist/index.js:145`) and
has no override. That is why Task 3 hand-builds the feed. Task 3 Step 7 diffs the built guids
against the live feed; **if they differ, stop — do not adjust the check.**

**2. Reserved slugs.** Essays land in the same namespace as the static routes, and Astro resolves
static routes first. An essay slugged `about`, `eidos`, `projects`, `essays`, or `category` would
build cleanly and be unreachable forever. Task 1 makes that a build failure; Task 2 Step 5 proves
the guard fires. If the build succeeds with a colliding file present, the guard is not wired in.

**3. The contrast floor.** `--plate-line-faint` is `rgba(227,217,198,0.28)` — **2.11:1** against
the ground. It is a token for rules and borders, **not a text colour**. Two separate reviews
caught it used as one during the last phase. §4 requires ≥ 4.5:1 for muted text; `--bone-muted`
is 5.16:1 and `--bone` is 13.40:1.

## Live decisions not yet in code

Settled with Alex in conversation on 2026-08-30. All are written into the spec, but the reasoning
is here because it is what stops them being re-litigated:

1. **`/writing/` previews everything** — essays, Eidos documents, and projects — not essays alone.
   Confirmed explicitly.
2. **`/blog` is retired, not restyled.** Both the index and the post URLs move. Alex accepted the
   cost knowing it, after the feed and redirect consequences were put in front of him.
3. **Redirects are soft, and cannot be otherwise.** GitHub Pages serves static files only — no
   `.htaccess`, no `_redirects`, no rewrites. Astro emits a meta-refresh page with a canonical.
   I described these as "301s" earlier in the conversation; that was wrong on this host, and the
   spec corrects it. Do not promise a 301 anywhere.
4. **The content collection is the source of truth for essays.** `claims.yaml`'s `essays:` block
   is retired and `AGENT-PROMPT.md`'s single-source rule is amended. The two lists had already
   drifted: `claims.yaml` marks *The Price of the Ticket* `draft: false` while its own file is
   `draft: true`.
5. **Phase 3's visual vocabulary is approved.** Alex reviewed the rebuilt essay page and approved
   it. Do not redesign it while moving it — Task 2 is a move with three named edits, nothing more.

## Known state Alex has not yet decided

- **Phases D and E are unplanned on purpose.** D (rebuilding `/writing/eidos*`,
  `/writing/projects*`, `/writing/about`) waits until the hub has been seen; E (the cutover) waits
  until what it cuts over is final. Do not plan them early.
- **Six writing pages currently render wrong** — they carry `class="page"` and reference dead
  `--color-*` variables from the retired stylesheet. This is recorded and expected. **Do not fix
  them**; Phase D rebuilds them and a patch now would conflict.
- **CI has never succeeded** — 8 runs, 8 failures. Every deploy is manual via `npm run deploy`,
  which is the only path that works. **A merge deploys nothing.** Reviving CI needs a
  `PAGES_DEPLOY_TOKEN` secret that does not exist.
- Alex has parked a conversation about testing and CI improvements for after this work.

## Assumptions taken while writing this brief

- The successor works in `portfolio-website/` (a gitignored clone of `adbarc92/portfolio-treatise`
  nested inside the archived `adbarc92/writing` checkout). **Running `npm run dev` one directory
  up boots the old React site** — gears, blue-grey palette and all — which has already caused one
  false alarm this session. Check `git remote -v` if anything looks wrong.
- PR #13 is assumed unmerged. If it has merged, work from `main` and ignore the branch instruction.
