// The contents nav's link targets, kept out of the .astro component so they can
// be tested without rendering. DESIGN-SYSTEM §2.10: one list on every page, with
// treatise sections as anchors on the root and the essays as their own page.

/** The section whose content lives under /writing/ rather than on the root. */
export const ESSAYS_SECTION = "essays";

/**
 * Where a contents-nav entry points.
 *
 * @param {string} id section id
 * @param {boolean} onRoot whether the nav is rendering on the treatise's own page
 * @returns {string}
 */
export function sectionHref(id, onRoot) {
  if (id === ESSAYS_SECTION) return "/writing/";
  return onRoot ? `#${id}` : `/#${id}`;
}
