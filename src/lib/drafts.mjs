/**
 * The single draft rule. A post is published unless it is flagged a draft, and
 * drafts are shown only where the caller says so — the dev server, never a build.
 *
 * The comparison is against `true` rather than truthy on purpose: this predicate
 * is the only thing standing between unfinished prose and the public internet, and
 * a `draft: "yes"` that reads as published is a louder failure than one that reads
 * as a draft.
 *
 * @param {{ draft?: unknown }} frontmatter
 * @param {boolean} showDrafts
 * @returns {boolean}
 */
export function isPublished(frontmatter, showDrafts) {
  return showDrafts || frontmatter.draft !== true;
}
