# Design System v2 (Phases 1–3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the design system to cover the essays, share its foundation between both halves of the site, and rebuild one essay page in the new idiom as a reference to be judged before anything else is touched.

**Architecture:** Extract the shared half of `treatise.css` into `foundation.css` without altering a single declaration, so both halves inherit one set of tokens, faces, and layout primitives. Add a Shiki theme built only from existing tokens. Rebuild `blog/[slug].astro` on the body grid. The treatise's rendered output must not change in these phases; every step is chosen so that stays checkable.

**Tech Stack:** Astro 5 (static), `node:test`, Shiki (bundled with Astro), self-hosted Newsreader + JetBrains Mono.

**Spec:** [`docs/plans/2026-08-30-writing-design-system-v2-design.md`](2026-08-30-writing-design-system-v2-design.md)

## Global Constraints

- **No new colours.** Only `--ink-ground`, `--bone`, `--bone-muted`, `--oxblood`, `--brass`/`--verify`, `--plate-line`, `--plate-line-faint`. A component that appears to need another is a wrong component.
- **`--verify`/brass is verification only.** Never decorative. It must not appear in the essays' margin notes, code blocks, tags, or links.
- **Two typefaces only:** Newsreader (`--serif`) and JetBrains Mono (`--mono`). No third family, ever.
- **No gradients**, except the sanctioned radial wash already inside `.plate-frame`.
- **Zero client JS** except the treatise's existing ~20-line plate-draw observer.
- **`<head>` semantics are frozen.** Title, description, canonical, `og:*`, `twitter:card`, and the feed alternate must remain byte-identical to what is live. Verified in Task 5.
- **The twelve `/writing/*` URLs are frozen.** No task in this plan adds or removes a route.
- **`base` stays `"/"`** in `astro.config.mjs`.
- **Anti-patterns (§6), reject on sight:** gradients · animated text · card grids with shadows and radii · blue-grey dark mode · SaaS navbar chrome · a third typeface · brass used decoratively.
- Run all commands from `portfolio-website/` (the clone of `adbarc92/portfolio-treatise`).

---

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `DESIGN-SYSTEM.md` | the system of record; gains §2.10–2.15 and a version bump | 1 |
| `src/styles/foundation.css` | **new** — tokens, `@font-face`, reset, base type, `.page`, contents nav, body grid, margin notes, entries | 2 |
| `src/styles/treatise.css` | shrinks to front matter, claims marks, plates, colophon | 2 |
| `src/components/ContentsNav.astro` | **new** — the one contents nav, shared by both halves | 3 |
| `src/lib/code-theme.mjs` | **new** — Shiki theme built from tokens | 4 |
| `src/lib/shiki-surface.mjs` | **deleted** — superseded by a real theme | 4 |
| `src/styles/writing.css` | rewritten — prose rules, essay page, code blocks | 5 |
| `src/pages/writing/blog/[slug].astro` | rewritten — the reference page | 5 |
| `src/layouts/Writing.astro` | loses the navbar, gains the nav and fonts; `<head>` untouched | 5 |

**Not touched in Phases 1–3:** `src/pages/index.astro`, `claims.yaml`, the plates, every other writing page. They are Phase 4.

---

## Task 1: Design system v2 — the document

The vocabulary everything else is built from. No code.

**Files:**
- Modify: `DESIGN-SYSTEM.md`

**Interfaces:**
- Consumes: nothing.
- Produces: component numbers §2.10–§2.15, referenced by every later task.

- [ ] **Step 1: Bump the version header**

Replace line 2 of `DESIGN-SYSTEM.md`:

```markdown
**Version 2.0 · August 30, 2026 · Confirmed against `treatise-reference.html`**

The reference implementation (`treatise-reference.html`) is the visual source of truth for the treatise. Where this document and the reference disagree, the reference wins; flag the discrepancy rather than silently choosing.

**v2 extends v1 to cover the essays at `/writing/*`**, which joined this repository in the consolidation of 2026-08-30. v1 described a single continuous page and had no vocabulary for a list of entries, a filtered view, a section front page, or a code block. §§2.10–2.15 add those. No token changed; §1.1 is identical to v1.
```

- [ ] **Step 2: Add §2.10–2.15 after §2.9**

Insert before the `---` that precedes `## 3. Motion`:

```markdown
### 2.10 Contents nav, site-wide
Extends 2.1 across pages. One list, identical on every page of the site, in small caps with `--plate-line-faint` separators. From the root, section links are anchors (`#plates`); from any other page they are root-relative (`/#plates`). `III. Essays` links to `/writing/`. No logo, no CTA, no sticky behaviour, no active-page highlight beyond the ordinary link colour.

### 2.11 Section front matter
What a section's own front page carries: an epigraph (italic serif, ≤34ch, `--bone-muted`), one orienting paragraph in the author's voice, then its sub-sections as a contents list. Structurally the same as 2.2 but without a thesis — a section head, not a title page. The site has exactly one title page and it is the root.

### 2.12 Index entries
The list form. Essays use `.essay` (2.7); projects use `article.entry` (2.6). Both already exist. An index is a sequence of these separated by hairline top rules — never cards, never a grid, no radii, no shadows, no fills.

### 2.13 Filtered views
A category or tag view is a real prerendered URL, never a client-side filter. Only categories with at least one published entry are linked: the taxonomy may be declared ahead of the writing, but empty rooms are not advertised. A filtered view states its filter in a margin note and links back to the unfiltered list.

### 2.14 Code blocks
Set as a small plate. Hairline `--plate-line-faint` frame, the page ground, no fill, mono at plate-label scale, horizontal scroll inside its own box. Syntax uses **three values only** — `--bone` for code, `--bone-muted` for comments and punctuation, `--oxblood` for keywords — plus weight. `--verify` is not available here: it means "proven claim", and a syntax highlighter has no claims to prove. If three values prove insufficient, that is a finding for §1.1 as a documented revision, not a decision made inside a stylesheet.

### 2.15 Document navigation
For a sequenced specification: the sibling documents listed in the margin column, the current one marked with `--bone` against the others' `--bone-muted`, and previous/next links on a hairline top rule at the foot. No sticky positioning.

### 2.16 Editorial margin notes
Margin notes on essay and project pages carry editorial matter — dates, categories, series position, asides — and are authored, not generated. **They do not use `.cite-mark` or any `--verify` colour**, which belong to the citation system in 2.4 and mean the claim beside them is proven. An editorial note is distinguished by its hairline left border alone.
```

- [ ] **Step 3: Verify the document**

```bash
grep -c "^### 2\.1[0-6]" DESIGN-SYSTEM.md   # expect 7
grep -n "Version 2.0" DESIGN-SYSTEM.md
```

Confirm §1.1's colour table is unchanged from v1: `git diff DESIGN-SYSTEM.md | grep -c '^[-+].*--brass'` must print `0`.

- [ ] **Step 4: Commit**

```bash
git add DESIGN-SYSTEM.md
git commit -m "docs: extend the design system to cover the essays"
```

---

## Task 2: Extract `foundation.css`

Pure text movement. **Not one declaration changes.** That is what makes the verification meaningful.

**Files:**
- Create: `src/styles/foundation.css`
- Modify: `src/styles/treatise.css`

**Interfaces:**
- Consumes: nothing.
- Produces: `foundation.css`, imported by `treatise.css`'s consumers and, from Task 5, by `Writing.astro`. Class names it now owns: `.page`, `.smallcaps`, `.mono`, `nav.contents`, `.section-label`, `.body-grid`, `.prose`, `.margin-note`, `.draft-badge`, `article.entry`, `.entry-head`, `.essay`.

- [ ] **Step 1: Capture the baseline**

The treatise's built CSS must survive this unchanged. Snapshot it first.

```bash
npm run build
node -e "
const fs=require('fs');
const h=fs.readFileSync('dist/index.html','utf8');
const css=[...h.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('');
const rules=css.replace(/\/\*[\s\S]*?\*\//g,'').split('}').map(s=>s.trim().replace(/\s+/g,' ')).filter(Boolean).sort();
fs.writeFileSync('/tmp/treatise-css-before.txt', rules.join('\n'));
console.log('baseline rules:', rules.length);
"
```

- [ ] **Step 2: Move the shared blocks into `foundation.css`**

Cut these blocks from `treatise.css` **verbatim** and paste them into a new `src/styles/foundation.css`, in this order, under the header below:

```css
/* Foundation — shared by the treatise and the essays.
   Every rule here was moved verbatim out of treatise.css when the essays
   joined the design system; none was edited. If you change one, you are
   changing both halves of the site. */
```

Blocks to move, identified by their existing comment banners and selectors:

1. The whole `/* ============ FONTS ... */` block — all four `@font-face` rules.
2. The whole `/* ============ TOKENS ============ */` block — `:root{...}`.
3. `*{margin:0;padding:0;box-sizing:border-box}`
4. `html{scroll-behavior:smooth}` and its `@media (prefers-reduced-motion:reduce)` companion.
5. `body{...}` and `::selection{...}`.
6. `a{...}`, `a:hover{...}`, `a:focus-visible{...}`.
7. `.smallcaps{...}`, `.mono{...}`, `.page{...}`.
8. The whole `/* ============ CONTENTS ============ */` block.
9. From `/* ============ SECTIONS & BODY GRID ============ */`: `section{...}`, `.section-label{...}`, `.section-label .num{...}`, `.body-grid{...}`, `.prose{...}`, `.prose p + p{...}`, `.margin-note{...}`, `.margin-note a{...}`, `.margin-note a:hover{...}`, `.margin-note .faint{...}`, `.draft-badge{...}`, and the `@media (max-width:960px)` block.
10. The whole `/* ============ ENTRIES ============ */` block and the whole `/* ============ ESSAYS ... */` block.

**Leave in `treatise.css`:** the front-matter block (`header.front`, `.epigraph`, `h1.thesis`, `.byline`), `.margin-note .cite-mark`, `.verified`, `sup.noteref`, every plate rule, and the colophon.

`.margin-note .cite-mark`, `.verified` and `sup.noteref` stay behind deliberately — they are the citation system, and §2.16 forbids the essays from using them.

- [ ] **Step 3: Import the foundation from the treatise**

At the very top of `src/styles/treatise.css`, above its existing header comment:

```css
@import "./foundation.css";
```

- [ ] **Step 4: Rebuild and prove the treatise did not move**

```bash
npm run build
node -e "
const fs=require('fs');
const h=fs.readFileSync('dist/index.html','utf8');
const css=[...h.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('');
const rules=css.replace(/\/\*[\s\S]*?\*\//g,'').split('}').map(s=>s.trim().replace(/\s+/g,' ')).filter(Boolean).sort();
fs.writeFileSync('/tmp/treatise-css-after.txt', rules.join('\n'));
console.log('rules now:', rules.length);
"
diff /tmp/treatise-css-before.txt /tmp/treatise-css-after.txt && echo "TREATISE CSS RULE SET UNCHANGED"
```

Expected: `TREATISE CSS RULE SET UNCHANGED`, with no diff output.

Also confirm the markup itself is untouched apart from the style block:

```bash
node -e "
const fs=require('fs');
const strip=s=>s.replace(/<style>[\s\S]*?<\/style>/g,'<style/>');
console.log(strip(fs.readFileSync('dist/index.html','utf8')).length);
"
```

Record the number; it must match after Task 3 and Task 5 as well.

**If the diff is not empty:** the extraction edited something. Do not adjust the test. Find the edited declaration, restore it verbatim, and rerun. If the ordering of `@media` or `@font-face` blocks proves impossible to preserve, abandon the extraction and take the spec's fallback — duplicate the tokens and `@font-face` into `writing.css`, leave `treatise.css` untouched, and note it in the plan's Task 5.

- [ ] **Step 5: Confirm tests and the gate still pass**

```bash
npm test && node scripts/content-gate.mjs dist && node scripts/content-gate.mjs --selftest
```

Expected: 90 passing, 0 failing; gate clean; canary passes.

- [ ] **Step 6: Commit**

```bash
git add src/styles/foundation.css src/styles/treatise.css
git commit -m "refactor: extract the shared foundation from the treatise stylesheet"
```

---

## Task 3: One contents nav

**Files:**
- Create: `src/components/ContentsNav.astro`
- Modify: `src/pages/index.astro` (replace the inline `<nav>` with the component — output identical)

**Interfaces:**
- Consumes: `foundation.css`'s `nav.contents` rules (Task 2).
- Produces: `<ContentsNav onRoot={boolean} />`. When `onRoot` is true it emits byte-identical markup to the current inline nav. When false, section links are root-relative and `III. Essays` points at `/writing/`.

- [ ] **Step 1: Create the component**

```astro
---
// The one contents nav, per DESIGN-SYSTEM §2.10. A table of contents, not a
// navbar: no logo, no CTA, no sticky behaviour.
//
// On the root the section links are plain anchors, which is what the treatise
// has always emitted; anywhere else they are root-relative so they still lead
// somewhere. `onRoot` exists to keep the root's markup byte-identical while the
// essays are being rebuilt — see docs/plans/2026-08-30-...-plan.md, Task 2.
import { claims } from "../lib/claims";

interface Props {
  onRoot?: boolean;
}

const { onRoot = false } = Astro.props;

const roman = (n: number) => ["I", "II", "III", "IV", "V", "VI"][n - 1] ?? String(n);

const visibleEssays = claims.essays.filter((e) => e.url);
const sectionList = [
  { id: "thesis", label: "Thesis" },
  { id: "plates", label: "Plates" },
  ...(visibleEssays.length > 0 ? [{ id: "essays", label: "Essays" }] : []),
  { id: "workshop", label: "The Workshop" },
  { id: "author", label: "The Author" },
];
const secNum: Record<string, string> = Object.fromEntries(
  sectionList.map((s, i) => [s.id, roman(i + 1)]),
);

const href = (id: string) => (onRoot ? `#${id}` : `/#${id}`);
---

<nav class="contents smallcaps">
  Contents
  {
    sectionList.map((s, i) => (
      <Fragment>
        <span class="sep">{i === 0 ? "—" : "·"}</span><a href={href(s.id)}>{secNum[s.id]}. {s.label}</a>
      </Fragment>
    ))
  }
  <span class="sep">·</span><a href={href("colophon")}>Colophon</a>
</nav>
```

- [ ] **Step 2: Use it on the root**

In `src/pages/index.astro`, add to the frontmatter imports:

```astro
import ContentsNav from "../components/ContentsNav.astro";
```

Replace the entire inline `<nav class="contents smallcaps"> … </nav>` block with:

```astro
<ContentsNav onRoot />
```

Then delete the now-unused `sectionList` and `secNum` declarations from `index.astro`'s frontmatter **only if nothing else references them** — `secNum` is used by the section labels further down, so check first:

```bash
grep -n "secNum\|sectionList" src/pages/index.astro
```

If `secNum` is still referenced by section labels, keep both declarations and leave them.

- [ ] **Step 3: Prove the root's markup is unchanged**

```bash
npm run build
node -e "
const fs=require('fs');
const strip=s=>s.replace(/<style>[\s\S]*?<\/style>/g,'<style/>');
console.log('stripped length:', strip(fs.readFileSync('dist/index.html','utf8')).length);
"
```

Expected: the same number recorded in Task 2 Step 4.

Also check the nav itself directly:

```bash
grep -o '<nav class="contents smallcaps">.*</nav>' dist/index.html | head -c 400
```

Expected: `href="#thesis"`, `href="#plates"`, … — anchors, not `/#`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ContentsNav.astro src/pages/index.astro
git commit -m "refactor: extract the contents nav so both halves share one"
```

---

## Task 4: A code theme built from the tokens

**Files:**
- Create: `src/lib/code-theme.mjs`
- Create: `src/lib/code-theme.test.mjs`
- Delete: `src/lib/shiki-surface.mjs`, `src/lib/shiki-surface.test.mjs`
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `plateTheme` (a Shiki theme object) and `TOKEN_COLOURS` (the three permitted values), imported by `astro.config.mjs`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/code-theme.test.mjs`:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";

import { TOKEN_COLOURS, plateTheme } from "./code-theme.mjs";

const BRASS = "#a9884c";

/** Every colour value anywhere in the theme, lowercased. */
function coloursIn(theme) {
  const found = [];
  const walk = (v) => {
    if (typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v)) found.push(v.toLowerCase());
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(theme);
  return found;
}

test("the theme uses only the three permitted token values", () => {
  // DESIGN-SYSTEM §2.14: bone for code, bone-muted for comments and
  // punctuation, oxblood for keywords. Nothing else.
  const permitted = new Set(Object.values(TOKEN_COLOURS).map((c) => c.toLowerCase()));
  for (const colour of coloursIn(plateTheme)) {
    assert.ok(permitted.has(colour), `${colour} is not a permitted token value`);
  }
});

test("brass never appears — a highlighter has no claims to prove", () => {
  assert.ok(!coloursIn(plateTheme).includes(BRASS), "--verify must not be used decoratively");
});

test("the three roles are all present", () => {
  const used = new Set(coloursIn(plateTheme));
  for (const [role, colour] of Object.entries(TOKEN_COLOURS)) {
    assert.ok(used.has(colour.toLowerCase()), `${role} is declared but unused`);
  }
});

test("comments and keywords are distinguishable from code", () => {
  assert.notEqual(TOKEN_COLOURS.code, TOKEN_COLOURS.comment);
  assert.notEqual(TOKEN_COLOURS.code, TOKEN_COLOURS.keyword);
});

test("the theme names itself and declares its type", () => {
  assert.equal(plateTheme.name, "plate");
  assert.equal(plateTheme.type, "dark");
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL with `Cannot find module … code-theme.mjs`.

- [ ] **Step 3: Write the theme**

Create `src/lib/code-theme.mjs`:

```javascript
// A Shiki theme built only from design-system tokens, per DESIGN-SYSTEM §2.14.
//
// The treatise renders no code at all, so the system had no rule for <pre> until
// the essays arrived carrying three code blocks. They had been shipping in
// Shiki's github-dark, which is a foreign object on bone-over-lampblack.
//
// Three values, and no more. Distinction beyond them comes from weight, not hue.
// Brass is deliberately absent: it means "proven claim", and a syntax
// highlighter has no claims to prove.

/** The only colours a code block may use. Values mirror :root in foundation.css. */
export const TOKEN_COLOURS = {
  ground: "#151110", // --ink-ground
  code: "#E3D9C6", // --bone
  comment: "#8F8574", // --bone-muted
  keyword: "#8C3B32", // --oxblood
};

export const plateTheme = {
  name: "plate",
  type: "dark",
  colors: {
    "editor.foreground": TOKEN_COLOURS.code,
    "editor.background": TOKEN_COLOURS.ground,
  },
  settings: [
    { settings: { foreground: TOKEN_COLOURS.code, background: TOKEN_COLOURS.ground } },
    {
      scope: ["comment", "punctuation", "punctuation.definition", "meta.separator"],
      settings: { foreground: TOKEN_COLOURS.comment },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "storage",
        "storage.type",
        "constant.language",
        "entity.name.tag",
        "markup.heading",
      ],
      settings: { foreground: TOKEN_COLOURS.keyword, fontStyle: "bold" },
    },
  ],
};
```

Note `ground` is in `TOKEN_COLOURS` so the test permits it; it is the page ground, not a fourth accent.

- [ ] **Step 4: Run the test and watch it pass**

Run: `npm test`
Expected: all pass, including the five new tests.

- [ ] **Step 5: Wire it up and remove the workaround**

In `astro.config.mjs`, replace the `shiki-surface` import:

```javascript
import { plateTheme } from "./src/lib/code-theme.mjs";
```

and replace the `shikiConfig` block with:

```javascript
    shikiConfig: {
      // A theme from our own tokens (DESIGN-SYSTEM §2.14). This supersedes the
      // transformer that used to strip github-dark's inlined background: with
      // our own ground there is nothing foreign left to strip.
      theme: plateTheme,
    },
```

Then delete the superseded files:

```bash
git rm src/lib/shiki-surface.mjs src/lib/shiki-surface.test.mjs
```

- [ ] **Step 6: Verify the built output**

```bash
npm run build
grep -o '<pre class="astro-code[^"]*"[^>]*>' dist/writing/blog/hello-world/index.html
grep -c 'A9884C\|a9884c' dist/writing/blog/hello-world/index.html
```

Expected: the `<pre>` carries `plate` in its class list and a `background-color:#151110`; the brass count is `0`.

```bash
npm test && node scripts/content-gate.mjs dist && node scripts/content-gate.mjs --selftest
```

Expected: 88 passing (90 − 7 deleted + 5 added), 0 failing; gate clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: set code blocks from the design system's own tokens"
```

---

## Task 5: The reference essay page

The page to be judged before anything else is rebuilt. **Stop here** when it is done.

**Files:**
- Modify: `src/layouts/Writing.astro`
- Rewrite: `src/styles/writing.css`
- Rewrite: `src/pages/writing/blog/[slug].astro`

**Interfaces:**
- Consumes: `foundation.css` (Task 2), `<ContentsNav>` (Task 3), `plateTheme` (Task 4).
- Produces: the `.essay-page`, `.essay-title` conventions Phase 4 will reuse. `.doc-nav`,
  written below in Step 2, was later removed as unused (commit `87b51f4`) — nothing on the
  reference page renders it. Phase 4 should define document navigation where it is actually
  used, rather than assume this rule.

- [ ] **Step 1: Point the layout at the foundation and drop the navbar**

In `src/layouts/Writing.astro`, replace the stylesheet import:

```astro
import "../styles/foundation.css";
import "../styles/writing.css";
```

Add the nav import beside the existing ones:

```astro
import ContentsNav from "../components/ContentsNav.astro";
```

In `<head>`, after the `<meta name="viewport">` line, add the font preloads §1.2 requires:

```astro
    <link rel="preload" href="/fonts/newsreader-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/newsreader-latin-opsz-italic.woff2" as="font" type="font/woff2" crossorigin />
```

**Change nothing else in `<head>`.** Every other tag is frozen.

Replace the whole `{showNav && (<nav class="writing-nav"> … </nav>)}` block and the `<main>` wrapper with:

```astro
    <div class="page">
      <ContentsNav />
      <main>
        <slot />
      </main>
    </div>
```

Delete the `showNav` prop from the `Props` interface and from the destructuring, and delete the entire `<style>` block at the foot of the file — its rules described the navbar and are gone.

`src/pages/writing/index.astro` still passes `showNav={false}`. The build will not error — Astro does not typecheck during `astro build` — but the prop is now dead and the landing page will start rendering the contents nav. Delete `showNav={false}` from its `<Writing …>` tag so the dead prop does not linger; that page's own redesign is Phase 4.

**Expect the other writing pages to look wrong from here until Phase 4, and do not "fix" them.** Six pages — `about`, `blog/index`, `eidos/index`, `eidos/[slug]`, `projects/index`, `projects/[slug]` — carry `class="page"`, which until now meant the old `writing.css` rule (`padding: 6rem 2rem 2rem; max-width: var(--page-width, 48rem)`). Step 2 deletes that rule, so they inherit `foundation.css`'s `.page` instead and lose their padding. That is expected and harmless: nothing deploys in this plan, and Phase 4 rebuilds all six. Verify the *reference* page, ignore the rest.

- [ ] **Step 2: Rewrite `src/styles/writing.css`**

Replace the file entirely:

```css
/* The essays, set in the treatise's idiom.
   Tokens, faces, the page, the body grid, margin notes, and entry forms all
   come from foundation.css. This file holds only what is specific to reading a
   document under /writing: prose rules for the elements markdown emits, the
   essay page's own furniture, and code blocks.

   DESIGN-SYSTEM.md is authoritative. In particular: no colour outside the
   token set, and --verify never appears here — it means "proven claim", and
   nothing on these pages is making one. */

/* ============ PROSE ============ */
/* foundation.css styles `.prose p + p`; markdown emits a good deal more. */

.prose > * + * {
  margin-top: 1.35em;
}

/* §1.2: headers whisper. Small caps at about body size do the work, because
   the thesis on the root is the only display-size text on the site. */
.prose h2,
.prose h3,
.prose h4 {
  font-variant-caps: all-small-caps;
  letter-spacing: 0.12em;
  font-weight: 500;
  line-height: 1.3;
  margin-top: 2.6em;
  margin-bottom: 0.7em;
}

.prose h2 {
  font-size: 1.08rem;
  color: var(--bone);
}

.prose h3 {
  font-size: 1rem;
  color: var(--bone);
}

.prose h4 {
  font-size: 0.95rem;
  color: var(--bone-muted);
}

.prose ul,
.prose ol {
  padding-left: 1.4em;
}

.prose li + li {
  margin-top: 0.45em;
}

.prose blockquote {
  border-left: 1px solid var(--plate-line-faint);
  padding-left: 1.25em;
  color: var(--bone-muted);
  font-style: italic;
}

.prose hr {
  border: none;
  border-top: 1px solid var(--plate-line-faint);
  margin: 3em 0;
}

.prose strong {
  font-weight: 600;
  color: var(--bone);
}

.prose em {
  font-style: italic;
}

/* Tables are set like the plate captions: hairlines, mono, no fills. */
.prose table {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 0.72rem;
  line-height: 1.8;
}

.prose th,
.prose td {
  border: 1px solid var(--plate-line-faint);
  padding: 0.5em 0.75em;
  text-align: left;
  vertical-align: top;
}

.prose th {
  font-weight: 500;
  color: var(--bone);
}

/* ============ CODE — §2.14, set as a small plate ============ */

.prose :not(pre) > code {
  font-family: var(--mono);
  font-size: 0.86em;
  color: var(--bone);
  border: 1px solid var(--plate-line-faint);
  padding: 0.05em 0.35em;
}

.prose pre {
  border: 1px solid var(--plate-line-faint);
  padding: 1.2rem 1.3rem;
  margin: 2rem 0;
  overflow-x: auto;
  font-size: 0.72rem;
  line-height: 1.8;
}

.prose pre code {
  font-family: var(--mono);
  border: none;
  padding: 0;
  font-size: inherit;
}

/* ============ ESSAY PAGE ============ */

.essay-page {
  padding: 4.5rem 0 2.5rem;
}

/* Well under the thesis clamp: this is a document's title, not the site's. */
.essay-title {
  font-style: italic;
  font-weight: 430;
  font-size: 1.6rem;
  line-height: 1.25;
  max-width: 28ch;
  margin-bottom: 2.6rem;
}

/* §2.16: editorial, not citation. No --verify mark; the hairline carries it. */
.margin-note dl {
  display: grid;
  grid-template-columns: auto;
  gap: 0.55rem;
}

.margin-note dt {
  color: var(--plate-line-faint);
  letter-spacing: 0.08em;
  font-variant-caps: all-small-caps;
}

.margin-note dd {
  margin: 0;
}

/* ============ DOCUMENT NAVIGATION — §2.15 ============ */

/* `.doc-nav` below was later removed as unused (commit `87b51f4`) — the
   reference page never renders it, since the single essay it links has
   nowhere to link to yet. Phase 4 should define document navigation where
   it is actually used rather than reuse this rule as written here. */
.doc-nav {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 4rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--plate-line-faint);
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--bone-muted);
}

.back-link {
  display: inline-block;
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--bone-muted);
  margin-bottom: 2.5rem;
}
```

- [ ] **Step 3: Rewrite the essay page**

Replace `src/pages/writing/blog/[slug].astro` entirely:

```astro
---
import { getCollection, render } from "astro:content";
import type { GetStaticPaths } from "astro";

import Writing from "../../../layouts/Writing.astro";
import { formatDate } from "../../../lib/dates.mjs";
import { isPublished } from "../../../lib/drafts.mjs";
import { CATEGORY_LABELS } from "../../../lib/post-filter.mjs";

export const getStaticPaths: GetStaticPaths = async () => {
  // Drafts are emitted by the dev server and never by a build, so a build cannot
  // publish an unfinished essay even by way of a direct link.
  const posts = await getCollection("blog", ({ data }) =>
    isPublished(data, import.meta.env.DEV),
  );

  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
};

const { post } = Astro.props;
const { Content } = await render(post);
---

<Writing title={post.data.title} description={post.data.excerpt} ogType="article">
  <article class="essay-page">
    <a class="back-link" href="/writing/blog">&larr; Essays</a>

    {import.meta.env.DEV && post.data.draft && <p class="draft-badge">[DRAFT]</p>}

    <h1 class="essay-title">{post.data.title}</h1>

    <div class="body-grid">
      <div class="prose">
        <Content />
      </div>

      {/* §2.16: editorial matter, authored not generated. No --verify mark. */}
      <aside class="margin-note">
        <dl>
          <dt>Published</dt>
          <dd><time datetime={post.data.date.toISOString()}>{formatDate(post.data.date)}</time></dd>

          <dt>Category</dt>
          <dd>{CATEGORY_LABELS[post.data.category]}</dd>

          {
            post.data.tags.length > 0 && (
              <Fragment>
                <dt>Subjects</dt>
                <dd>{post.data.tags.join(" · ")}</dd>
              </Fragment>
            )
          }
        </dl>
      </aside>
    </div>
  </article>
</Writing>
```

Tags are text, not links: the query-param filter they used to point at is gone, and tag pages are deferred by the spec.

- [ ] **Step 4: Build and check the page mechanically**

```bash
npm run build
```

Then, in order:

```bash
# no JavaScript on the essay page
grep -c '<script' dist/writing/blog/hello-world/index.html          # expect 0

# the old palette is gone from this page
grep -ci 'c8a44e\|0f1117\|8b8fa3' dist/writing/blog/hello-world/index.html   # expect 0

# brass is not used decoratively
grep -ci 'a9884c' dist/writing/blog/hello-world/index.html          # expect 0

# the body grid is present
grep -c 'body-grid' dist/writing/blog/hello-world/index.html        # expect 1
```

- [ ] **Step 5: Prove the `<head>` did not change**

The single most important check in this task. Compare against the live page.

```bash
mkdir -p /tmp/v2 && curl -sL https://alexanderdbarclay.com/writing/blog/hello-world/ -o /tmp/v2/live.html
node -e "
const fs=require('fs');
const tags=f=>{const h=fs.readFileSync(f,'utf8');const head=h.slice(h.indexOf('<head>'),h.indexOf('</head>'));
return (head.match(/<title>.*?<\/title>|<meta[^>]*?\/?>|<link[^>]*?\/?>/gs)||[])
  .map(t=>t.split(/\s+/).join(' ').replace(' />','>').replace('/>','>'))
  .filter(t=>!/rel=\"stylesheet\"|rel=\"preload\"/.test(t)).sort();};
const a=tags('/tmp/v2/live.html'), b=tags('dist/writing/blog/hello-world/index.html');
const miss=a.filter(t=>!b.includes(t)), add=b.filter(t=>!a.includes(t));
miss.forEach(t=>console.log('- live only :',t));
add.forEach(t=>console.log('+ built only:',t));
console.log(miss.length||add.length ? 'HEAD CHANGED — STOP' : 'HEAD IDENTICAL');
"
```

Expected: `HEAD IDENTICAL`. Preload and stylesheet links are excluded because those are the two additions this task legitimately makes.

**If it says `HEAD CHANGED`, stop and fix before continuing.** The frozen `<head>` is the contract with everything that has already indexed or unfurled these pages.

- [ ] **Step 6: Confirm the treatise still has not moved**

```bash
node -e "
const fs=require('fs');
const strip=s=>s.replace(/<style>[\s\S]*?<\/style>/g,'<style/>');
console.log('stripped length:', strip(fs.readFileSync('dist/index.html','utf8')).length);
"
grep -c '<script' dist/index.html   # expect 1 — the plate-draw observer
```

Expected: the same stripped length recorded in Task 2 Step 4.

- [ ] **Step 7: Full suite and gate**

```bash
npm test && node scripts/content-gate.mjs dist && node scripts/content-gate.mjs --selftest
```

Expected: all pass; gate clean.

- [ ] **Step 8: Look at it**

```bash
npm run dev
```

Open `http://localhost:4321/writing/blog/hello-world` and
`http://localhost:4321/writing/blog/eidos-an-architecture-for-cheap-code`.

Check by eye, against §4's quality floor:
- prose sits at the measure; the margin note sits beside it above 960px and below it under
- headings whisper — small caps, not display type
- the code block reads as a plate, in the site's palette
- links are bone with an oxblood underline that thickens on hover
- **no brass anywhere on the page**
- keyboard-only tab pass reaches every link with a visible focus ring
- the page holds together at 380px wide

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: rebuild the essay page in the treatise's idiom"
```

- [ ] **Step 10: Stop**

This is the spec's Phase 3 gate. Do not begin Phase 4. Open a pull request, and ask for a visual verdict on the reference page before the remaining seven pages are rebuilt — disagreeing about the look here costs a fraction of what it costs across eight pages.

---

## What this plan deliberately leaves undone

Phases 4–6 of the spec, which get their own plan after the verdict, because the verdict may change the vocabulary they would be written against:

- the remaining seven pages
- static category pages at `/writing/blog/category/<id>`
- deleting `BlogList.tsx`, `CategoryFilter.tsx`, and the React dependencies
- both sitemaps gaining the category URLs
- the final parity and zero-JS verification, and the deploy
