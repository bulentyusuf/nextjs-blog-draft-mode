import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  contrast,
  parseColour,
  sameColour,
  schemeTokens,
  type Rgba,
} from "./contrast";

// Two gaps this closes.
//
// One: nothing tested the accent's contrast. tag-pill.test.ts covers the control
// edge only, and app/a11y.test.tsx disables axe's color-contrast rule because
// jsdom computes no boxes and would report a false pass. So the crimson token
// could drift back below AAA with every check green.
//
// Two: three literal hexes exist because they CANNOT read the tokens — Satori has
// no custom properties, and the search emblem's ground stays cream in both
// schemes. Those are deliberate, and nothing held them to the values they
// duplicate. The OG card is the one that would go unnoticed longest: it renders
// in its own request, into a PNG, that nobody looks at day to day.
//
// The bar is WCAG AAA 1.4.6, not AA. These pairings are all normal-size text and
// they clear 7:1 today, so the guard records that rather than the lower floor
// they already passed.

const MIN_AAA_TEXT = 7;

const ROOT = path.join(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

const { light, dark } = schemeTokens(read("app/globals.css"));

describe("brand accent clears AAA in both schemes", () => {
  it("light", () => {
    expect(
      contrast(light("--color-brand-crimson"), light("--color-brand-bg")),
    ).toBeGreaterThanOrEqual(MIN_AAA_TEXT);
  });

  it("dark", () => {
    // The dark value is a hand-carried lift, not derived from the light one, so
    // this is the assertion that catches a retune of one that forgets the other.
    expect(
      contrast(dark("--color-brand-crimson"), dark("--color-brand-bg")),
    ).toBeGreaterThanOrEqual(MIN_AAA_TEXT);
  });
});

describe("footer small print clears AAA in both schemes", () => {
  // Derived from the source rather than hardcoded, so this covers any footer
  // text added later without being edited. Scoped to `text-white/` on purpose:
  // the bottom bar's border-white/10 is a divider, decorative and exempt.
  const layout = read("app/layout.tsx");
  const alphas = [...layout.matchAll(/text-white\/(\d+)/g)].map((m) =>
    Number(m[1]),
  );

  it("finds the utilities it is asserting against", () => {
    // A rename or a refactor that drops the class would otherwise make the two
    // tests below pass vacuously over an empty list.
    expect(alphas.length).toBeGreaterThan(0);
  });

  const faintest = (): Rgba => ({
    r: 255,
    g: 255,
    b: 255,
    a: Math.min(...alphas) / 100,
  });

  it("light", () => {
    expect(
      contrast(faintest(), light("--color-footer-bg")),
    ).toBeGreaterThanOrEqual(MIN_AAA_TEXT);
  });

  it("dark", () => {
    expect(
      contrast(faintest(), dark("--color-footer-bg")),
    ).toBeGreaterThanOrEqual(MIN_AAA_TEXT);
  });
});

describe("literal hexes track the tokens they duplicate", () => {
  // Channel comparison, not string: globals.css writes tokens lowercase and the
  // TSX literals are uppercase, so === on the text fails for the wrong reason.
  const named = (source: string, constant: string): Rgba => {
    const m = new RegExp(`${constant}\\s*=\\s*"(#[0-9a-f]{6})"`, "i").exec(
      source,
    );
    if (!m) throw new Error(`literal not found: ${constant}`);
    return parseColour(m[1]);
  };

  const og = read("app/posts/[slug]/opengraph-image.tsx");

  it.each([
    ["BRAND_BG", "--color-brand-bg"],
    ["BRAND_INK", "--color-brand-dark"],
    ["BRAND_CRIMSON", "--color-brand-crimson"],
  ])("OG card's %s equals %s", (constant, token) => {
    expect(sameColour(named(og, constant), light(token))).toBe(true);
  });

  it("the search emblem's dark-mode figure equals the LIGHT crimson", () => {
    // Deliberately the light value. The emblem's ground is a fixed cream island
    // in both schemes, so the lifted dark-mode crimson washes out on it. If this
    // ever matches the dark token instead, the fix went in backwards.
    const page = read("app/search/page.tsx");
    const m = /dark:text-\[(#[0-9a-f]{6})\]/i.exec(page);
    expect(m).not.toBeNull();
    expect(sameColour(parseColour(m![1]), light("--color-brand-crimson"))).toBe(
      true,
    );
  });
});
