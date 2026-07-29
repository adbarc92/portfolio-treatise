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

1. **Embargo.** The name of Alex's LLC must not appear anywhere in the site content, repo, commit messages, file names, code comments, or build output until Alex explicitly lifts the embargo. The CI embargo gate (below) enforces this against build output; you enforce it against everything else. If you don't know what the banned strings are, ask Alex to configure the `EMBARGO_TERMS` secret — do not ask him to type the terms into any file in the repo.
2. **Retracted claims never appear:** no Firefox extension claim, no Chrome Web Store claim, no "16-agent" (use "multi-agent"), no Redis, no "shipped to the App Store" for Tenzy (Tenzy is omitted from the site entirely for now).
3. **No invented facts.** No fabricated test counts, CI run numbers, dates, metrics, quotes, or system structure. Every number and evidence link comes from `claims.yaml`; every plate's structure comes from a repository-extraction script or is captioned `[PLACEHOLDER — FINAL PLATE DERIVED FROM REPOSITORY DEFINITIONS]`.
4. **No content in your voice ships.** Prose you draft (project paragraphs, essay abstracts, the author paragraph) is marked `draft: true` in `claims.yaml` and rendered with a visible `[DRAFT — AWAITING ALEX'S VOICE]` badge until Alex replaces or approves it.
5. **The repo stays private until the embargo lifts.** See gate design below for why.

## Stack

- **Astro**, static output, zero client JS except the plate-draw IntersectionObserver (~20 lines, inline).
- Self-hosted, subset **woff2** fonts: Newsreader (variable, incl. italic) + JetBrains Mono 400/500. Preload the serif. No font CDNs in production.
- Deploy: **Cloudflare Pages** (matches existing infra). Private GitHub repo, `main` protected, PRs only.
- No CSS framework. Hand-rolled CSS from the design-system tokens, in one layer-ordered stylesheet. Watch selector-specificity collisions between section-level and element-level rules.

## Single source of truth: `claims.yaml`

All rendered content derives from one file. Schema:

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

essays:
  - id: price-of-the-ticket
    title: "The Price of the Ticket"
    abstract: "..."                       # Alex's words only; draft: true until approved
    status: complete
    series_position: 1
    url: "..."

workshop:
  prose: |
    ...
  planned_plates:
    - { number: 5, name: MORALEVALUATOR, source: null, status: planned }
```

Rendering rules: a claim with no `evidence.url` fails the build (not renders unlinked — fails). `verified: true` is the only thing that produces a `--verify`-colored mark anywhere on the site. `not_yet` items render in the project prose; their absence for a project is allowed but must be deliberate (`not_yet: []` explicitly).

## CI gates (all fail-closed; a gate that cannot run fails the build)

1. **Embargo gate.** Greps the *built output* (HTML, JS, CSS, sitemap, RSS, headers) for every term in the `EMBARGO_TERMS` CI secret (comma-separated, case-insensitive, also matched with word-joiners stripped). Any hit fails.
   *Design note — why a secret and a private repo:* a banned-words list committed to a repo that later goes public is itself the leak (this exact failure occurred in another repo's `STATUS.md` on July 25). The list lives only in CI secrets; the repo stays private until embargo lift; the retracted-claims list from Hard Rule 2 (not itself secret) may live in a committed config.
2. **Claims gate.** Walks the rendered pages; every `sup.noteref` must resolve to a margin note generated from a `claims.yaml` entry with an evidence URL; every `--verify` mark must trace to `verified: true`. Orphans fail.
3. **Link gate.** Every evidence URL and outbound link must return 2xx at build time (HEAD, with GET fallback; 3 retries; failures fail the build, not warn).
4. **Canary test.** The gate test-suite includes a fixture page containing an embargoed term and an uncited claim, and asserts the build *fails*. A gate that cannot catch its canary is a gate at L0.

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
- **L4 — Shippable.** Lighthouse ≥ 95 across categories; axe clean; reduced-motion verified by toggling the OS setting, not by code review; embargo gate proven against a live canary; deployed to Cloudflare Pages behind Alex's domain choice. **Gate:** Alex ships it.

## Working conventions

- Small PRs, one concern each; every PR description states which phase and which design-system sections it implements.
- Screenshot every visual PR at 1440px and 380px; attach to the PR.
- When judgment is required and the three input documents are silent: stop, write the question and your recommended answer, and wait. An hour of Alex's time is cheaper than a wrong guess shipped.
- Definition of done for the whole effort: the colophon's claims about the site are true, and every gate has caught its canary at least once.
