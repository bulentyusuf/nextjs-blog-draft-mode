import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BLOCKS } from "@contentful/rich-text-types";
import type { Document } from "@contentful/rich-text-types";
import { extractHeadings } from "./headings";
import { RichText } from "./rich-text";
import type { Content } from "./types";

// Minimal rich-text node builders.
const text = (value: string) => ({
  nodeType: "text",
  value,
  marks: [],
  data: {},
});

const heading2 = (...children: unknown[]) => ({
  nodeType: BLOCKS.HEADING_2,
  data: {},
  content: children,
});

const heading = (nodeType: string, ...children: unknown[]) => ({
  nodeType,
  data: {},
  content: children,
});

const paragraph = (value: string) => ({
  nodeType: BLOCKS.PARAGRAPH,
  data: {},
  content: [text(value)],
});

const link = (uri: string, value: string) => ({
  nodeType: "hyperlink",
  data: { uri },
  content: [text(value)],
});

const doc = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    heading2(text("Getting set up")),
    paragraph("Some body copy."),
    heading2(text("Notes")),
    heading2(text("Notes")), // collision -> notes-1
    heading2(text("See the "), link("https://example.com", "docs")),
    heading2(text("")), // empty -> skipped on both sides
    heading2(text("Wrapping up")),
  ],
} as unknown as Document;

const content: Content = {
  json: doc,
  links: { assets: { block: [] } },
};

describe("TOC slug sync", () => {
  it("renderer h2 ids match extractHeadings slugs, in order", () => {
    const headings = extractHeadings(doc);
    const html = renderToStaticMarkup(
      <RichText content={content} headings={headings} />,
    );
    const ids = [...html.matchAll(/<h2\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);

    // The two independent paths must agree exactly.
    expect(ids).toEqual(headings.map((h) => h.slug));

    // Sanity-check the edges so a future refactor that quietly changes the
    // slug rules is caught here, not by a reader clicking a dead link.
    expect(headings.map((h) => h.slug)).toEqual([
      "getting-set-up",
      "notes",
      "notes-1",
      "see-the-docs",
      "wrapping-up",
    ]);
  });
});

describe("stray heading coalescing", () => {
  it("renders H1 and H3 to H6 as bare h2 with no id and no slug consumed", () => {
    const strayDoc = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        heading(BLOCKS.HEADING_1, text("Stray title")),
        heading(BLOCKS.HEADING_3, text("Stray sub")),
        heading2(text("Real heading")),
      ],
    } as unknown as Document;

    const strayContent: Content = {
      json: strayDoc,
      links: { assets: { block: [] } },
    };

    const headings = extractHeadings(strayDoc);
    const html = renderToStaticMarkup(
      <RichText content={strayContent} headings={headings} />,
    );

    // Only the real H2 carries an id, and it is the first (and only) slug.
    const ids = [...html.matchAll(/<h2\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(["real-heading"]);
    expect(headings.map((h) => h.slug)).toEqual(["real-heading"]);

    // Every stray heading renders as an h2, none with an id of its own.
    expect(html).toContain("<h2>Stray title</h2>");
    expect(html).toContain("<h2>Stray sub</h2>");
  });
});
