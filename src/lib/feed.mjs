// The feed, shaped by hand.
//
// @astrojs/rss hardcodes the guid to the item's link and exposes no override
// (dist/index.js: `item.guid = { "#text": itemLink, "@_isPermaLink": "true" }`).
// When essays moved from /writing/blog/<slug> to /writing/<slug>, keeping the
// library would have changed every guid — and a changed guid republishes every
// old post into every subscriber's reader as though it were new. That is not a
// mistake anyone can take back, so the feed is built here instead.
//
// The guid is an identifier, not an address. It stays pinned to the URL the
// essays were first published at, forever, and says so with isPermaLink="false".

import { SITE, absoluteUrl } from "./site.mjs";

/** Where essays were first published. Frozen: every guid derives from it. */
export const HISTORICAL_PREFIX = `${SITE.origin}/writing/blog`;

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

/**
 * @param {string} value
 * @returns {string} safe to place in XML text or an attribute
 */
export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

/**
 * RFC-822 in GMT, matching the format the live feed already publishes.
 * @param {Date} date
 * @returns {string}
 */
export function rfc822(date) {
  return (
    `${DAYS[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ` +
    `${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:` +
    `${pad(date.getUTCSeconds())} GMT`
  );
}

/**
 * One feed item, escaped and ready to interpolate.
 * @param {{ id: string, data: { title: string, excerpt: string, date: Date } }} post
 */
export function feedItem(post) {
  return {
    title: escapeXml(post.data.title),
    description: escapeXml(post.data.excerpt),
    link: escapeXml(absoluteUrl(`/writing/${post.id}`)),
    // Escaped for the same reason the link is. Slugs are [a-z0-9-] so this is a
    // no-op today; it stays so that a malformed slug cannot emit invalid XML.
    guid: escapeXml(`${HISTORICAL_PREFIX}/${post.id}`),
    isPermaLink: false,
    pubDate: rfc822(post.data.date),
  };
}
