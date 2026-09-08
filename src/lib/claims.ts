// Loads claims.yaml and enforces its rendering rules at build time.
//
// claims.yaml governs claims and their evidence. It does NOT hold the essay list:
// content/blog is the only source of that, and the root's Essays section previews
// it. The two lists had already drifted — claims.yaml marked "The Price of the
// Ticket" draft: false while its own file marked it draft: true — so restoring an
// `essays:` block here would re-create a way to publish an unfinished essay.
// Fail-closed: a schema violation throws, which fails `astro build`.
// This is the in-process half of the claims gate; the CI half (walking
// rendered pages) arrives with the CI gates.
import { readFileSync } from "node:fs";
import { parse } from "yaml";

export interface Evidence {
  url: string;
  label: string;
}
export interface Claim {
  id: string;
  text: string;
  evidence: Evidence;
  verified: boolean;
}
export interface Project {
  id: string;
  name: string;
  meta_line: string;
  plate: { number: number; source: string | null; status: "derived" | "placeholder" | "planned" };
  draft: boolean;
  prose: string;
  claims: Claim[];
  not_yet: string[];
}
export interface CatalogueEntry {
  id: string;
  name: string;
  meta_line: string;
  /** Whether a reader can inspect the code. Decides nothing visually; it is the
   *  honest label on why the citation is a storefront and not a test file. */
  source: "open" | "closed";
  draft: boolean;
  href: string;
  href_label: string;
  tags: string[];
  date: Date | string;
  blurb: string;
  prose: string;
  claims: Claim[];
  not_yet: string[];
}

export interface Prose {
  draft: boolean;
  prose: string;
  margin?: string;
}
export interface Claims {
  meta: {
    thesis: string;
    epigraph: { text: string; cite: string };
    byline: { name: string; place: string; role: string };
    correspondence: { email: string; github: string; calendar: string };
  };
  sections: { plates_intro: Prose; essays_intro: Prose };
  projects: Project[];
  catalogue: CatalogueEntry[];
  workshop: Prose & {
    disciplines: string;
    planned_plates: { number: number; name: string; source: string | null; status: string }[];
  };
  author: Prose;
}

function fail(msg: string): never {
  throw new Error(`claims gate: ${msg} — build fails`);
}

function markers(prose: string): string[] {
  return [...prose.matchAll(/\[\^([\w-]+)\]/g)].map((m) => m[1]!);
}

const data = parse(
  readFileSync(new URL("../../claims.yaml", import.meta.url), "utf8"),
) as Claims;

if (!data.meta?.thesis) fail("meta.thesis missing");
if (!data.meta.epigraph?.text || !data.meta.epigraph?.cite) fail("epigraph incomplete");

for (const key of ["plates_intro", "essays_intro"] as const) {
  const s = data.sections?.[key];
  if (!s?.prose || typeof s.draft !== "boolean") fail(`sections.${key} incomplete`);
}

for (const p of data.projects ?? []) {
  if (!p.id || !p.name || !p.meta_line) fail(`project ${p.id ?? "?"} incomplete`);
  if (!["derived", "placeholder", "planned"].includes(p.plate?.status))
    fail(`project ${p.id}: plate.status invalid`);
  if (typeof p.draft !== "boolean") fail(`project ${p.id}: draft flag missing`);
  if (!Array.isArray(p.not_yet))
    fail(`project ${p.id}: not_yet missing (an empty list must be explicit)`);
  for (const c of p.claims ?? []) {
    if (!c.evidence?.url) fail(`project ${p.id}, claim ${c.id}: no evidence.url`);
    if (!c.evidence.label) fail(`project ${p.id}, claim ${c.id}: no evidence.label`);
    if (typeof c.verified !== "boolean") fail(`project ${p.id}, claim ${c.id}: verified missing`);
  }
  // every prose marker must cite a real claim; every claim must be cited
  const ids = (p.claims ?? []).map((c) => c.id);
  const refs = markers(p.prose ?? "");
  for (const r of refs) if (!ids.includes(r)) fail(`project ${p.id}: prose cites unknown claim ${r}`);
  for (const id of ids) if (!refs.includes(id)) fail(`project ${p.id}: claim ${id} never cited in prose`);
}

// Catalogue entries carry no plate by design (see claims.yaml), so the plate
// rules do not apply — but the citation rules do, and more strictly: a closed
// source means the storefront link is the only thing a reader can check, and a
// broken one leaves an assertion with nothing behind it.
for (const c of data.catalogue ?? []) {
  if (!c.id || !c.name || !c.meta_line) fail(`catalogue ${c.id ?? "?"} incomplete`);
  if (!["open", "closed"].includes(c.source)) fail(`catalogue ${c.id}: source must be open or closed`);
  if (typeof c.draft !== "boolean") fail(`catalogue ${c.id}: draft flag missing`);
  if (!c.href || !c.href_label) fail(`catalogue ${c.id}: needs a public href and a label for it`);
  if (!c.blurb) fail(`catalogue ${c.id}: blurb missing (the index renders it)`);
  if (!Array.isArray(c.tags)) fail(`catalogue ${c.id}: tags missing`);
  if (!Array.isArray(c.not_yet))
    fail(`catalogue ${c.id}: not_yet missing (an empty list must be explicit)`);
  // A shipped thing nobody can look at is exactly the case this document must
  // not fudge, so an entry that cites nothing at all is refused outright.
  if (!Array.isArray(c.claims) || c.claims.length === 0)
    fail(`catalogue ${c.id}: no claims — a catalogue entry must cite something public`);
  for (const cl of c.claims) {
    if (!cl.evidence?.url) fail(`catalogue ${c.id}, claim ${cl.id}: no evidence.url`);
    if (!cl.evidence.label) fail(`catalogue ${c.id}, claim ${cl.id}: no evidence.label`);
    if (typeof cl.verified !== "boolean") fail(`catalogue ${c.id}, claim ${cl.id}: verified missing`);
  }
  const ids = c.claims.map((x) => x.id);
  const refs = markers(c.prose ?? "");
  for (const r of refs) if (!ids.includes(r)) fail(`catalogue ${c.id}: prose cites unknown claim ${r}`);
  for (const id of ids) if (!refs.includes(id)) fail(`catalogue ${c.id}: claim ${id} never cited in prose`);
}

if (!data.workshop?.prose || typeof data.workshop.draft !== "boolean") fail("workshop incomplete");
{
  const names = (data.workshop.planned_plates ?? []).map((pp) => pp.name.toLowerCase());
  for (const r of markers(data.workshop.prose))
    if (!names.includes(r)) fail(`workshop: prose cites unknown planned plate ${r}`);
}

if (!data.author?.prose || typeof data.author.draft !== "boolean") fail("author incomplete");

export const claims: Claims = data;

/**
 * Catalogue entries in the shape the /writing index helpers expect.
 *
 * `toEntries` and the sitemap were written against Astro collection entries.
 * Adapting here rather than rewriting them keeps `writing-index.mjs` — and the
 * tests pinning it — untouched by where the data now comes from.
 */
export const catalogueAsEntries = data.catalogue.map((c) => ({
  id: c.id,
  data: {
    title: c.name,
    description: c.blurb,
    date: c.date instanceof Date ? c.date : new Date(String(c.date)),
    tags: c.tags,
  },
}));
