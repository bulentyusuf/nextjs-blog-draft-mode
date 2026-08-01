import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// The tag pill's edge is the only thing marking it as interactive: its text is
// brand-muted, the same colour as the dates and meta beside it, so with the
// edge invisible a pill is indistinguishable from static text. That makes it a
// user interface component boundary under WCAG 1.4.11 Non-text Contrast and
// puts a 3:1 floor on it — unlike the dividers it used to borrow its colour
// from, which are decorative and exempt.
//
// These values are read out of globals.css rather than restated here, so the
// assertion is about the stylesheet the site actually ships.

const MIN_NON_TEXT_CONTRAST = 3;

const css = fs.readFileSync(
  path.join(__dirname, "..", "app", "globals.css"),
  "utf8",
);

type Rgba = { r: number; g: number; b: number; a: number };

/** `rgb(107 90 82 / 0.7)` or `#faf5f1` -> channels. */
function parseColour(value: string): Rgba {
  const fn =
    /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/.exec(
      value,
    );
  if (fn) {
    return {
      r: Number(fn[1]),
      g: Number(fn[2]),
      b: Number(fn[3]),
      a: fn[4] === undefined ? 1 : Number(fn[4]),
    };
  }
  const hex = /#([0-9a-f]{6})/i.exec(value);
  if (!hex) throw new Error(`unparseable colour: ${value}`);
  const n = parseInt(hex[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
}

/** Last declaration of a custom property before `endIndex` in the stylesheet. */
function tokenBefore(name: string, endIndex: number): Rgba {
  const re = new RegExp(`${name}:\\s*([^;]+);`, "g");
  let last: string | undefined;
  for (const m of css.matchAll(re)) {
    if (m.index !== undefined && m.index < endIndex) last = m[1];
  }
  if (!last) throw new Error(`token not found: ${name}`);
  return parseColour(last.trim());
}

const darkBlockStart = css.indexOf("@media (prefers-color-scheme: dark)");

const lightToken = (name: string) => tokenBefore(name, darkBlockStart);
const darkToken = (name: string) => tokenBefore(name, css.length);

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance({ r, g, b }: Omit<Rgba, "a">): number {
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

/** Composite a translucent foreground over an opaque background. */
function flatten(fg: Rgba, bg: Rgba): Omit<Rgba, "a"> {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
  };
}

function contrast(fg: Rgba, bg: Rgba): number {
  const [hi, lo] = [luminance(flatten(fg, bg)), luminance(bg)].sort(
    (a, b) => b - a,
  );
  return (hi + 0.05) / (lo + 0.05);
}

describe("tag pill edge contrast", () => {
  it("clears 3:1 against the page in light mode", () => {
    const ratio = contrast(
      lightToken("--color-control-edge"),
      lightToken("--color-brand-bg"),
    );
    expect(ratio).toBeGreaterThanOrEqual(MIN_NON_TEXT_CONTRAST);
  });

  it("clears 3:1 against the page in dark mode", () => {
    // The dark override is carried by hand rather than derived, so this is the
    // assertion that catches a retune of brand-muted that forgets to follow.
    const ratio = contrast(
      darkToken("--color-control-edge"),
      darkToken("--color-brand-bg"),
    );
    expect(ratio).toBeGreaterThanOrEqual(MIN_NON_TEXT_CONTRAST);
  });

  it("is a different token from the divider hairline", () => {
    // The whole point of the change. If someone "deduplicates" these back into
    // one token, the pill edge returns to 1.14:1 and this fails.
    expect(lightToken("--color-control-edge")).not.toEqual(
      lightToken("--color-hairline"),
    );
    expect(darkToken("--color-control-edge")).not.toEqual(
      darkToken("--color-hairline"),
    );
  });

  it("confirms the hairline itself would not have cleared the bar", () => {
    // Recorded so the reason for a second token is visible, not folklore.
    expect(
      contrast(lightToken("--color-hairline"), lightToken("--color-brand-bg")),
    ).toBeLessThan(MIN_NON_TEXT_CONTRAST);
    expect(
      contrast(darkToken("--color-hairline"), darkToken("--color-brand-bg")),
    ).toBeLessThan(MIN_NON_TEXT_CONTRAST);
  });

  it("is the token the pill actually uses", () => {
    const pill = fs.readFileSync(
      path.join(__dirname, "..", "app", "tag-pill.tsx"),
      "utf8",
    );
    // Comments stripped first: the note above the className names the token it
    // replaced, and that is documentation, not a class.
    const code = pill.replace(/^\s*\/\/.*$/gm, "");

    expect(code).toContain("border-control-edge");
    expect(code).not.toContain("border-hairline");
  });
});
