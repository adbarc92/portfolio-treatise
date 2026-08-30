# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

One repository serving all of `alexanderdbarclay.com`: the illuminated treatise at the domain
root, and the essays, projects, and Eidos specification under `/writing/*`. Astro 5, static
output, near-zero client JavaScript.

It reached this shape on 2026-08-30 by absorbing `adbarc92/writing`, a React/Vite SPA that
served `/writing/` from a separate repository and a separate Pages deployment. That repo is
archived. The design that governed the merge is
[`docs/plans/2026-08-29-consolidation-design.md`](docs/plans/2026-08-29-consolidation-design.md);
the running status is [`docs/STATUS.md`](docs/STATUS.md).

## Commands

```bash
npm run dev      # Astro dev server. Drafts are visible here and ONLY here.
npm run build    # Static build to dist/
npm test         # node:test over {scripts,src}/**/*.test.mjs
npm run deploy   # Build, run the gates, push gated output to the publish repo
npm run extract  # Regenerate plate JSON from a source repository
```

**`npm run deploy` publishes to the live site.** It is not a dry run. See Deployment.

## Architecture

Two halves under one build, deliberately not sharing a layout.

### The treatise — `/`

- **`src/pages/index.astro`** — the entire treatise, one page, rendered from `claims.yaml`
- **`src/lib/claims.ts`** — loads and validates `claims.yaml`; throws on an unresolvable noteref
- **`src/components/HalyardPlate.astro`** + **`src/data/plates/*.json`** — engraved figures
- **`src/styles/treatise.css`** — the design system in
  [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md), which is authoritative over this file for anything visual

`claims.yaml` is the single source of truth for treatise content. A claim without an evidence
URL fails the build rather than rendering unlinked.

### The essays — `/writing/*`

- **`src/pages/writing/`** — eight page files emitting twelve URLs
- **`src/layouts/Writing.astro`** — the shared shell and, importantly, the whole `<head>`
- **`src/styles/writing.css`** — ported from the React site; imported only by the writing
  layout, so its global reset cannot reach the treatise
- **`content.config.ts`** — collections and Zod schemas for `content/`
- **`src/components/BlogList.tsx`** — the one React island on the site

### Shared logic — `src/lib/*.mjs`

Plain `.mjs` with JSDoc types, so `node:test` can cover it without booting Astro and
`astro.config.mjs` can import it. Add logic here rather than inside a component when it can
be stated as a function.

| Module | Decides |
| --- | --- |
| `site.mjs` | titles, descriptions, canonical paths, absolute URLs |
| `slugs.mjs` | every published URL's slug |
| `dates.mjs` | date formatting, in UTC |
| `drafts.mjs` | whether unfinished prose is published |
| `post-filter.mjs` | the blog index's filtering and the URL its chips write |
| `content-links.mjs` | the `/writing` prefix on root-relative content links |
| `shiki-surface.mjs` | code blocks sitting on the site's surface, not the theme's |

## Things that will bite you

- **`base` stays `"/"`.** Astro's `base` is site-wide, so pointing it at `/writing` would move
  the treatise too. The essays take their prefix from living under `src/pages/writing/`. This
  is commented in `astro.config.mjs`; do not "fix" it.
- **`/writing/*` URLs are frozen.** They carry canonical tags, OG tags, the feed, and links
  posted publicly. Slug rules are pinned by tests against the real filenames.
- **Dates must format in UTC.** `z.coerce.date()` resolves `2026-08-10` to UTC midnight;
  formatting in local time renders the previous day west of Greenwich. The bug is invisible on
  a UTC machine, so `dates.test.mjs` pins `TZ`.
- **Canonicals drop the trailing slash; the two roots keep theirs.** The build emits directory
  URLs, so `canonicalPath()` normalises. The sitemap is serialised through the same function —
  if you change one, you change both.
- **The RSS item link is the guid.** A changed guid republishes every old post into every
  subscriber's reader as new. `trailingSlash: false` in `rss.xml.ts` is load-bearing.
- **The OG image lives at `public/writing/images/og.png`**, not `public/images/`, because every
  live page references `/writing/images/og.png`.
- **`npm test` must not glob `scripts/` bare.** `node --test scripts/` would execute
  `deploy-local.mjs`, which deploys. The script targets `*.test.mjs` explicitly.
- **Drafts are visible in `npm run dev` and never in a build.** That is the whole of
  `drafts.mjs`. Two political essays are `draft: true` pending Alex's voice pass.

## Content

Markdown with YAML frontmatter under `content/`, validated by Zod at build time:

- **`content/blog/*.md`** — date prefix in the filename becomes the slug; `category` from a
  closed set; `draft` optional
- **`content/projects/*.md`**, **`content/eidos/*.md`** (sequenced by `order`), **`content/about.md`**

Adding a category means changing both the enum in `content.config.ts` and the label map in
`post-filter.mjs`. A test compares them and fails if they drift.

## Testing

One runner: `node:test`, over `*.test.mjs`. There is no Vitest here — the consolidation design
proposed it on the grounds that it was the larger suite, which stopped being true; see
`docs/STATUS.md` for the audit.

Tests cover pure logic. `.astro` pages are verified by diffing built output against the live
site, which is how route, `<head>`, feed, and sitemap parity were established at cutover.

## Deployment

**Manual. CI has never once succeeded** — 8 runs, 8 failures, zero steps executed. Do not
assume a merge deploys anything.

`npm run deploy` builds, runs the content gate and its canary, then replaces the contents of
`adbarc92/adbarc92.github.io` with `dist/`. Pages serves that at the domain root.

Reviving CI needs a `PAGES_DEPLOY_TOKEN` secret, which the repo does not have.

See [`AGENT-PROMPT.md`](AGENT-PROMPT.md) for the gates: two of the four it specifies are built,
and it now says which.

## Repositories

- **`origin`** → `github.com/adbarc92/portfolio-treatise` — this repo, the source. Public.
- **`adbarc92/adbarc92.github.io`** — publish target, build output only. Never edit by hand.
- **`adbarc92/writing`** — archived. The essays' former home; kept, not deleted, so the cutover
  remains reversible. Rolling back means unarchiving it, re-enabling Pages, and re-running its
  `deploy.yml`.
