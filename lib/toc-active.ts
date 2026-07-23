// Which ToC entry should be highlighted, decided from the full picture rather
// than from whatever changed most recently.
//
// The observer callback only ever hands us a delta, so the component keeps its
// own record of every heading's latest state and passes the whole set here.
// Deciding from the delta alone was the original bug: a heading still sitting
// in the trigger band is absent from `entries` on ticks where it did not
// change, so it could not win even when it should have.

export interface HeadingPosition {
  /** The heading element's id, which is also its ToC slug. */
  id: string;
  /** Live getBoundingClientRect().top, read at decision time. */
  top: number;
  /** Latest known intersection state for this heading. */
  isIntersecting: boolean;
}

/**
 * Returns the id to highlight, or "" for no highlight.
 *
 * @param positions Every observed heading, in document order.
 * @param bandTop   Distance in px from the viewport top to the top edge of the
 *                  trigger band. Must match the observer's rootMargin.
 */
export function pickActiveHeading(
  positions: HeadingPosition[],
  bandTop: number,
): string {
  // A heading is in the band. Topmost wins, so the active entry is the section
  // heading nearest the sticky header rather than whatever is mid-viewport.
  const inBand = positions.filter((p) => p.isIntersecting);
  if (inBand.length > 0) {
    return inBand.reduce((best, p) => (p.top < best.top ? p : best)).id;
  }

  // Nothing is in the band. This happens constantly, because a section can be
  // far taller than the band, and the reader spends most of their time between
  // headings rather than on one. Fall back to the last heading scrolled past,
  // which is the section they are actually inside.
  const passed = positions.filter((p) => p.top <= bandTop);
  if (passed.length > 0) {
    return passed.reduce((best, p) => (p.top >= best.top ? p : best)).id;
  }

  // Every heading is still below the band, so the reader is above the first
  // one, in the lede. Nothing should be highlighted. The original code had no
  // path to this state, which is why the highlight got stuck.
  return "";
}
