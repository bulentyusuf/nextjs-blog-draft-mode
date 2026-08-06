import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// The band-to-list rhythm, which has broken twice and is invisible to every
// other suite: jsdom applies no stylesheet, so nothing here can be caught by
// rendering. Both halves are asserted as source text instead.
//
// The rule: whatever sits above a list item — a hairline between items, or the
// bottom edge of the masthead band — belongs the same distance from the cover
// below it. That distance is the item's own top padding. So exactly one of the
// two may contribute space, never both and never neither.

const ROOT = path.join(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("a banded listing keeps its item padding", () => {
  const moreStories = read("app/more-stories.tsx");

  it("never zeroes the first item's top padding", () => {
    // The regression: dropping this made the first post hug the band while
    // every post after it kept a full item's padding under its hairline.
    expect(moreStories).not.toMatch(/first-child\]:pt-0/);
  });

  it("still sets a symmetric item padding to be the rhythm", () => {
    // Non-vacuous: the check above passes trivially if the padding is gone.
    expect(moreStories).toMatch(/py-10[^"]*md:py-12/);
  });

  it("drops only the rule when openRule is false", () => {
    const ternary = /openRule \? "border-y" : "([^"]*)"/.exec(moreStories);
    expect(ternary).not.toBeNull();
    expect(ternary![1].trim()).toBe("border-b");
  });
});

describe("the page under a band contributes no leading of its own", () => {
  it("the taxonomy listing declares contentOwnsLeading", () => {
    // The other half. With both the gap and the item padding, band-to-post
    // disagreed with post-to-post in the other direction.
    expect(read("app/taxonomy-listing.tsx")).toMatch(/contentOwnsLeading/);
  });

  it("BrowsePage maps that to no top padding", () => {
    expect(read("app/browse-page.tsx")).toMatch(
      /contentOwnsLeading \? "none" : "tight"/,
    );
  });
});
