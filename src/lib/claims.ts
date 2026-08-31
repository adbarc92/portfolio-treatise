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

if (!data.workshop?.prose || typeof data.workshop.draft !== "boolean") fail("workshop incomplete");
{
  const names = (data.workshop.planned_plates ?? []).map((pp) => pp.name.toLowerCase());
  for (const r of markers(data.workshop.prose))
    if (!names.includes(r)) fail(`workshop: prose cites unknown planned plate ${r}`);
}

if (!data.author?.prose || typeof data.author.draft !== "boolean") fail("author incomplete");

export const claims: Claims = data;
