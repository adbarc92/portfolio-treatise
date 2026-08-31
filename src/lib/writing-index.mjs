// One ordered list across the three collections, so /writing/ can show everything
// written in a single sequence and count what its chips describe.
//
// The three collections carry different frontmatter — an essay has an excerpt and
// a category, a specification document has a summary and an order, a project has
// a description — so each is mapped into one shape here rather than being
// special-cased at every call site.

/** The kinds a chip may filter by. Closed, for the same reason categories are. */
export const KINDS = ["essay", "specification", "project"];

/**
 * Eidos documents carry no date, only an `order`. They are one continuous
 * specification rather than dated pieces, so they sort among themselves by that
 * order and land beneath everything dated. The epoch is the mechanism; the intent
 * is "the specification is a fixture, not a recent event."
 */
const specDate = (order) => new Date(order * 1000);

/**
 * @param {{ posts: object[], docs: object[], projects: object[] }} collections
 * @returns {{ kind: string, title: string, href: string, blurb: string, date: Date, category?: string }[]}
 */
export function toEntries({ posts = [], docs = [], projects = [] }) {
  const entries = [
    ...posts.map((p) => ({
      kind: "essay",
      title: p.data.title,
      href: `/writing/${p.id}`,
      blurb: p.data.excerpt,
      date: p.data.date,
      category: p.data.category,
    })),
    ...docs.map((d) => ({
      kind: "specification",
      title: d.data.title,
      href: `/writing/eidos/${d.id}`,
      blurb: d.data.summary,
      date: specDate(d.data.order),
    })),
    ...projects.map((p) => ({
      kind: "project",
      title: p.data.title,
      href: `/writing/projects/${p.id}`,
      blurb: p.data.description,
      date: p.data.date,
    })),
  ];

  return entries.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

const tally = (values) => {
  const counts = {};
  for (const v of values) if (v) counts[v] = (counts[v] ?? 0) + 1;
  return counts;
};

/** How many entries of each kind. Kinds with none are omitted — no empty rooms. */
export function countByKind(entries) {
  return tally(entries.map((e) => e.kind));
}

/** How many essays in each category. Only essays carry one. */
export function countByCategory(entries) {
  return tally(entries.map((e) => e.category));
}
