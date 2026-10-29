---
title: "This Site: Claims That Fail the Build"
date: 2026-10-28
excerpt: "How this site is put together: one static Astro build, where a claim without a citation, a retracted phrase or a reference to a style that does not exist stops the deploy."
category: software
tags: ["astro", "static-site", "open-source"]
draft: true
---

> **Editor's note. Delete this note before publishing.** This post exists because the catalogue lists the site as a shipped item. Cut it if you don't want a post about the site itself. Do not quote the terms on the content gate's lists in this post: the gate scans this page too.

This site is a static [Astro](https://astro.build) build. One repository holds the source for the whole domain: the treatise at the root, and everything written under `/writing/`. The [source is public](https://github.com/adbarc92/portfolio-treatise).

## Why it is built this way

A portfolio is a weak argument by construction: its author controls every word written about him. This site cannot fix that. What it can do is refuse the easy version. Each claim it makes about a system carries a citation, and the build checks the citations.

## The gates

- **Claims need evidence.** Every project and catalogue entry lives in one YAML file. A claim with no evidence link fails the build. So does a citation marker in the prose that points at nothing, or a claim that the prose never cites.
- **Some words are not allowed.** A content gate scans the built pages for claims I have retracted and for a short list of marketing words. It tolerates hyphens and invisible characters inserted into a word, so the check cannot be dodged by accident. Before each real scan it runs a self-test against a planted example, to prove it can still catch one.
- **Styles must exist.** A style gate walks the built site and fails if the markup uses a CSS class or a custom property that nothing defines.
- **Drafts never reach a build.** A post marked as a draft appears on my machine and never in the published output, the feed or the sitemap. Every post about a project starts that way, this one included.

On every merge to the main branch, CI builds the site, runs the gates and pushes only the output to the repository GitHub Pages serves from.

## What I learned

- **Three bugs with one shape.** Three separate defects all came from markup that referred to CSS that didn't exist. That is valid HTML and valid CSS, so nothing failed: no build, no test. The style gate exists because of them.
- **A feed can republish everything.** When the posts moved to new URLs, the RSS library would have changed every post's ID along with its link. Every subscriber would have seen every post again as new. The feed is now built by hand, and the old IDs are kept.
- **GitHub Pages cannot send a real redirect.** It serves static files only, so the old URLs are pages with a meta refresh and a canonical link. I describe them as soft redirects, because that is what they are.
- **A word filter needs word boundaries.** The first time the content gate scanned essay prose, it failed on ordinary English: one banned term had matched inside a longer, harmless word. Terms now match only as whole words, and the gate still catches the deliberately mangled versions.

[CONFIRM: anything about the design system or the treatise you want to add.]
