import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { contrast, schemeTokens } from "./contrast";

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

const { light: lightToken, dark: darkToken } = schemeTokens(css);

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
