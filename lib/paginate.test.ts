import { describe, expect, it } from "vitest";
import { POSTS_PER_PAGE } from "./constants";
import {
  pageItems,
  pageRangeParams,
  parsePageParam,
  totalPagesFor,
} from "./paginate";

const items = (n: number) => Array.from({ length: n }, (_, i) => i);

describe("parsePageParam", () => {
  it("accepts a page number", () => {
    expect(parsePageParam("2")).toBe(2);
    expect(parsePageParam("17")).toBe(17);
  });

  // The four paginated routes 404 on each of these. Before this helper their
  // generateMetadata did not look, and built a title and a canonical out of the
  // raw segment for a URL that was about to not exist.
  it("rejects what the routes 404 on", () => {
    for (const segment of ["abc", "", "0", "-1", "1.5", "NaN", "Infinity"]) {
      expect(parsePageParam(segment)).toBeNull();
    }
  });
});

describe("totalPagesFor", () => {
  it("gives an empty listing one page to render its empty state on", () => {
    expect(totalPagesFor(0)).toBe(1);
  });

  it("does not open a second page for an exactly-full first one", () => {
    expect(totalPagesFor(POSTS_PER_PAGE)).toBe(1);
    expect(totalPagesFor(POSTS_PER_PAGE + 1)).toBe(2);
  });
});

describe("pageItems", () => {
  it("slices page 1 from the start", () => {
    expect(pageItems(items(12), 1)).toEqual(items(POSTS_PER_PAGE));
  });

  it("returns nothing past the last page rather than wrapping", () => {
    expect(pageItems(items(3), 2)).toEqual([]);
  });

  // The invariant the six duplicated copies of this arithmetic each had to get
  // right on their own: every item appears on exactly one page, in order, with
  // no gap at a page boundary and nothing repeated across one.
  it("covers every item exactly once across its pages", () => {
    for (const count of [0, 1, POSTS_PER_PAGE, POSTS_PER_PAGE + 1, 23]) {
      const all = items(count);
      const seen = Array.from({ length: totalPagesFor(count) }, (_, i) =>
        pageItems(all, i + 1),
      ).flat();
      expect(seen).toEqual(all);
    }
  });
});

describe("pageRangeParams", () => {
  it("emits nothing when everything fits on page 1", () => {
    expect(pageRangeParams(POSTS_PER_PAGE, (page) => ({ page }))).toEqual([]);
    expect(pageRangeParams(0, (page) => ({ page }))).toEqual([]);
  });

  // Page 1 lives at the unpaginated route, which the paginated one redirects
  // to, so generating it would pre-render a permanent redirect.
  it("starts at page 2 and emits string page numbers", () => {
    expect(pageRangeParams(POSTS_PER_PAGE * 3, (page) => ({ page }))).toEqual([
      { page: "2" },
      { page: "3" },
    ]);
  });

  it("passes the page through to the caller's shape", () => {
    expect(
      pageRangeParams(POSTS_PER_PAGE + 1, (page) => ({ slug: "x", page })),
    ).toEqual([{ slug: "x", page: "2" }]);
  });
});
