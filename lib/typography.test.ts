import { describe, it, expect } from "vitest";
import { widont } from "./typography";

// widont's job is to stop a heading ending on a lone word. Its failure mode is
// the opposite one and it is worse: glue too much and the string cannot wrap at
// all, so it overflows its column instead of merely wrapping badly.
//
// rich-text.test.tsx covers the rendered path, a heading with a trailing
// parenthesised year, through documentToReactComponents. This covers the
// function itself, where the token-count boundary lives.

const NBSP = String.fromCharCode(0x00a0);

describe("widont leaves anything below three words alone", () => {
  it("returns a two-word string byte-identical", () => {
    // The whole bug. With two tokens the final two are the entire string, so
    // the old behaviour returned one unbreakable run.
    expect(widont("Retro Gaming")).toBe("Retro Gaming");
  });

  it("puts no non-breaking space in a two-word string", () => {
    // Stated separately from the equality above, because a byte comparison
    // reads as a formatting detail and this is the property that matters: the
    // string keeps a breakable space.
    expect(widont("Retro Gaming")).not.toContain(NBSP);
  });

  it("leaves Information Architecture breakable", () => {
    // The reported regression, kept by name. It overflowed a lg:text-6xl
    // heading at 120% zoom on a narrow viewport, where the glued run was about
    // 690px against a column that could not hold it.
    const glued = widont("Information Architecture");
    expect(glued).toBe("Information Architecture");
    expect(glued).not.toContain(NBSP);
  });

  it("leaves a single word alone, which was always documented", () => {
    expect(widont("Retro")).toBe("Retro");
    expect(widont("Retro")).not.toContain(NBSP);
  });

  it("leaves an empty string alone", () => {
    expect(widont("")).toBe("");
  });

  it("counts tokens on the trimmed string", () => {
    // Surrounding whitespace must not make a two-word string look like three
    // and reintroduce the glue.
    expect(widont("  Retro Gaming  ")).not.toContain(NBSP);
  });
});

describe("widont still glues from three words up", () => {
  it("binds the last two words of a three-word string", () => {
    // Non-vacuous in the other direction: the guard above is only correct if
    // it did not switch the feature off.
    expect(widont("A Very Long")).toBe(`A Very${NBSP}Long`);
  });

  it("binds a trailing parenthesised year when there is a line to widow onto", () => {
    expect(widont("Zak McKracken and the Alien Mindbenders (1988)")).toBe(
      `Zak McKracken and the Alien Mindbenders${NBSP}(1988)`,
    );
  });
});
