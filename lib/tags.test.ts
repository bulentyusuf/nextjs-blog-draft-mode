import { describe, it, expect } from "vitest";
import {
  MIN_POSTS_PER_TAG,
  groupPostsByTag,
  postTags,
  visibleTagSlugs,
} from "./tags";
import type { Tag } from "./types";

const tag = (slug: string, name = slug): Tag => ({ name, slug });

// Only the shape the helpers read. The real ListPost carries a dozen more
// fields none of this touches.
const post = (slug: string, ...tags: Tag[]) => ({
  slug,
  tagsCollection: { items: tags },
});

describe("postTags", () => {
  it("flattens the collection wrapper", () => {
    expect(postTags(post("a", tag("x")))).toEqual([tag("x")]);
  });

  it("returns an empty array when the field is absent", () => {
    // An untagged post comes back with no tagsCollection at all, not an empty
    // one, so the callers must not have to distinguish the two.
    expect(postTags({ tagsCollection: undefined })).toEqual([]);
  });
});

describe("visibleTagSlugs", () => {
  it("hides a tag carried by a single post", () => {
    const visible = visibleTagSlugs([post("a", tag("lonely"))]);
    expect(visible.has("lonely")).toBe(false);
  });

  it("shows a tag once it reaches the threshold", () => {
    const posts = Array.from({ length: MIN_POSTS_PER_TAG }, (_, i) =>
      post(`p${i}`, tag("shared")),
    );
    expect(visibleTagSlugs(posts).has("shared")).toBe(true);
  });

  it("counts each tag independently", () => {
    const visible = visibleTagSlugs([
      post("a", tag("shared"), tag("lonely")),
      post("b", tag("shared")),
    ]);
    expect(visible.has("shared")).toBe(true);
    expect(visible.has("lonely")).toBe(false);
  });
});

describe("groupPostsByTag", () => {
  it("groups posts under each tag and sorts tags A-Z", () => {
    const groups = groupPostsByTag([
      post("a", tag("zebra", "Zebra"), tag("apple", "Apple")),
      post("b", tag("zebra", "Zebra"), tag("apple", "Apple")),
    ]);
    expect(groups.map((g) => g.tag.slug)).toEqual(["apple", "zebra"]);
    expect(groups[0].posts.map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("preserves the order posts arrive in", () => {
    // getAllPosts returns date_DESC and the glossary must not disturb it, so
    // the grouping appends rather than sorting.
    const groups = groupPostsByTag([
      post("newest", tag("t")),
      post("middle", tag("t")),
      post("oldest", tag("t")),
    ]);
    expect(groups[0].posts.map((p) => p.slug)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("omits tags below the threshold entirely", () => {
    const groups = groupPostsByTag([
      post("a", tag("shared"), tag("lonely")),
      post("b", tag("shared")),
    ]);
    expect(groups.map((g) => g.tag.slug)).toEqual(["shared"]);
  });

  it("returns nothing when no tag reaches the threshold", () => {
    expect(groupPostsByTag([post("a", tag("x")), post("b", tag("y"))])).toEqual(
      [],
    );
  });

  it("agrees with visibleTagSlugs, so pills never outlive their anchors", () => {
    // The pills on a post page filter by visibleTagSlugs and link to
    // /tags#slug. If the glossary dropped a tag the pills still rendered, that
    // link would point at an anchor which is not on the page.
    const posts = [
      post("a", tag("shared"), tag("lonely")),
      post("b", tag("shared")),
    ];
    const visible = visibleTagSlugs(posts);
    const grouped = new Set(groupPostsByTag(posts).map((g) => g.tag.slug));
    expect(grouped).toEqual(visible);
  });
});
