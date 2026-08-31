# The Illuminated Treatise — Design System
**Version 2.0 · August 30, 2026 · Confirmed against `treatise-reference.html`**

The reference implementation (`treatise-reference.html`) is the visual source of truth for the treatise. Where this document and the reference disagree, the reference wins; flag the discrepancy rather than silently choosing.

**v2 extends v1 to cover the essays at `/writing/*`**, which joined this repository in the consolidation of 2026-08-30. v1 described a single continuous page and had no vocabulary for a list of entries, a filtered view, a section front page, or a code block. §§2.10–2.16 add those. No token changed; §1.1 is identical to v1.

**Design thesis:** a printed treatise on trustworthy autonomous systems, illustrated with plates engraved from the author's actual machinery. Restraint with gravity. Evidence is the ornament. Nothing is asserted above what the margin can cite.

---

## 1. Tokens

### 1.1 Color

| Token | Value | Role | Rules |
|---|---|---|---|
| `--ink-ground` | `#151110` | Page ground | Warm lampblack. Never blue-gray. Never gradients |
| `--bone` | `#E3D9C6` | Primary text | Contrast vs ground ≥ 10:1 |
| `--bone-muted` | `#8F8574` | Secondary text, captions, marginalia | Never for body prose |
| `--oxblood` | `#8C3B32` | Links, active states, section numerals, selection ground | Never fills large areas |
| `--brass` | `#A9884C` | **Verification only** — via `--verify` | Appears *only* beside proven claims: ✓ marks, citation arrows (`↳`), focus rings. Scarcity is semantic. Never decorative |
| `--verify` | `var(--brass)` | Alias all verification styling to this | Components reference `--verify`, never `--brass` directly |
| `--plate-line` | `rgba(227,217,198,0.62)` | Primary engraving stroke | |
| `--plate-line-faint` | `rgba(227,217,198,0.28)` | Rules, borders, secondary strokes, dashed fail-safe paths | |

Hard rules: no gradients anywhere (the single radial wash inside `.plate-frame` at 2.5% opacity is the only sanctioned exception); no pure white, no pure black; no colors outside this table without a design-system revision.

### 1.2 Typography

| Role | Face | Settings |
|---|---|---|
| Display + body serif | **Newsreader** (variable) | `font-optical-sizing:auto`. Thesis: `clamp(2.1rem,5.2vw,3.35rem)`, weight 430, `line-height:1.18`, `letter-spacing:-0.012em`. Body: 18.5px / 1.68, weight 400 |
| Evidence mono | **JetBrains Mono** (Berkeley Mono if licensed; keep metrics-compatible fallback stack) | Marginalia 0.72rem / 1.75; plate labels 13px with 2.5px letterspacing; captions 0.72rem / 1.8 |
| Utility labels | Newsreader **real small caps** (`font-variant-caps:all-small-caps`, `letter-spacing:0.12em`, weight 500) | Nav, section labels, entry heads, bylines. No third family, ever |

- Fonts are **self-hosted** in production (woff2, subset, `font-display:swap` is acceptable only for mono; the serif should preload).
- Measure: `--measure: 68ch`. Body prose never exceeds it.
- Headers whisper: small caps at ~1x body size do the work of headings. The thesis is the only display-size text on the site.

### 1.3 Spacing & layout

- Page: `max-width: calc(68ch + 17rem + 4rem)`, centered, `padding: 0 1.5rem`.
- **Body grid:** `grid-template-columns: minmax(0,68ch) 17rem; column-gap: 4rem`. Prose in column 1; marginalia in column 2.
- **≤960px:** grid collapses to one column; margin notes become inline blocks below their paragraph (`border-left: 2px solid --plate-line-faint`).
- Front matter: 7.5rem top padding. Sections: 2.5rem vertical. Plates: 4.5rem vertical margins, full page width (they break the measure deliberately).

---

## 2. Components

### 2.1 Contents nav
A table of contents, not a navbar. Small caps, `--bone-muted`, separators in `--plate-line-faint`. Roman-numeral sections: `I. Thesis · II. Plates · III. Essays · IV. The Workshop · V. The Author · Colophon`. No logo, no CTA button, no sticky behavior.

### 2.2 Front matter
Epigraph (italic serif, ≤34ch, `--bone-muted`) with a mono `cite` line → thesis (`h1.thesis`) → byline in small caps with oxblood interpuncts. The epigraph quotes the author's own doctrine: *"Rungs are earned by evidence, not asserted." — WORKFLOW.md, on the Readiness Ladder*.

### 2.3 Section labels
Small caps + mono roman numeral in `--oxblood`: `<span class="num">II</span>Plates`.

### 2.4 Marginalia (the citation system)
- Every factual claim in prose carries a `sup.noteref` (mono, `--verify`) pointing to a `.margin-note` in the margin column.
- Margin notes: mono 0.72rem, `--bone-muted`, hairline left border, citation arrow `↳` in `--verify`.
- Verified claims render `✓ verified` in `--verify` plus a link to the evidence (CI run, test suite section, registry listing, repository).
- **Notes are generated from `claims.yaml`, never hand-typed.** A claim without an evidence entry does not render — the build fails instead (see agent prompt, gates).

### 2.5 Plates
Anatomy: `figure.plate` → `.plate-frame` (hairline border + offset outline, corner ticks inside the SVG) → SVG figure → `figcaption.plate-caption` (mono; left: `PLATE N — NAME:` in `--bone` + description; right: status note).

Engraving language (the shared "engraving kit" — one set of SVG defs reused by all plates):
- Strokes: primary `--plate-line` at 1.4; secondary/fail-safe `--plate-line-faint` at 1.2, dashed `5 5`.
- Fills: none, except the shared 45° hatch pattern (`rgba(227,217,198,0.14)`, 7px pitch) for terminal/failure states.
- Labels: mono, uppercase, letterspaced; annotations at 10.5px in `--bone-muted`.
- Verification marks: mono `✓` in `--verify`, placed on tested transitions only — and only when `claims.yaml` attests them.
- Terminal/accepting states: double circle. Arrowheads via shared markers.
- Figures are **derived from repository definitions** (states, transitions, topology extracted by script), then composed by hand. Never invent structure; placeholder figures must say `[PLACEHOLDER — FINAL PLATE DERIVED FROM REPOSITORY DEFINITIONS]` in the caption.

### 2.6 Project entries
`article.entry`: hairline top rule; head = small-caps name + mono meta line; one paragraph of prose in the body grid with marginalia. Prose formula (essay voice): why the problem matters (concession first) → what the system is → **what is proven** (cited) → **what is not yet** (from `claims.yaml.not_yet`, honestly stated).

### 2.7 Essay entries
`.essay`: hairline top rule; italic serif title (link, underline appears on hover in oxblood); one-line abstract in `--bone-muted` at 0.95rem; margin note with series position and status. Abstracts are the author's words only — flag any placeholder abstract for replacement before ship.

### 2.8 The Workshop
Same body-grid prose treatment. Game-development systems (e.g., the MoralEvaluator dialog engine) graduate to plates like any other system; hand-drawn work is referenced, not simulated.

### 2.9 Colophon
Hand-drawn printer's device (placeholder: ✳ in a hairline circle until the real mark is inked and scanned) → small-caps "Colophon" → prose stating typefaces, the plate-derivation method, and the three build gates → mono status line: `LAST VERIFIED: {build date} · SOURCE: {repo} · GATES: CONTENT ✓ CLAIMS ✓ LINKS ✓` (values injected at build; never hardcoded).

### 2.10 Contents nav, site-wide
Extends 2.1 across pages. One list, identical on every page of the site, in small caps with `--plate-line-faint` separators. From the root, section links are anchors (`#plates`); from any other page they are root-relative (`/#plates`). `III. Essays` links to `/writing/`. No logo, no CTA, no sticky behaviour, no active-page highlight beyond the ordinary link colour.

### 2.11 Section front matter
What a section's own front page carries: an epigraph (italic serif, ≤34ch, `--bone-muted`), one orienting paragraph in the author's voice, then its sub-sections as a contents list. Structurally the same as 2.2 but without a thesis — a section head, not a title page. The site has exactly one title page and it is the root.

### 2.12 Index entries
The list form. Essays use `.essay` (2.7); projects use `article.entry` (2.6). Both already exist. An index is a sequence of these separated by hairline top rules — never cards, never a grid, no radii, no shadows, no fills.

### 2.13 Filtered views
A category or tag view is a real prerendered URL, never a client-side filter. Only categories with at least one published entry are linked: the taxonomy may be declared ahead of the writing, but empty rooms are not advertised. A filtered view states its filter in a margin note and links back to the unfiltered list.

### 2.14 Code blocks
Set as a small plate. Hairline `--plate-line-faint` frame, the page ground, no fill, mono at plate-label scale, horizontal scroll inside its own box. Syntax uses comments and punctuation in `--bone-muted`, everything else in `--bone`, keywords distinguished by weight. `--oxblood` was rejected here: it measures 2.49:1 against the ground, where §4 requires 4.5:1. `--verify` is not available here: it means "proven claim", and a syntax highlighter has no claims to prove. If this proves insufficient, that is a finding for §1.1 as a documented revision, not a decision made inside a stylesheet.

### 2.15 Document navigation
For a sequenced specification: the sibling documents listed in the margin column, the current one marked with `--bone` against the others' `--bone-muted`, and previous/next links on a hairline top rule at the foot. No sticky positioning.

### 2.16 Editorial margin notes
Margin notes on essay and project pages carry editorial matter — dates, categories, series position, asides — and are authored, not generated. **They do not use `.cite-mark` or any `--verify` colour**, which belong to the citation system in 2.4 and mean the claim beside them is proven. An editorial note is distinguished by its hairline left border alone.

---

## 3. Motion

One orchestrated moment; nothing else.
- **Plates draw themselves:** all `[data-draw]` strokes use `pathLength="1"`, `stroke-dasharray:1`, offset 1→0 over 1.15s `cubic-bezier(.4,0,.25,1)` when the frame enters the viewport (IntersectionObserver, threshold 0.35, once). Labels and ✓ marks fade in at 0.85s.
- Fully disabled under `prefers-reduced-motion: reduce` (plates render complete). No IntersectionObserver support → render complete.
- Link hover: underline thickness 1px→2.5px. That is the complete motion inventory. No parallax, no fade-on-scroll prose, no hover cards, no page transitions.

## 4. Accessibility & quality floor
Body contrast ≥ 10:1; muted text ≥ 4.5:1 against ground. Visible focus (`--verify` 2px outline, 3px offset). Plates carry `role="img"` + full `aria-label` describing the figure. Semantic landmarks (`nav`, `header`, `section`, `footer`). Keyboard-only pass and 380px-width pass required before any phase is called done. Zero client JS except the ~20-line plate-draw observer.

## 5. Voice
Essay register: periodic sentences, concession-before-claim, understatement, prose over lists. Banned vocabulary: *passionate, cutting-edge, blazingly, seamless, journey, delightful, crafting.* Banned components: skill bars, testimonials, logo walls, emoji, stat-counter heroes. Claims state exactly what the evidence supports — including "not yet" lists, which are a feature of the voice.

## 6. Anti-patterns (reject on sight)
Gradients · animated text · card grids with shadows and radii · blue-gray dark mode · SaaS navbar chrome · stock or AI-generic illustration · a third typeface · brass/`--verify` used decoratively · any claim without a margin citation · any figure not derived from a repository (unless captioned PLACEHOLDER).
