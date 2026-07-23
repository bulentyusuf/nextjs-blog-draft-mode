import { describe, it, expect } from "vitest";
import { pickActiveHeading, type HeadingPosition } from "./toc-active";

// Headings arrive in document order; `top` is the live viewport offset. A
// positive top sits below the viewport top, a negative one has scrolled above
// it. bandTop is the line a heading must cross to become active (matches
// rootMargin, and is at least the heading's own scroll-margin-top).
const BAND_TOP = 80;

const pos = (id: string, top: number): HeadingPosition => ({ id, top });

describe("pickActiveHeading", () => {
  it("does not let a heading in the lower viewport steal the highlight", () => {
    // The exact reported bug: section 7's heading has just risen into view a
    // third of the way down the screen ("larry", top 300), while the reader is
    // still inside section 6 ("pirates", top -400, scrolled above the line).
    // Only a heading whose top has passed the line counts, so "pirates" holds.
    const positions = [pos("pirates", -400), pos("larry", 300)];
    expect(pickActiveHeading(positions, 100)).toBe("pirates");
  });

  it("counts a heading parked at exactly the scroll-margin as passed (ToC click)", () => {
    // A ToC click parks the target at its scroll-margin-top (96px). bandTop
    // deliberately exceeds that (100 here) so the parked heading counts as
    // passed and highlights itself. Drop bandTop below the scroll-margin and
    // every ToC click silently regresses by one section.
    const positions = [pos("pirates", -400), pos("larry", 96)];
    expect(pickActiveHeading(positions, 100)).toBe("larry");
  });

  it("falls back to the last heading passed", () => {
    // Reader is deep inside a long section: three headings sit above the line,
    // one below. The last one passed (largest top still <= bandTop) is the
    // section they are inside.
    const positions = [
      pos("intro", -900),
      pos("setup", -500),
      pos("usage", -60),
      pos("teardown", 400),
    ];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("usage");
  });

  it("handles negative tops", () => {
    // Every passed heading has scrolled above the viewport (negative top).
    // The one nearest bandTop from below (-40) is the current section.
    const positions = [pos("intro", -300), pos("setup", -40)];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("setup");
  });

  it("returns \"\" when every heading is still below the line (the lede)", () => {
    const positions = [pos("intro", 200), pos("setup", 600)];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("");
  });

  it("returns \"\" for an empty position set", () => {
    expect(pickActiveHeading([], BAND_TOP)).toBe("");
  });

  it("breaks a tie to document order", () => {
    // Two passed headings at the same top; the later in document order (last
    // in the array) must win. p.top >= best.top adopts the later one.
    const positions = [pos("first", -20), pos("second", -20)];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("second");
  });
});
