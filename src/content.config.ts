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

// The projects collection is gone. claims.yaml's `catalogue:` is now the only
// source of what has been built, because two stores meant two disagreeing
// answers: four projects on the root and two different ones under /writing.


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

export const collections = { blog, eidos, about };
