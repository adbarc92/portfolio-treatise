import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// These schemas replace the hand-rolled assertions that scripts/prerender.ts ran
// after the fact. Zod runs them at build time instead, so a malformed content file
// cannot reach a deploy.

// Slug rules live in a plain module so they can be tested without booting Astro —
// they decide every published URL, so they are covered against the real filenames
// in src/lib/slugs.test.mjs rather than trusted.
import { stripDate, stripOrder } from "./lib/slugs.mjs";

/**
 * The category set is closed on purpose. An open one drifts until `politics` and
 * `political` both exist and a filter silently splits in two. Adding a category is a
 * change to this line and the label map that renders it.
 */
export const CATEGORIES = ["software", "fiction", "politics", "meta"] as const;

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./content/blog",
    generateId: ({ entry }) => stripDate(entry),
  }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    excerpt: z.string().min(1),
    category: z.enum(CATEGORIES),
    tags: z.array(z.string()),
    // Absent means published. Only an explicit `true` withholds a post.
    draft: z.boolean().optional().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./content/projects",
    generateId: ({ entry }) => stripDate(entry),
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    // Authored as "" when there is no image, so this cannot be .url().
    thumbnail: z.string().optional(),
    tags: z.array(z.string()),
    date: z.coerce.date(),
    links: z
      .object({
        github: z.string().url().optional(),
        live: z.string().url().optional(),
      })
      .optional(),
  }),
});

const eidos = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./content/eidos",
    generateId: ({ entry }) => stripOrder(entry),
  }),
  schema: z.object({
    title: z.string().min(1),
    order: z.number().int().positive(),
    version: z.string().min(1),
    summary: z.string().min(1),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: "about.md", base: "./content" }),
  schema: z.object({ title: z.string().min(1) }),
});

export const collections = { blog, projects, eidos, about };
