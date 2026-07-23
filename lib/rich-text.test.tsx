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

const quote = (value: string) => ({
  nodeType: BLOCKS.QUOTE,
  data: {},
  content: [paragraph(value)],
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

describe("body heading handling", () => {
  it("coalesces a body h1 to h2 and passes h3 through, neither consuming a slug", () => {
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

    // Body h1 coalesces to a bare h2; h3 passes through as h3. Neither gets an id.
    expect(html).toContain("<h2>Stray title</h2>");
    expect(html).toContain("<h3>Stray sub</h3>");
  });
});

describe("widont on subheadings", () => {
  const NBSP = String.fromCharCode(0x00a0);

  it("glues the trailing parenthesised year on a plain-text h2", () => {
    const yearDoc = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [heading2(text("Zak McKracken and the Alien Mindbenders (1988)"))],
    } as unknown as Document;

    const yearContent: Content = {
      json: yearDoc,
      links: { assets: { block: [] } },
    };

    const headings = extractHeadings(yearDoc);
    const html = renderToStaticMarkup(
      <RichText content={yearContent} headings={headings} />,
    );

    // widont binds the year to the single word before it, so the year
    // cannot widow. The permalink's accessible name is a static "Permalink"
    // (asserted below), so it echoes no heading text: the year appears in the
    // output exactly once, in the visible run. Assert it is NBSP-glued there,
    // never plain-space — no markup-adjacency coupling, no tag stripping.
    expect(html).toContain(`${NBSP}(1988)`);
    expect(html).not.toContain(" (1988)");
  });

  it("preserves inline formatting in a heading (no widont flattening)", () => {
    const linkDoc = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [heading2(text("See the "), link("https://example.com", "docs"))],
    } as unknown as Document;

    const linkContent: Content = {
      json: linkDoc,
      links: { assets: { block: [] } },
    };

    const headings = extractHeadings(linkDoc);
    const html = renderToStaticMarkup(
      <RichText content={linkContent} headings={headings} />,
    );

    // The formatted heading must still render its anchor, not a flattened
    // plain string. (The external link also appends a NewWindowHint sr-only
    // span before </a>, so assert the anchor and its visible text, not a
    // bare ">docs</a>".)
    expect(html).toContain("<a");
    expect(html).toContain(">docs");
  });
});

describe("heading permalink anchor", () => {
  const render = (...children: unknown[]) => {
    const permalinkDoc = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [heading2(...children)],
    } as unknown as Document;
    const permalinkContent: Content = {
      json: permalinkDoc,
      links: { assets: { block: [] } },
    };
    const headings = extractHeadings(permalinkDoc);
    return renderToStaticMarkup(
      <RichText content={permalinkContent} headings={headings} />,
    );
  };

  it("renders a permalink anchor pointing at the heading's own slug", () => {
    const html = render(text("Getting set up"));
    // The anchor targets the same fragment the id exposes, so clicking the
    // glyph copies a link that resolves to this very heading.
    expect(html).toContain('id="getting-set-up"');
    expect(html).toContain('href="#getting-set-up"');
  });

  it("gives the anchor a real accessible name and hides the glyph", () => {
    const html = render(text("Getting set up"));
    // A concrete name, not the bare "#" (which announces as "number sign").
    expect(html).toContain('aria-label="Permalink"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("keeps the anchor name out of the heading's accessible name", () => {
    // The anchor sits inside the <h2>, so accessible-name-from-content folds
    // the link's name into the heading. A descriptive per-heading label would
    // double every title; "Permalink" must stay generic. Guard the regression.
    const html = render(text("Zak McKracken and the Alien Mindbenders"));
    expect(html).not.toContain("Permalink to");
  });

  it("stays keyboard-reachable: the anchor reveals on focus, not hover alone", () => {
    // The anchor is focusable at opacity-0; without focus-visible:opacity-100
    // a keyboard user would tab to an invisible target.
    const html = render(text("Getting set up"));
    expect(html).toContain("focus-visible:opacity-100");
  });

  it("emits no permalink for an empty heading (no slug, no anchor)", () => {
    const html = render(text(""));
    expect(html).not.toContain("<a");
    expect(html).toContain("<h2></h2>");
  });
});

describe("blockquote handling", () => {
  it("renders BLOCKS.QUOTE as a semantic blockquote pull quote", () => {
    const quoteDoc = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [quote("The medium is the message.")],
    } as unknown as Document;

    const quoteContent: Content = {
      json: quoteDoc,
      links: { assets: { block: [] } },
    };

    const html = renderToStaticMarkup(
      <RichText content={quoteContent} headings={[]} />,
    );

    expect(html).toContain("<blockquote");
    expect(html).toContain("The medium is the message.");
  });
});
