import { CATEGORY_IDS, CATEGORY_LABELS } from "../lib/post-filter.mjs";

interface Props {
  counts: Record<string, number>;
  active: string | null;
  total: number;
  onSelect: (category: string | null) => void;
}

export default function CategoryFilter({ counts, active, total, onSelect }: Props) {
  // Only categories that actually have posts get a chip, so the taxonomy can be
  // declared ahead of the writing without advertising empty rooms. One chip plus
  // "All" is not a choice, so the row hides itself below two.
  const present = CATEGORY_IDS.filter((id) => (counts[id] ?? 0) > 0);
  if (present.length < 2) return null;

  return (
    <div className="chips">
      <button
        type="button"
        className="chip"
        aria-pressed={active === null}
        onClick={() => onSelect(null)}
      >
        All ({total})
      </button>
      {present.map((id) => (
        <button
          key={id}
          type="button"
          className="chip"
          aria-pressed={active === id}
          onClick={() => onSelect(id)}
        >
          {CATEGORY_LABELS[id]} ({counts[id]})
        </button>
      ))}
    </div>
  );
}
