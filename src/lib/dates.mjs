/**
 * Frontmatter dates are calendar days. `z.coerce.date()` resolves an unquoted
 * `2026-08-10` to UTC midnight, so formatting in local time renders the previous
 * day anywhere west of Greenwich. Formatting in UTC is what keeps the printed
 * date the authored one.
 *
 * Carried over from the React site rather than re-derived: Astro does not fix
 * this, and the bug is invisible on a UTC machine.
 *
 * @param {string | Date} value
 * @returns {string} e.g. "August 10, 2026"
 */
export function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(value instanceof Date ? value : new Date(value));
}
