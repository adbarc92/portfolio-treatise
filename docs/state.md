<!-- graph:state -->
# State

What survives between sessions. Read at the start of a session, append at the end.
All entries are taken from [STATUS.md](STATUS.md) (last updated 2026-10-31).

## Current

- Consolidation, `/writing/` hub and automatic CI deploy are done and live; see [STATUS.md](STATUS.md).
- No open PRs at the last update. Every new post is `draft: true`; promoting them after Alex's review is the live task.
- Fathomline post is held for 2026-11-09 and needs rewriting against what ships that day.

## Decisions

- Astro absorbed the writing site; `node:test` stays the single runner; the gear background was not ported ([STATUS.md](STATUS.md)).
- Old `/blog/` URLs are soft redirects, not 301s; the feed is hand-built to keep guids ([hub design](plans/2026-08-30-writing-hub-design.md)).
- Eidos Forms and feature docs relationship agreed 2026-10-08 ([design note](plans/2026-10-08-forms-and-feature-docs-design.md)).

## Dead ends

- Animated gear/WebGL background: not ported, not restored ([STATUS.md](STATUS.md), [v2 design](plans/2026-08-30-writing-design-system-v2-design.md)).

## Open

- Review all essays and drafts, then promote; announce the site; post the Eidos essay ([STATUS.md](STATUS.md) next steps).
- Link gate and rendered-page claims gate were never built; plates mostly undrawn; `PAGES_DEPLOY_TOKEN` expires.
