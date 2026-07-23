import { describe, it, expect } from "vitest";
import { pickActiveHeading, type HeadingPosition } from "./toc-active";

// Headings arrive in document order; `top` is the live viewport offset. A
// positive top sits below the viewport top, a negative one has scrolled above
// it. bandTop is the top edge of the trigger band (matches rootMargin).
const BAND_TOP = 80;

const pos = (
  id: string,
  top: number,
  isIntersecting: boolean,
): HeadingPosition => ({ id, top, isIntersecting });

describe("pickActiveHeading", () => {
  it("picks the topmost of several intersecting headings", () => {
    const positions = [
      pos("intro", -200, true),
      pos("setup", 40, true),
      pos("usage", 300, false),
    ];
    // Both "intro" and "setup" are in the band; the smaller top ("intro") wins.
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("intro");
  });

  it("lets an intersecting heading win even when it is not the delta that changed", () => {
    // Regression guard for defect 1. "setup" is the intersecting heading and
    // the correct winner, but it is neither the first array element nor, in a
    // real callback, necessarily the one whose state just changed. A
    // delta-only implementation that looked at whatever ticked most recently
    // ("intro" leaving, "usage" arriving as non-intersecting) could not
    // produce this. Deciding from the full set, "setup" wins.
    const positions = [
      pos("intro", -400, false),
      pos("setup", 30, true),
      pos("usage", 500, false),
    ];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("setup");
  });

  it("falls back to the last heading passed when nothing intersects", () => {
    // Reader is deep inside a long section: no heading is in the band, but
    // three sit above it. The last one passed (largest top still <= bandTop)
    // is the section they are inside.
    const positions = [
      pos("intro", -900, false),
      pos("setup", -500, false),
      pos("usage", -60, false),
      pos("teardown", 400, false),
    ];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("usage");
  });

  it("handles negative tops in the fallback branch", () => {
    // Every passed heading has scrolled above the viewport (negative top).
    // The one nearest bandTop from below (-40) is the current section.
    const positions = [
      pos("intro", -300, false),
      pos("setup", -40, false),
    ];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("setup");
  });

  it("returns \"\" when every heading is still below the band (the lede)", () => {
    const positions = [
      pos("intro", 200, false),
      pos("setup", 600, false),
    ];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("");
  });

  it("returns \"\" for an empty position set", () => {
    expect(pickActiveHeading([], BAND_TOP)).toBe("");
  });

  it("breaks a tie in the in-band branch to document order", () => {
    // Two intersecting headings at the same top; the earlier in document
    // order (first in the array) must win. p.top < best.top keeps `best`.
    const positions = [
      pos("first", 50, true),
      pos("second", 50, true),
    ];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("first");
  });

  it("breaks a tie in the fallback branch to document order", () => {
    // Two passed headings at the same top; the later in document order (last
    // in the array) must win. p.top >= best.top adopts the later one.
    const positions = [
      pos("first", -20, false),
      pos("second", -20, false),
    ];
    expect(pickActiveHeading(positions, BAND_TOP)).toBe("second");
  });
});
