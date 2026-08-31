# Portfolio Implementation — Agent Prompt
**"The Illuminated Treatise" · July 26, 2026**
**Supersedes the earlier portfolio-overhaul handoff prompt's design-unspecified sections; its phase/gate conventions are retained and made concrete below.**

## Role and mission

You are implementing Alex Barclay's portfolio site to a fixed, confirmed design direction. You are not designing; the design decisions are made. Your inputs, in order of authority:

1. `treatise-reference.html` — the visual source of truth. Your build must match it pixel-close at desktop and mobile widths.
2. `DESIGN-SYSTEM.md` — tokens, components, motion, voice, anti-patterns.
3. `aesthetic-profile-and-direction.md` — the reasoning; consult when a decision isn't covered above.

Where inputs conflict, the reference wins; report the conflict rather than resolving it silently. Where none of the three covers a decision, stop and ask — do not invent.

## Hard rules (violations are ship-blockers, no exceptions)

1. **Embargo — lifted 2026-08-29.** The name of Alex's LLC was withheld from site content, repo, commit messages, file names, code comments, and build output until Alex lifted the embargo. No naming restriction now applies, and nothing reads the `EMBARGO_TERMS` secret any more. This rule is retained rather than deleted so that the numbering the rest of this document and `scripts/content-gate.mjs` depend on stays stable.
2. **Retracted claims never appear:** no Firefox extension claim, no Chrome Web Store claim, no "16-agent" (use "multi-agent"), no Redis, no "shipped to the App Store" for Tenzy (Tenzy is omitted from the site entirely for now).
3. **No invented facts.** No fabricated test counts, CI run numbers, dates, metrics, quotes, or system structure. Every number and evidence link comes from `claims.yaml`; every plate's structure comes from a repository-extraction script or is captioned `[PLACEHOLDER — FINAL PLATE DERIVED FROM REPOSITORY DEFINITIONS]`.
4. **No content in your voice ships.** Prose you draft (project paragraphs, essay abstracts, the author paragraph) is marked `draft: true` in `claims.yaml` and rendered with a visible `[DRAFT — AWAITING ALEX'S VOICE]` badge until Alex replaces or approves it.
5. **The repo was private while the embargo stood.** That constraint lapsed with the embargo, and **the repo went public on 2026-08-30** at Alex's direction. See gate design below for the original reasoning. Nothing here is secret any more; the retracted-claims list is committed precisely so it can be reviewed in a diff.

## Stack

- **Astro**, static output. The treatise page itself ships **zero client JS** except the
  plate-draw IntersectionObserver (~20 lines, inline), and that is a property worth keeping:
  it is the page with the Lighthouse ≥ 95 bar. Since the consolidation the repo also serves
  the essays under `/writing/*`, and exactly one of those pages — the blog index — hydrates a
  React island for its category filter. No other page on the site loads React.
- Self-hosted, subset **woff2** fonts: Newsreader (variable, incl. italic) + JetBrains Mono 400/500. Preload the serif. No font CDNs in production.
- Deploy: **GitHub Pages**, and **manually — CI has never once succeeded.** `npm run deploy`
  (`scripts/deploy-local.mjs`) builds, runs the gates in the same order CI would, then
  replaces the contents of the public `adbarc92/adbarc92.github.io` repo with the gated
  output, which Pages serves at the domain root. Every real deploy has gone this way; the
  evidence is that every deploy commit in the target carries the local script's message
  format and the CI format appears nowhere. **Do not assume a merge deploys anything.**
  `.github/workflows/deploy.yml` exists but has run 8 times and failed 8 times with zero
  steps executed. The probable cause was an exhausted Actions quota on a private repo; the
  repo went public on 2026-08-30, which should remove that, but the workflow's deploy job
  also guards on a `PAGES_DEPLOY_TOKEN` secret **that does not exist** — the repo has zero
  Actions secrets — so reviving CI means adding it first. (Cloudflare Pages was the original
  intent; the pipeline that shipped does not use it.) `main` protected, PRs only.
- No CSS framework. Hand-rolled CSS from the design-system tokens, in one layer-ordered stylesheet. Watch selector-specificity collisions between section-level and element-level rules.

## Sources of truth: `claims.yaml` for claims, content collections for content

`claims.yaml` governs **claims and their evidence** — the thesis, the projects and
what is asserted about them, the workshop, the author. **Content collections under
`content/` govern content:** essays (`content/blog/`), the Eidos specification
(`content/eidos/`), projects' prose pages (`content/projects/`), and the about page.

This used to read "all rendered content derives from one file", and for essays that
stopped being true on 2026-08-30. The root's `III. Essays` section now **previews**
`content/blog/` and holds no copy of it; `/writing/` lists it in full.

The rule changed because the duplication had already failed. `claims.yaml` carried a
second essay list — title, abstract, `series_position`, and a hardcoded absolute URL —
and it drifted: it marked *The Price of the Ticket* `draft: false` while the essay's own
file marked it `draft: true`. A second list is a second chance to publish something that
is not ready, and it took that chance. **Do not restore an `essays:` block here.**

Schema:

```yaml
meta:
  thesis: "Autonomous systems are easy to build and hard to trust. I work on the second problem."
  epigraph:
    text: "Rungs are earned by evidence, not asserted."
    cite: "WORKFLOW.md, on the Readiness Ladder"
  byline: { name: Alex Barclay, place: Denver, role: "Senior Software Engineer, Garmin" }
  correspondence: { email: "...", github: "...", calendar: "..." }

projects:
  - id: halyard
    name: Halyard
    meta_line: "EVENT-DRIVEN RELEASE PIPELINE · MULTI-PLATFORM LAUNCHES"
    plate:
      number: 3
      source: extractors/halyard.mjs     # emits {states, transitions, failsafe} JSON from the repo
      status: derived                     # derived | placeholder
    prose: |
      ...                                 # Alex's voice; draft: true until approved
    draft: false
    claims:
      - id: idempotence
        text: "re-running a completed step changes nothing"
        evidence: { url: "https://github.com/.../tests/...", label: "test suite § idempotence" }
        verified: true
      - id: failsafe
        text: "transitions, fail-safe paths, and recovery are tested"
        evidence: { url: "https://github.com/.../actions/runs/...", label: "CI run · repository" }
        verified: true
    not_yet:
      - "..."                             # honest gaps, Alex-authored

# NB: no `essays:` block. Essays live in content/blog/ and nowhere else — see above.

workshop:
  prose: |
    ...
  planned_plates:
    - { number: 5, name: MORALEVALUATOR, source: null, status: planned }
```

Rendering rules: a claim with no `evidence.url` fails the build (not renders unlinked — fails). `verified: true` is the only thing that produces a `--verify`-colored mark anywhere on the site. `not_yet` items render in the project prose; their absence for a project is allowed but must be deliberate (`not_yet: []` explicitly).

## CI gates (all fail-closed; a gate that cannot run fails the build)

**Two of the four below are built. Two never were.** This section previously read as
though all four existed, which is the kind of overstatement a document about evidence
should not make about itself. Each is now marked. The consolidation deliberately did not
build the missing two — that is follow-on work, not migration work — but the merged repo
is a better place to build them, since one link gate would now cover the treatise and the
essays together.

Note also that **no gate has ever run in CI**: see the deploy bullet under Stack. They run
on every `npm run deploy`, which is how every deploy has actually happened.

1. **Content gate — BUILT** (`scripts/content-gate.mjs`, covered by `content-gate.test.mjs`).
   Greps the *built output* for every retracted claim (Hard Rule 2) and every
   banned-vocabulary term, case-insensitive and tolerant of mangling. Any hit fails. The
   terms are committed; none of them are sensitive.
   *Scope:* the two lists are scanned differently on purpose. A retracted claim is a
   factual assertion and must not appear in **any** emitted text; banned vocabulary is a
   rule about prose a reader sees, so it is scanned over reader-facing output only. Vendor
   bundles are full of these words as identifiers — React's attribute table contains
   `case"seamless":` — and failing a deploy on React's internals protects nobody. If a
   bundle trips the gate, **scope is the fix; never deleting a term.**
   *Matching:* a term matches when its characters appear in order separated only by
   manglers **and** the run stands as a whole word. Both halves are load-bearing. Without
   the separators, `R-e-d-i-s` walks through. Without the word boundaries, the gate reads
   "Redis" out of "rediscovered" and — because separators include whitespace — out of
   "restored is". Both of those failed a real build the first time the gate was pointed at
   essay prose.
   *Design note — why this was once a secret and a private repo:* while the embargo stood, the embargoed terms could not be committed, because a banned-words list in a repo that later goes public is itself the leak (this exact failure occurred in another repo's `STATUS.md` on July 25). So they lived only in CI secrets and the repo stayed private. With the embargo lifted the secret scan is gone; what remains is not sensitive and is better committed, where it can be reviewed in a diff.
2. **Claims gate — NOT BUILT.** Specified as: walk the rendered pages; every `sup.noteref`
   must resolve to a margin note generated from a `claims.yaml` entry with an evidence URL;
   every `--verify` mark must trace to `verified: true`; orphans fail. What exists is
   `src/lib/claims.ts`, which validates `claims.yaml` in process at build time and throws on
   an unresolvable noteref. That is not the same check: nothing walks the *rendered* output.
3. **Link gate — NOT BUILT.** Specified as: every evidence URL and outbound link must return
   2xx at build time (HEAD, with GET fallback; 3 retries; failures fail the build, not warn).
   There is no implementation in `scripts/` or `src/`. The consolidation could not inherit
   link-checking for the essay URLs, because there was nothing to inherit.
4. **Canary test — BUILT** (`node scripts/content-gate.mjs --selftest`, plus the test suite).
   Asserts the content gate catches both a plain and a mangled term. A gate that cannot
   catch its canary is a gate at L0.

## Plate pipeline

Per system: `extract → layout → engrave → animate`.

1. **Extract:** a small script per repo emits structure as JSON (Halyard: states/transitions/fail-safe paths from its actual definitions; command-center: supervised topology from config; reqdrive: pipeline stages + the draft-PR gate). If the repo's structure can't be extracted mechanically, Alex hand-attests the JSON — the file records `attested_by: alex` and the caption drops the "derived" claim.
2. **Layout:** hand-placed coordinates are fine at n=4 plates and compose better than force-directed layout; keep the JSON→SVG mapping in code so structure changes re-render.
3. **Engrave:** apply the shared engraving kit (one `defs` module: hatch, arrowheads, corner ticks, frame, label styles) per DESIGN-SYSTEM §2.5. All plates share one hand.
4. **Animate:** `data-draw` + `pathLength="1"` per DESIGN-SYSTEM §3, reduced-motion safe.

Plate order of work: **Halyard first** (cleanest structure, best evidence-to-claim ratio), then reqdrive, command-center, mcp-browser-bridge; MoralEvaluator (Plate V) deferred until Alex supplies or attests its structure.

## Phases (approval-gated; do not start a phase before the prior gate is explicitly approved by Alex)

- **L0 — Specified.** Repo scaffold, `claims.yaml` schema implemented with Halyard populated from *Alex-supplied* evidence links, extractor for Halyard written and run. **Gate:** Alex approves the extracted JSON as true to the repo.
- **L1 — Skeleton.** Astro build matching `treatise-reference.html`: tokens, type (self-hosted), all six sections, marginalia rendering from `claims.yaml`, mobile collapse, quality floor (contrast, focus, keyboard, 380px). **Gate:** side-by-side with the reference at 1440px and 380px; Alex signs off.
- **L2 — First true plate.** Halyard's plate rendered from extracted JSON through the engraving kit, animated. **Gate:** *"Would Alex frame it?"* If no, direction gets revised here, cheaply, before plates 2–4.
- **L3 — Full body.** Remaining plates; all project entries; essays section (Alex-authored abstracts in place, drafts cleared); Workshop; Author; colophon with injected build values; all four CI gates green including canary.
- **L4 — Shippable.** Lighthouse ≥ 95 across categories; axe clean; reduced-motion verified by toggling the OS setting, not by code review; content gate proven against a live canary; deployed to GitHub Pages behind Alex's domain choice. **Gate:** Alex ships it.

## Working conventions

- Small PRs, one concern each; every PR description states which phase and which design-system sections it implements.
- Screenshot every visual PR at 1440px and 380px; attach to the PR.
- When judgment is required and the three input documents are silent: stop, write the question and your recommended answer, and wait. An hour of Alex's time is cheaper than a wrong guess shipped.
- Definition of done for the whole effort: the colophon's claims about the site are true, and every gate has caught its canary at least once.
