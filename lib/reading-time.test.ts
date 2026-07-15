import { describe, it, expect } from "vitest";
import { BLOCKS } from "@contentful/rich-text-types";
import type { Document } from "@contentful/rich-text-types";
import { readingTimeMinutes } from "./reading-time";

// Minimal rich-text node builders, matching the shapes used in
// rich-text.test.tsx.
const text = (value: string) => ({
  nodeType: "text",
  value,
  marks: [],
  data: {},
});

const paragraph = (value: string) => ({
  nodeType: BLOCKS.PARAGRAPH,
  data: {},
  content: [text(value)],
});

const listItem = (value: string) => ({
  nodeType: BLOCKS.LIST_ITEM,
  data: {},
  content: [paragraph(value)],
});

const unorderedList = (...items: unknown[]) => ({
  nodeType: BLOCKS.UL_LIST,
  data: {},
  content: items,
});

const quote = (value: string) => ({
  nodeType: BLOCKS.QUOTE,
  data: {},
  content: [paragraph(value)],
});

const doc = (...content: unknown[]) =>
  ({
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content,
  }) as unknown as Document;

// A run of N whitespace-separated words.
const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

describe("readingTimeMinutes", () => {
  it("returns 1 for an empty document", () => {
    expect(readingTimeMinutes(doc())).toBe(1);
  });

  it("floors at 1 minute for very short content", () => {
    expect(readingTimeMinutes(doc(paragraph("just a few words")))).toBe(1);
  });

  it("returns 2 for ~460 words at 230 wpm", () => {
    expect(readingTimeMinutes(doc(paragraph(words(460))))).toBe(2);
  });

  it("counts text inside nested blocks (lists and quotes)", () => {
    // 230 words in a paragraph + 230 split across a list and a quote = 460,
    // which only reaches 2 minutes if the nested blocks are walked.
    const document = doc(
      paragraph(words(230)),
      unorderedList(listItem(words(115)), listItem(words(57))),
      quote(words(58)),
    );
    expect(readingTimeMinutes(document)).toBe(2);
  });
});
