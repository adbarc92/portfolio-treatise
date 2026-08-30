# Portfolio Overhaul Design

## Overview

Overhaul personal portfolio from a single-page SVG portal into a multi-page site with blog posts, project showcase, and an animated gear background. The site serves as a centralizing hub for a career arc from software engineering to ML/robotics to game design.

## Tech Stack

- **Keep:** React 19, TypeScript (strict), Vite, ESLint
- **Add:** react-router-dom, gray-matter, marked/remark, highlight.js/shiki
- **Remove:** Current portal component, App.css, design/ concept docs
- **Deploy:** GitHub Pages (static build via GitHub Actions, 404.html SPA redirect)

## Site Structure & Routing

| Route | Page | Description |
|---|---|---|
| `/` | Landing portal | Full-viewport, animated gears, name, tagline, nav entry points |
| `/blog` | Blog listing | Post cards sorted by date, title/date/excerpt/tags |
| `/blog/:slug` | Blog post | Rendered Markdown with syntax highlighting |
| `/projects` | Project grid | Responsive card grid with thumbnails, titles, tech tags |
| `/projects/:slug` | Project detail | Full Markdown writeup, screenshots, external links |
| `/about` | About | Bio, career narrative, contact/social links |

### Layout

- Persistent `<Layout>` wrapper renders animated gear SVG background behind all pages
- React Router `<Outlet>` renders page content on top
- Page content in a centered container with semi-transparent dark panel for readability
- NavBar visible on all pages except landing portal

### GitHub Pages Routing

404.html redirects to index.html with path preserved (standard SPA trick for client-side routing on GitHub Pages).

## Animated Gear Background

- Pure SVG, fixed-position full-viewport layer behind all content
- Multiple interlocking gears of varying sizes across the viewport
- Gears rotate via `requestAnimationFrame`; adjacent gears rotate in opposite directions at correct gear ratios (speed ratio = teeth ratio)

### Gear Rendering

- Each gear is an SVG `<path>` generated procedurally from parameters: center, tooth count, inner radius, outer radius, tooth shape
- Stylized/geometric aesthetic: clean lines, flat or subtly gradient-filled, no photorealism
- Simplified tooth profiles (trapezoidal or rounded)

### Color Palette

- Dark background (slate/charcoal)
- Gears in muted tones: subtle grays, steel blues, dark metallics with lighter stroke outlines
- One or two accent gears with brighter highlight (amber/gold or teal)
- Low overall opacity so content remains readable

### Animation

- Smooth continuous rotation, all gears mechanically linked
- Slow speed — atmosphere, not distraction
- Respects `requestAnimationFrame` visibility behavior

### Responsiveness

- Gear positions and sizes computed from viewport dimensions
- Recomputed on window resize

## Landing Portal

- Full-viewport, no scroll
- Animated gear background fills the screen
- Name ("Alex Barclay") centered, large, clean typography
- Subtitle/tagline beneath
- Nav entry points (Blog, Projects, About) below or around the name
- Entry points: minimal interactive elements with hover effects (glow, scale, gear-inspired animation)
- Navigation via React Router; gear background persists, page content fades/slides in

### Removed

- Current diamond/circle/spark portal concept replaced entirely
- Four cardinal themes (Knowledge, Power, Wisdom, Harmony) retired

## Blog System

### Content Storage

Markdown files in `content/blog/` with YAML frontmatter:

```yaml
---
title: "Post Title"
date: 2026-02-27
excerpt: "A short summary for the listing page."
tags: ["machine-learning", "robotics"]
---
```

### Build-Time Processing

- Vite plugin or custom import glob with Markdown parser (marked/remark)
- Generates post index (title, date, excerpt, slug, tags) and full HTML
- Slug from filename: `2026-02-27-my-post.md` → `/blog/my-post`

### Blog Listing (`/blog`)

- Post cards sorted by date (newest first)
- Each card: title, date, excerpt, tags
- Tag filtering can be added later

### Blog Post (`/blog/:slug`)

- Rendered Markdown with clean typography
- Title, date, tags at top
- Code blocks with syntax highlighting
- Back link to listing

## Projects System

### Content Storage

Markdown files in `content/projects/` with frontmatter:

```yaml
---
title: "Project Name"
description: "Short description for the card."
thumbnail: "/images/projects/project-name.png"
tags: ["react", "typescript", "robotics"]
date: 2026-01-15
links:
  github: "https://github.com/..."
  live: "https://..."
---
```

### Project Listing (`/projects`)

- Responsive card grid (CSS Grid, 1-3 columns)
- Each card: thumbnail, title, short description, tech tags
- Click navigates to detail page

### Project Detail (`/projects/:slug`)

- Full Markdown body rendered
- Thumbnail/screenshots at top or embedded
- External links (GitHub, live demo) prominent
- Tags displayed, back link to listing

### Images

Stored in `public/images/projects/`, referenced in frontmatter and Markdown.

## About Page

- Single page at `/about`
- Content from `content/about.md` for easy editing
- Bio, career narrative (SWE → ML/Robotics → Game Design), contact/social links
- Clean typography on dark panel over gears

## File Structure

```
src/
  components/
    GearBackground.tsx    # Animated SVG gear layer
    Layout.tsx            # Persistent layout (gears + nav + outlet)
    NavBar.tsx            # Navigation (hidden on landing, visible elsewhere)
    BlogCard.tsx          # Blog post card for listing
    ProjectCard.tsx       # Project card for grid
  pages/
    Landing.tsx           # Portal landing page
    Blog.tsx              # Blog listing
    BlogPost.tsx          # Individual post
    Projects.tsx          # Project grid
    ProjectDetail.tsx     # Individual project
    About.tsx             # About page
  lib/
    content.ts            # Markdown loading/parsing utilities
  App.tsx                 # Router setup
  main.tsx                # Entry point
content/
  blog/                   # Markdown blog posts
  projects/               # Markdown project pages
  about.md                # About page content
public/
  images/projects/        # Project thumbnails/screenshots
```
