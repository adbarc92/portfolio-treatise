# Portfolio Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the single-page SVG portal into a multi-page portfolio with animated gear background, blog, project showcase, and about page.

**Architecture:** React 19 SPA with client-side routing (react-router-dom). Markdown content files loaded via Vite's `import.meta.glob` and parsed at runtime with `yaml` + `marked`. Animated SVG gear background rendered as a persistent fixed layer behind all pages. Static build deployed to GitHub Pages.

**Tech Stack:** React 19, TypeScript, Vite, react-router-dom, marked, marked-highlight, highlight.js, yaml

---

### Task 1: Install Dependencies & Clean Up Old Files

**Files:**
- Modify: `package.json`
- Delete: `src/App.css`
- Delete: `src/assets/react.svg`
- Delete: `public/vite.svg`

**Step 1: Install new dependencies**

Run:
```bash
npm install react-router-dom marked highlight.js yaml
npm install -D @types/marked
```

**Step 2: Remove unused files**

Run:
```bash
rm src/App.css src/assets/react.svg public/vite.svg
```

**Step 3: Create directory structure**

Run:
```bash
mkdir -p src/components src/pages src/lib content/blog content/projects public/images/projects
```

**Step 4: Update `index.html`**

Replace the title and remove the vite.svg favicon reference:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Alex Barclay</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Verify build still compiles**

Run: `npm run build`
Expected: Build succeeds (will have unused import errors in App.tsx — that's fine, we replace it next)

Note: App.tsx will have broken imports after removing App.css. That's expected — we replace it entirely in Task 5.

**Step 6: Commit**

```bash
git add -A
git commit -m "Install dependencies and clean up unused files"
```

---

### Task 2: Global Styles

**Files:**
- Modify: `src/index.css`

**Step 1: Replace `src/index.css` with the site's global styles**

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --color-bg: #0f1117;
  --color-surface: rgba(15, 17, 23, 0.85);
  --color-surface-hover: rgba(25, 28, 38, 0.9);
  --color-text: #e2e4e9;
  --color-text-muted: #8b8fa3;
  --color-accent: #c8a44e;
  --color-accent-dim: rgba(200, 164, 78, 0.3);
  --color-gear: #2a2d3a;
  --color-gear-stroke: #3d4155;
  --color-gear-accent: #c8a44e;
  --color-gear-accent-2: #4a7c8a;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

html {
  font-family: var(--font-sans);
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100vh;
  overflow-x: hidden;
}

#root {
  min-height: 100vh;
}

a {
  color: var(--color-accent);
  text-decoration: none;
  transition: opacity 0.2s;
}

a:hover {
  opacity: 0.8;
}

img {
  max-width: 100%;
  display: block;
}

code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}

pre {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-gear-stroke);
  border-radius: 8px;
  padding: 1.2em;
  overflow-x: auto;
  margin: 1.5em 0;
}

pre code {
  background: none;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.7;
}
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "Replace global styles with portfolio design system"
```

---

### Task 3: Gear Generation Utility

**Files:**
- Create: `src/lib/gears.ts`

**Step 1: Write the gear SVG path generator**

This module procedurally generates SVG path data for stylized gears. Each gear is defined by: center position, number of teeth, inner radius, outer radius, and tooth width factor.

```typescript
export interface GearConfig {
  cx: number;
  cy: number;
  teeth: number;
  innerRadius: number;
  outerRadius: number;
  toothDepth?: number; // fraction of (outer - inner), default 0.4
  holeRadius?: number; // center hole, default innerRadius * 0.4
}

export interface GearData {
  config: GearConfig;
  path: string;       // SVG path for the gear outline
  holePath: string;   // SVG path for the center hole
  rotation: number;   // current rotation in degrees
  speed: number;      // degrees per frame (computed from teeth ratio)
  direction: 1 | -1;  // clockwise or counter-clockwise
}

/**
 * Generate an SVG path string for a gear outline.
 * Creates a gear with trapezoidal teeth using line segments.
 */
export function generateGearPath(config: GearConfig): string {
  const { cx, cy, teeth, innerRadius, outerRadius } = config;
  const toothDepth = config.toothDepth ?? 0.4;

  const baseRadius = innerRadius + (outerRadius - innerRadius) * (1 - toothDepth);
  const tipRadius = outerRadius;
  const anglePerTooth = (Math.PI * 2) / teeth;
  const toothWidth = 0.35; // fraction of anglePerTooth for tooth top

  const points: string[] = [];

  for (let i = 0; i < teeth; i++) {
    const startAngle = i * anglePerTooth;

    // Valley start
    const v1x = cx + baseRadius * Math.cos(startAngle);
    const v1y = cy + baseRadius * Math.sin(startAngle);

    // Tooth rise
    const riseAngle = startAngle + anglePerTooth * (0.5 - toothWidth / 2);
    const r1x = cx + tipRadius * Math.cos(riseAngle);
    const r1y = cy + tipRadius * Math.sin(riseAngle);

    // Tooth top
    const topAngle = startAngle + anglePerTooth * (0.5 + toothWidth / 2);
    const r2x = cx + tipRadius * Math.cos(topAngle);
    const r2y = cy + tipRadius * Math.sin(topAngle);

    // Valley end
    const endAngle = startAngle + anglePerTooth;
    const v2x = cx + baseRadius * Math.cos(endAngle);
    const v2y = cy + baseRadius * Math.sin(endAngle);

    if (i === 0) {
      points.push(`M ${v1x} ${v1y}`);
    } else {
      points.push(`L ${v1x} ${v1y}`);
    }
    points.push(`L ${r1x} ${r1y}`);
    points.push(`L ${r2x} ${r2y}`);
    points.push(`L ${v2x} ${v2y}`);
  }

  points.push('Z');
  return points.join(' ');
}

/**
 * Generate a circular SVG path for the gear's center hole.
 */
export function generateHolePath(config: GearConfig): string {
  const { cx, cy, innerRadius } = config;
  const r = config.holeRadius ?? innerRadius * 0.4;
  // SVG circle as two arcs
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

/**
 * Create a gear layout for the background.
 * Generates an interlocking set of gears that mesh correctly.
 * Adjacent gears rotate in opposite directions at speed inversely proportional to teeth count.
 */
export function createGearLayout(viewportWidth: number, viewportHeight: number): GearData[] {
  const baseSpeed = 0.15; // degrees per frame for reference gear
  const refTeeth = 24;

  // Define gear configurations relative to viewport
  const configs: Array<GearConfig & { direction: 1 | -1 }> = [
    // Large center-left gear
    {
      cx: viewportWidth * 0.25,
      cy: viewportHeight * 0.45,
      teeth: 32,
      innerRadius: Math.min(viewportWidth, viewportHeight) * 0.1,
      outerRadius: Math.min(viewportWidth, viewportHeight) * 0.14,
      direction: 1,
    },
    // Medium top-right gear (meshes with center-left)
    {
      cx: viewportWidth * 0.52,
      cy: viewportHeight * 0.2,
      teeth: 20,
      innerRadius: Math.min(viewportWidth, viewportHeight) * 0.065,
      outerRadius: Math.min(viewportWidth, viewportHeight) * 0.09,
      direction: -1,
    },
    // Small gear between the two
    {
      cx: viewportWidth * 0.4,
      cy: viewportHeight * 0.32,
      teeth: 14,
      innerRadius: Math.min(viewportWidth, viewportHeight) * 0.04,
      outerRadius: Math.min(viewportWidth, viewportHeight) * 0.06,
      direction: 1,
    },
    // Large bottom-right gear
    {
      cx: viewportWidth * 0.75,
      cy: viewportHeight * 0.65,
      teeth: 28,
      innerRadius: Math.min(viewportWidth, viewportHeight) * 0.085,
      outerRadius: Math.min(viewportWidth, viewportHeight) * 0.12,
      direction: -1,
    },
    // Small bottom-left gear
    {
      cx: viewportWidth * 0.15,
      cy: viewportHeight * 0.78,
      teeth: 16,
      innerRadius: Math.min(viewportWidth, viewportHeight) * 0.045,
      outerRadius: Math.min(viewportWidth, viewportHeight) * 0.065,
      direction: 1,
    },
    // Medium top-left gear
    {
      cx: viewportWidth * 0.1,
      cy: viewportHeight * 0.15,
      teeth: 22,
      innerRadius: Math.min(viewportWidth, viewportHeight) * 0.06,
      outerRadius: Math.min(viewportWidth, viewportHeight) * 0.085,
      direction: -1,
    },
    // Small right-edge gear
    {
      cx: viewportWidth * 0.88,
      cy: viewportHeight * 0.35,
      teeth: 12,
      innerRadius: Math.min(viewportWidth, viewportHeight) * 0.035,
      outerRadius: Math.min(viewportWidth, viewportHeight) * 0.05,
      direction: 1,
    },
    // Large bottom-center gear
    {
      cx: viewportWidth * 0.5,
      cy: viewportHeight * 0.85,
      teeth: 36,
      innerRadius: Math.min(viewportWidth, viewportHeight) * 0.11,
      outerRadius: Math.min(viewportWidth, viewportHeight) * 0.15,
      direction: -1,
    },
  ];

  return configs.map(({ direction, ...config }) => ({
    config,
    path: generateGearPath(config),
    holePath: generateHolePath(config),
    rotation: 0,
    speed: (baseSpeed * refTeeth) / config.teeth,
    direction,
  }));
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: No errors (file has no imports from removed files)

**Step 3: Commit**

```bash
git add src/lib/gears.ts
git commit -m "Add procedural SVG gear generation utility"
```

---

### Task 4: GearBackground Component

**Files:**
- Create: `src/components/GearBackground.tsx`

**Step 1: Write the animated gear background component**

```tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { createGearLayout, type GearData } from '../lib/gears';

export default function GearBackground() {
  const [gears, setGears] = useState<GearData[]>([]);
  const rotationsRef = useRef<number[]>([]);
  const animFrameRef = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const initGears = useCallback(() => {
    const layout = createGearLayout(window.innerWidth, window.innerHeight);
    rotationsRef.current = layout.map(() => 0);
    setGears(layout);
  }, []);

  useEffect(() => {
    initGears();
    const handleResize = () => initGears();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initGears]);

  useEffect(() => {
    if (gears.length === 0) return;

    const animate = () => {
      const groups = svgRef.current?.querySelectorAll<SVGGElement>('.gear-group');
      if (groups) {
        gears.forEach((gear, i) => {
          rotationsRef.current[i] += gear.speed * gear.direction;
          const g = groups[i];
          if (g) {
            g.setAttribute(
              'transform',
              `rotate(${rotationsRef.current[i]} ${gear.config.cx} ${gear.config.cy})`
            );
          }
        });
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gears]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {gears.map((gear, i) => (
        <g key={i} className="gear-group">
          <path
            d={gear.path}
            fill={i % 3 === 0 ? 'var(--color-gear-accent)' : i % 3 === 1 ? 'var(--color-gear-accent-2)' : 'var(--color-gear)'}
            stroke="var(--color-gear-stroke)"
            strokeWidth="1"
            opacity={i % 3 === 0 ? 0.12 : 0.08}
          />
          <path
            d={gear.holePath}
            fill="var(--color-bg)"
            stroke="var(--color-gear-stroke)"
            strokeWidth="0.5"
            opacity={i % 3 === 0 ? 0.15 : 0.1}
          />
        </g>
      ))}
    </svg>
  );
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/GearBackground.tsx
git commit -m "Add animated SVG gear background component"
```

---

### Task 5: Router Setup, Layout & NavBar

**Files:**
- Create: `src/components/Layout.tsx`
- Create: `src/components/NavBar.tsx`
- Modify: `src/App.tsx` (full rewrite)
- Modify: `src/main.tsx`
- Create: `src/pages/Landing.tsx` (placeholder)
- Create: `src/pages/Blog.tsx` (placeholder)
- Create: `src/pages/BlogPost.tsx` (placeholder)
- Create: `src/pages/Projects.tsx` (placeholder)
- Create: `src/pages/ProjectDetail.tsx` (placeholder)
- Create: `src/pages/About.tsx` (placeholder)

**Step 1: Create NavBar component**

`src/components/NavBar.tsx`:
```tsx
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/blog', label: 'Blog' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
];

export default function NavBar() {
  const location = useLocation();

  // Hide nav on landing page
  if (location.pathname === '/') return null;

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      background: 'rgba(15, 17, 23, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-gear-stroke)',
    }}>
      <Link to="/" style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.02em' }}>
        Alex Barclay
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              color: location.pathname.startsWith(to) ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

**Step 2: Create Layout component**

`src/components/Layout.tsx`:
```tsx
import { Outlet } from 'react-router-dom';
import GearBackground from './GearBackground';
import NavBar from './NavBar';

export default function Layout() {
  return (
    <>
      <GearBackground />
      <NavBar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>
    </>
  );
}
```

**Step 3: Create placeholder page components**

`src/pages/Landing.tsx`:
```tsx
import { Link } from 'react-router-dom';

const navItems = [
  { to: '/blog', label: 'Blog' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
];

export default function Landing() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      gap: '1rem',
    }}>
      <h1 style={{
        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--color-text)',
      }}>
        Alex Barclay
      </h1>
      <p style={{
        fontSize: 'clamp(1rem, 2vw, 1.3rem)',
        color: 'var(--color-text-muted)',
        fontWeight: 300,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Software Engineer
      </p>
      <nav style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
        {navItems.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              color: 'var(--color-accent)',
              fontSize: '0.95rem',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.5rem 1rem',
              border: '1px solid var(--color-accent-dim)',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

Create minimal placeholder files for the remaining pages:

`src/pages/Blog.tsx`:
```tsx
export default function Blog() {
  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <h1>Blog</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Coming soon.</p>
    </div>
  );
}
```

`src/pages/BlogPost.tsx`:
```tsx
export default function BlogPost() {
  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <p style={{ color: 'var(--color-text-muted)' }}>Post not found.</p>
    </div>
  );
}
```

`src/pages/Projects.tsx`:
```tsx
export default function Projects() {
  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '64rem', margin: '0 auto' }}>
      <h1>Projects</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Coming soon.</p>
    </div>
  );
}
```

`src/pages/ProjectDetail.tsx`:
```tsx
export default function ProjectDetail() {
  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <p style={{ color: 'var(--color-text-muted)' }}>Project not found.</p>
    </div>
  );
}
```

`src/pages/About.tsx`:
```tsx
export default function About() {
  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <h1>About</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Coming soon.</p>
    </div>
  );
}
```

**Step 4: Rewrite `src/App.tsx` with router**

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'blog', element: <Blog /> },
      { path: 'blog/:slug', element: <BlogPost /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:slug', element: <ProjectDetail /> },
      { path: 'about', element: <About /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

**Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no type errors.

**Step 6: Verify dev server works**

Run: `npm run dev`
Expected: Landing page renders with gear background and nav links. Clicking links navigates between placeholder pages. Nav bar appears on sub-pages but not on landing.

**Step 7: Commit**

```bash
git add -A
git commit -m "Set up React Router with layout, nav, and placeholder pages"
```

---

### Task 6: Content Loading Pipeline

**Files:**
- Create: `src/lib/content.ts`
- Create: `content/blog/.gitkeep`
- Create: `content/projects/.gitkeep`

**Step 1: Write the content loading utilities**

This module uses Vite's `import.meta.glob` to load Markdown files as raw strings, parses YAML frontmatter with the `yaml` package, and converts Markdown to HTML with `marked` + `highlight.js`.

`src/lib/content.ts`:
```typescript
import { parse as parseYaml } from 'yaml';
import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked with syntax highlighting
marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(text, { language }).value;
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    },
  },
});

export interface BlogFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
}

export interface ProjectFrontmatter {
  title: string;
  description: string;
  thumbnail?: string;
  tags: string[];
  date: string;
  links?: {
    github?: string;
    live?: string;
  };
}

export interface ContentEntry<T> {
  slug: string;
  frontmatter: T;
  html: string;
}

/**
 * Parse a raw Markdown string with YAML frontmatter.
 * Returns the parsed frontmatter data and the Markdown body converted to HTML.
 */
function parseMarkdown<T>(raw: string): { frontmatter: T; html: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {} as T, html: marked.parse(raw) as string };
  }
  const frontmatter = parseYaml(match[1]) as T;
  const html = marked.parse(match[2]) as string;
  return { frontmatter, html };
}

/**
 * Extract slug from a content file path.
 * "/content/blog/2026-02-27-my-post.md" -> "my-post"
 * Strips leading date prefix (YYYY-MM-DD-) if present.
 */
function slugFromPath(path: string): string {
  const filename = path.split('/').pop()!.replace(/\.md$/, '');
  return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

// Glob all markdown files at build time (as raw strings)
const blogModules = import.meta.glob<string>('/content/blog/*.md', {
  query: '?raw',
  import: 'default',
});

const projectModules = import.meta.glob<string>('/content/projects/*.md', {
  query: '?raw',
  import: 'default',
});

/**
 * Load all blog posts, sorted by date descending.
 */
export async function loadBlogPosts(): Promise<ContentEntry<BlogFrontmatter>[]> {
  const entries: ContentEntry<BlogFrontmatter>[] = [];

  for (const [path, loader] of Object.entries(blogModules)) {
    const raw = await loader();
    const { frontmatter, html } = parseMarkdown<BlogFrontmatter>(raw);
    entries.push({ slug: slugFromPath(path), frontmatter, html });
  }

  return entries.sort(
    (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );
}

/**
 * Load a single blog post by slug.
 */
export async function loadBlogPost(slug: string): Promise<ContentEntry<BlogFrontmatter> | null> {
  for (const [path, loader] of Object.entries(blogModules)) {
    if (slugFromPath(path) === slug) {
      const raw = await loader();
      const { frontmatter, html } = parseMarkdown<BlogFrontmatter>(raw);
      return { slug, frontmatter, html };
    }
  }
  return null;
}

/**
 * Load all projects, sorted by date descending.
 */
export async function loadProjects(): Promise<ContentEntry<ProjectFrontmatter>[]> {
  const entries: ContentEntry<ProjectFrontmatter>[] = [];

  for (const [path, loader] of Object.entries(projectModules)) {
    const raw = await loader();
    const { frontmatter, html } = parseMarkdown<ProjectFrontmatter>(raw);
    entries.push({ slug: slugFromPath(path), frontmatter, html });
  }

  return entries.sort(
    (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );
}

/**
 * Load a single project by slug.
 */
export async function loadProject(slug: string): Promise<ContentEntry<ProjectFrontmatter> | null> {
  for (const [path, loader] of Object.entries(projectModules)) {
    if (slugFromPath(path) === slug) {
      const raw = await loader();
      const { frontmatter, html } = parseMarkdown<ProjectFrontmatter>(raw);
      return { slug, frontmatter, html };
    }
  }
  return null;
}
```

**Step 2: Add highlight.js CSS import to `src/main.tsx`**

Add this import at the top of `src/main.tsx`:
```typescript
import 'highlight.js/styles/github-dark.css';
```

**Step 3: Create `.gitkeep` files so empty content dirs are tracked**

```bash
touch content/blog/.gitkeep content/projects/.gitkeep
```

**Step 4: Add a sample blog post for testing**

`content/blog/2026-02-27-hello-world.md`:
```markdown
---
title: "Hello World"
date: 2026-02-27
excerpt: "The first post on my new portfolio site."
tags: ["meta"]
---

# Hello World

This is the first post on my new site. I'm rebuilding my portfolio as a hub
for my work across software engineering, machine learning, robotics, and
eventually game design.

## What's Coming

- Blog posts about projects and technical deep-dives
- A showcase of past and current work
- Notes on the transition from SWE to ML/robotics

```javascript
console.log("Stay tuned.");
```

More to come.
```

**Step 5: Add a sample project for testing**

`content/projects/2026-01-15-portfolio-site.md`:
```markdown
---
title: "Portfolio Site"
description: "Personal portfolio with animated gear background, blog, and project showcase."
thumbnail: ""
tags: ["react", "typescript", "vite", "svg"]
date: 2026-01-15
links:
  github: "https://github.com/yourusername/portfolio"
---

# Portfolio Site

My personal portfolio, built with React 19 and TypeScript. Features a procedurally
generated animated gear background rendered in SVG.

## Tech Stack

- React 19 + TypeScript
- Vite for build tooling
- React Router for client-side navigation
- Markdown content pipeline with syntax highlighting
```

**Step 6: Verify types compile**

Run: `npm run build`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add -A
git commit -m "Add Markdown content loading pipeline with sample posts"
```

---

### Task 7: Blog Pages

**Files:**
- Create: `src/components/BlogCard.tsx`
- Modify: `src/pages/Blog.tsx`
- Modify: `src/pages/BlogPost.tsx`

**Step 1: Create BlogCard component**

`src/components/BlogCard.tsx`:
```tsx
import { Link } from 'react-router-dom';
import type { BlogFrontmatter } from '../lib/content';

interface Props {
  slug: string;
  frontmatter: BlogFrontmatter;
}

export default function BlogCard({ slug, frontmatter }: Props) {
  return (
    <Link
      to={`/blog/${slug}`}
      style={{
        display: 'block',
        padding: '1.5rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-gear-stroke)',
        borderRadius: '8px',
        transition: 'background 0.2s, border-color 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--color-surface-hover)';
        e.currentTarget.style.borderColor = 'var(--color-accent-dim)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--color-surface)';
        e.currentTarget.style.borderColor = 'var(--color-gear-stroke)';
      }}
    >
      <time style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
        {new Date(frontmatter.date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      </time>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.4rem 0', color: 'var(--color-text)' }}>
        {frontmatter.title}
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        {frontmatter.excerpt}
      </p>
      {frontmatter.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          {frontmatter.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.75rem',
              color: 'var(--color-accent)',
              background: 'var(--color-accent-dim)',
              padding: '0.15rem 0.5rem',
              borderRadius: '3px',
              letterSpacing: '0.03em',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
```

**Step 2: Implement Blog listing page**

Replace `src/pages/Blog.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { loadBlogPosts, type ContentEntry, type BlogFrontmatter } from '../lib/content';
import BlogCard from '../components/BlogCard';

export default function Blog() {
  const [posts, setPosts] = useState<ContentEntry<BlogFrontmatter>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogPosts().then(p => { setPosts(p); setLoading(false); });
  }, []);

  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Blog</h1>
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No posts yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map(post => (
            <BlogCard key={post.slug} slug={post.slug} frontmatter={post.frontmatter} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Implement BlogPost page**

Replace `src/pages/BlogPost.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadBlogPost, type ContentEntry, type BlogFrontmatter } from '../lib/content';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<ContentEntry<BlogFrontmatter> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    loadBlogPost(slug).then(p => { setPost(p); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Post not found.</p>
        <Link to="/blog" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Blog</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <Link to="/blog" style={{
        fontSize: '0.85rem',
        color: 'var(--color-text-muted)',
        display: 'inline-block',
        marginBottom: '2rem',
      }}>
        &larr; Back to Blog
      </Link>
      <time style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
        {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      </time>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        {post.frontmatter.title}
      </h1>
      {post.frontmatter.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {post.frontmatter.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.75rem',
              color: 'var(--color-accent)',
              background: 'var(--color-accent-dim)',
              padding: '0.15rem 0.5rem',
              borderRadius: '3px',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <article
        style={{ lineHeight: 1.8, color: 'var(--color-text)' }}
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </div>
  );
}
```

**Step 4: Verify build and test manually**

Run: `npm run build`
Expected: Build succeeds.

Run: `npm run dev`
Expected: `/blog` shows the "Hello World" post card. Clicking it navigates to `/blog/hello-world` and renders the full post with syntax-highlighted code.

**Step 5: Commit**

```bash
git add -A
git commit -m "Implement blog listing and post pages with Markdown rendering"
```

---

### Task 8: Project Pages

**Files:**
- Create: `src/components/ProjectCard.tsx`
- Modify: `src/pages/Projects.tsx`
- Modify: `src/pages/ProjectDetail.tsx`

**Step 1: Create ProjectCard component**

`src/components/ProjectCard.tsx`:
```tsx
import { Link } from 'react-router-dom';
import type { ProjectFrontmatter } from '../lib/content';

interface Props {
  slug: string;
  frontmatter: ProjectFrontmatter;
}

export default function ProjectCard({ slug, frontmatter }: Props) {
  return (
    <Link
      to={`/projects/${slug}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-gear-stroke)',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'background 0.2s, border-color 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--color-surface-hover)';
        e.currentTarget.style.borderColor = 'var(--color-accent-dim)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--color-surface)';
        e.currentTarget.style.borderColor = 'var(--color-gear-stroke)';
      }}
    >
      {frontmatter.thumbnail && (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          background: 'rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          <img
            src={frontmatter.thumbnail}
            alt={frontmatter.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.4rem' }}>
          {frontmatter.title}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {frontmatter.description}
        </p>
        {frontmatter.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {frontmatter.tags.map(tag => (
              <span key={tag} style={{
                fontSize: '0.7rem',
                color: 'var(--color-accent)',
                background: 'var(--color-accent-dim)',
                padding: '0.1rem 0.45rem',
                borderRadius: '3px',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
```

**Step 2: Implement Projects listing page**

Replace `src/pages/Projects.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { loadProjects, type ContentEntry, type ProjectFrontmatter } from '../lib/content';
import ProjectCard from '../components/ProjectCard';

export default function Projects() {
  const [projects, setProjects] = useState<ContentEntry<ProjectFrontmatter>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects().then(p => { setProjects(p); setLoading(false); });
  }, []);

  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '64rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Projects</h1>
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No projects yet.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {projects.map(project => (
            <ProjectCard key={project.slug} slug={project.slug} frontmatter={project.frontmatter} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Implement ProjectDetail page**

Replace `src/pages/ProjectDetail.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadProject, type ContentEntry, type ProjectFrontmatter } from '../lib/content';

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ContentEntry<ProjectFrontmatter> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    loadProject(slug).then(p => { setProject(p); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Project not found.</p>
        <Link to="/projects" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Projects</Link>
      </div>
    );
  }

  const { frontmatter, html } = project;

  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <Link to="/projects" style={{
        fontSize: '0.85rem',
        color: 'var(--color-text-muted)',
        display: 'inline-block',
        marginBottom: '2rem',
      }}>
        &larr; Back to Projects
      </Link>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {frontmatter.title}
      </h1>
      <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        {frontmatter.description}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {frontmatter.tags.map(tag => (
          <span key={tag} style={{
            fontSize: '0.75rem',
            color: 'var(--color-accent)',
            background: 'var(--color-accent-dim)',
            padding: '0.15rem 0.5rem',
            borderRadius: '3px',
          }}>
            {tag}
          </span>
        ))}
      </div>
      {frontmatter.links && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {frontmatter.links.github && (
            <a href={frontmatter.links.github} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.85rem' }}>
              GitHub &rarr;
            </a>
          )}
          {frontmatter.links.live && (
            <a href={frontmatter.links.live} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.85rem' }}>
              Live Demo &rarr;
            </a>
          )}
        </div>
      )}
      <article
        style={{ lineHeight: 1.8, color: 'var(--color-text)' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
```

**Step 4: Verify build and test manually**

Run: `npm run build`
Expected: Build succeeds.

Run: `npm run dev`
Expected: `/projects` shows the sample project card. Clicking navigates to the detail page with rendered Markdown.

**Step 5: Commit**

```bash
git add -A
git commit -m "Implement project listing and detail pages"
```

---

### Task 9: About Page

**Files:**
- Create: `content/about.md`
- Modify: `src/pages/About.tsx`

**Step 1: Create about content**

`content/about.md`:
```markdown
---
title: "About"
---

# About Me

I'm Alex Barclay, a software engineer navigating the intersection of software,
machine learning, robotics, and game design.

## Get in Touch

- [GitHub](https://github.com/yourusername)
- [LinkedIn](https://linkedin.com/in/yourusername)
```

Note: Update the links and bio with your actual info.

**Step 2: Implement About page to load Markdown**

Replace `src/pages/About.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { parse as parseYaml } from 'yaml';
import { marked } from 'marked';

export default function About() {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const modules = import.meta.glob<string>('/content/about.md', {
      query: '?raw',
      import: 'default',
    });

    const loader = Object.values(modules)[0];
    if (!loader) {
      setLoading(false);
      return;
    }

    loader().then(raw => {
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      const body = match ? match[2] : raw;
      setHtml(marked.parse(body) as string);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '6rem 2rem 2rem', maxWidth: '48rem', margin: '0 auto' }}>
      <article
        style={{ lineHeight: 1.8, color: 'var(--color-text)' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add -A
git commit -m "Implement about page with Markdown content"
```

---

### Task 10: GitHub Pages Deployment

**Files:**
- Modify: `vite.config.ts`
- Create: `.github/workflows/deploy.yml`

**Step 1: Update Vite config for GitHub Pages**

If deploying to `https://<username>.github.io/<repo>/`, set `base`. If deploying to `https://<username>.github.io/` (user site), no base needed. Configure for repo site by default:

Replace `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Portfolio/',
})
```

Note: Change `'/Portfolio/'` to match your actual repo name, or remove the `base` property if this will be a `<username>.github.io` user site.

**Step 2: Create GitHub Actions workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Copy index.html to 404.html for SPA routing
        run: cp dist/index.html dist/404.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Key detail: the `cp dist/index.html dist/404.html` step ensures GitHub Pages serves the SPA shell for all routes.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds. `dist/` contains `index.html` and bundled assets.

**Step 4: Commit**

```bash
git add -A
git commit -m "Add GitHub Pages deployment workflow and Vite base config"
```

---

### Task 11: Final Cleanup

**Files:**
- Modify: `CLAUDE.md` (update to reflect new architecture)
- Modify: `README.md`
- Delete: `src/assets/` (empty directory)

**Step 1: Clean up empty directories and unused files**

```bash
rmdir src/assets 2>/dev/null || true
rm content/blog/.gitkeep content/projects/.gitkeep 2>/dev/null || true
```

(The .gitkeep files are no longer needed since we have actual content files.)

**Step 2: Update CLAUDE.md to reflect new architecture**

Update the Architecture and Key Patterns sections to describe the new multi-page structure, content pipeline, gear background, etc.

**Step 3: Run full build and lint**

Run: `npm run lint && npm run build`
Expected: Both pass cleanly.

**Step 4: Manual smoke test**

Run: `npm run dev`

Verify all routes:
- `/` — Landing page with gears, name, nav links
- `/blog` — Blog listing with "Hello World" card
- `/blog/hello-world` — Full post with syntax highlighting
- `/projects` — Project grid with sample project
- `/projects/portfolio-site` — Project detail page
- `/about` — About page with bio

Verify gear background:
- Gears are visible and rotating on all pages
- Gears don't interfere with content readability
- Background persists across route changes (no flash/reload)

Verify navigation:
- NavBar hidden on landing, visible on all other pages
- All links work correctly
- Back links on post/project detail pages work

**Step 5: Commit**

```bash
git add -A
git commit -m "Final cleanup: update docs and remove unused files"
```
