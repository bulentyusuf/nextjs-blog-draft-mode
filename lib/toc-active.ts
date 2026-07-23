// Which ToC entry should be highlighted.
//
// The active section is the last heading whose top has passed the line just
// under the sticky header. That is the only question, and it is answered from
// live geometry across every heading.
//
// An earlier version also had a "topmost heading currently intersecting the
// observer band wins" branch. That branch is why the ToC used to jump to the
// next section while the reader was still a screenful into the previous one:
// the band's lower edge sat 30% down the viewport, so a heading that had only
// just scrolled into view could claim the highlight. The band's lower edge
// gets no vote. Do not reintroduce it.

export interface HeadingPosition {
  /** The heading element's id, which is also its ToC slug. */
  id: string;
  /** Live getBoundingClientRect().top, read at decision time. */
  top: number;
}

/**
 * Returns the id to highlight, or "" for no highlight.
 *
 * @param positions Every heading, in document order.
 * @param bandTop   Distance in px from the viewport top to the line a heading
 *                  must cross to become active. Must be at least the heading's
 *                  own scroll-margin-top, or a heading parked there by a ToC
 *                  click will not count as passed.
 */
export function pickActiveHeading(
  positions: HeadingPosition[],
  bandTop: number,
): string {
  const passed = positions.filter((p) => p.top <= bandTop);

  // Every heading is still below the line, so the reader is above the first
  // one, in the lede. Nothing should be highlighted.
  if (passed.length === 0) return "";

  // The last heading passed is the section the reader is inside. `>=` adopts
  // the later element on a tie, which resolves to document order because
  // `positions` arrives in document order.
  return passed.reduce((best, p) => (p.top >= best.top ? p : best)).id;
}
