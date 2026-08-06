import { LENS, PATH1, PATH2, TRANSFORM, VIEW_BOX } from "./search-emblem-art";

export default function SearchEmblem() {
  return (
    // Decorative only: the search input beside it is already labelled, so the
    // emblem is aria-hidden and carries no title.
    <svg
      viewBox={VIEW_BOX}
      className="h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      {/* Cream underlay = the glass silhouette. Transparent in light mode, a
          literal #FAF5F1 in dark (see .search-lens-ground in globals.css) —
          never a brand token, which would flip to near-black. */}
      <g transform={TRANSFORM}>
        <path className="search-lens-ground" d={LENS} stroke="none" />
      </g>
      <g transform={TRANSFORM} fill="currentColor" stroke="none">
        <path d={PATH1} />
        <path d={PATH2} />
      </g>
    </svg>
  );
}
