import { useEffect, useState } from "react";

import CategoryFilter from "./CategoryFilter";
import { asCategory, nextSearch, selectPosts } from "../lib/post-filter.mjs";

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  /** Formatted server-side, in UTC. The island does no date arithmetic. */
  dateLabel: string;
  dateTime: string;
  draft: boolean;
}

interface Props {
  posts: Post[];
  /** Dev only. A draft read in `astro dev` must never be mistaken for live. */
  showDrafts?: boolean;
}

export default function BlogList({ posts, showDrafts = false }: Props) {
  // Astro renders this component to static HTML at build time, where there is no
  // URL to read. Both filters therefore start empty — matching what the server
  // emitted — and the URL is applied on hydration. That also means the full list
  // is in the HTML for a reader without JavaScript.
  const [category, setCategory] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategory(asCategory(params.get("category")));
    setTag(params.get("tag"));
  }, []);

  function selectCategory(next: string | null) {
    setCategory(next);

    // replaceState, not push: filtering is not a destination, and the React site
    // it replaces used { replace: true } for the same reason.
    const search = nextSearch(window.location.search, next);
    window.history.replaceState({}, "", search || window.location.pathname);
  }

  const { pool, visible, counts } = selectPosts(posts, { tag, category });

  // Clearing is a link to the unfiltered page rather than a handler: it is what
  // the React site did, and it is the one control here that still works with
  // JavaScript off.
  return (
    <>
      {tag && (
        <p className="tag-notice">
          Tagged &ldquo;{tag}&rdquo; &middot; <a href="/writing/blog">clear</a>
        </p>
      )}

      <CategoryFilter
        counts={counts}
        active={category}
        total={pool.length}
        onSelect={selectCategory}
      />

      {visible.length === 0 ? (
        <p className="empty">
          Nothing here yet. <a href="/writing/blog">Show everything</a>
        </p>
      ) : (
        <div className="post-list">
          {visible.map((post) => (
            <a className="card post-card" key={post.slug} href={`/writing/blog/${post.slug}`}>
              {showDrafts && post.draft && <span className="draft-badge">DRAFT</span>}
              <time className="meta" dateTime={post.dateTime}>
                {post.dateLabel}
              </time>
              <h2 className="card__title">{post.title}</h2>
              <p className="card__excerpt">{post.excerpt}</p>
              {post.tags.length > 0 && (
                <div className="tags post-card__tags">
                  {post.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
