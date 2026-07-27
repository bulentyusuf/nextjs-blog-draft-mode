import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
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
    const ids = [...html.matchAll(/<h2\b[^>]*\bid="([^"]+)"/g)].map(
      (m) => m[1],
    );

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
    const ids = [...html.matchAll(/<h2\b[^>]*\bid="([^"]+)"/g)].map(
      (m) => m[1],
    );
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
      content: [
        heading2(text("Zak McKracken and the Alien Mindbenders (1988)")),
      ],
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
      content: [
        heading2(text("See the "), link("https://example.com", "docs")),
      ],
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

describe("hyperlink classification", () => {
  const render = (uri: string, label = "link") => {
    const json = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        { nodeType: BLOCKS.PARAGRAPH, data: {}, content: [link(uri, label)] },
      ],
    } as unknown as Document;
    return renderToStaticMarkup(
      <RichText
        content={{ json, links: { assets: { block: [] } } }}
        headings={[]}
      />,
    );
  };

  it("renders a root-relative URI as a plain internal anchor", () => {
    const html = render("/privacy", "privacy page");
    expect(html).toContain('href="/privacy"');
    expect(html).not.toContain("_blank");
  });

  it("keeps the fragment on a root-relative URI", () => {
    expect(render("/posts/x#y")).toContain('href="/posts/x#y"');
  });

  it("renders mailto without new-window treatment", () => {
    const html = render("mailto:hello@example.com", "email me");
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html).not.toContain("_blank");
    expect(html).not.toContain("opens in a new window");
  });

  it("still marks a cross-origin link as opening a new window", () => {
    const html = render("https://example.com/x", "elsewhere");
    expect(html).toContain('target="_blank"');
    expect(html).toContain("opens in a new window");
  });

  it("strips a protocol-relative URI", () => {
    const html = render("//example.com/x", "elsewhere");
    expect(html).not.toContain("<a");
    expect(html).toContain("elsewhere");
  });

  it("strips the backslash protocol-relative variant", () => {
    expect(render("/\\example.com")).not.toContain("<a");
  });

  it("strips a javascript: URI", () => {
    const html = render("javascript:alert(1)", "click me");
    expect(html).not.toContain("<a");
    expect(html).toContain("click me");
  });
});

describe("inline sidenote embed", () => {
  // An inline embedded-entry reference node, as it appears inside a paragraph.
  const inlineRef = (id: string) => ({
    nodeType: INLINES.EMBEDDED_ENTRY,
    data: { target: { sys: { id, type: "Link", linkType: "Entry" } } },
    content: [],
  });

  const noteContent = (value: string): Content => ({
    json: {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [paragraph(value)],
    } as unknown as Document,
    links: { assets: { block: [] } },
  });

  // A note body whose paragraph contains a hyperlink, for the link-handling
  // cases below.
  const noteWithLink = (uri: string, label = "link"): Content => ({
    json: {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [text("see "), link(uri, label)],
        },
      ],
    } as unknown as Document,
    links: { assets: { block: [] } },
  });

  const renderNote = (note: Content) =>
    render("sn1", [{ __typename: "Sidenote", sys: { id: "sn1" }, note }]);

  const render = (id: string, inline: unknown[]) => {
    const json = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [text("See "), inlineRef(id)],
        },
      ],
    } as unknown as Document;
    const content: Content = {
      json,
      links: {
        assets: { block: [] },
        entries: { block: [], inline: inline as never },
      },
    };
    return renderToStaticMarkup(<RichText content={content} headings={[]} />);
  };

  it("renders the numbered reference marker and the note body", () => {
    const html = render("sn1", [
      {
        __typename: "Sidenote",
        sys: { id: "sn1" },
        note: noteContent("An aside worth reading."),
      },
    ]);

    // A superscript marker carrying the document-order number, and the note text.
    expect(html).toMatch(/<sup[^>]*>1<\/sup>/);
    expect(html).toContain("An aside worth reading.");
    expect(html).toContain("sidenote-body");
  });

  it("numbers multiple notes in document order", () => {
    const json = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [text("A "), inlineRef("sn1")],
        },
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [text("B "), inlineRef("sn2")],
        },
      ],
    } as unknown as Document;
    const content: Content = {
      json,
      links: {
        assets: { block: [] },
        entries: {
          block: [],
          inline: [
            {
              __typename: "Sidenote",
              sys: { id: "sn1" },
              note: noteContent("first"),
            },
            {
              __typename: "Sidenote",
              sys: { id: "sn2" },
              note: noteContent("second"),
            },
          ] as never,
        },
      },
    };
    const html = renderToStaticMarkup(
      <RichText content={content} headings={[]} />,
    );

    // The second note's label text carries 2, proving the index advances.
    expect(html).toContain("Note 1");
    expect(html).toContain("Note 2");
    // Ids are derived from that index, so they must not collide either.
    expect(html).toContain('id="sidenote-1"');
    expect(html).toContain('id="sidenote-2"');
  });

  it("emits no element that would close the surrounding paragraph", () => {
    // <details>/<summary> implicitly terminate an open <p> at parse time, which
    // split the sentence in two and desynced React's tree from the DOM. The
    // sidenote must stay phrasing content, so neither tag may ever reappear.
    const html = render("sn1", [
      {
        __typename: "Sidenote",
        sys: { id: "sn1" },
        note: noteContent("An aside."),
      },
    ]);

    expect(html).not.toContain("<details");
    expect(html).not.toContain("<summary");

    // The note's own rich-text paragraphs are the same hazard: a nested <p>
    // closes the outer one just as <details> did, so they render as spans.
    expect(html).toContain("sidenote-para");
    expect(html.match(/<p[ >]/g)).toHaveLength(1);
  });

  it("emits exactly one marker element per role, one of them in the label", () => {
    // Two <sup>s carry the number: the in-text reference and the toggle's own.
    // Which of the pair is visible is a media query, so jsdom cannot say — the
    // count is the assertion, and it catches a third marker creeping in.
    const html = render("sn1", [
      {
        __typename: "Sidenote",
        sys: { id: "sn1" },
        note: noteContent("An aside."),
      },
    ]);

    expect(html.match(/<sup[^>]*>1<\/sup>/g)).toHaveLength(2);
    expect(html).toMatch(/<label[^>]*>.*?<sup[^>]*>1<\/sup>/);
  });

  it("opens the note with no JavaScript", () => {
    // The toggle is a checkbox driving :checked in CSS, not React state, so a
    // note is readable with scripts off and before hydration. A <button> here
    // means that regressed — the markup is the only thing holding it.
    const html = render("sn1", [
      {
        __typename: "Sidenote",
        sys: { id: "sn1" },
        note: noteContent("An aside."),
      },
    ]);

    expect(html).not.toContain("<button");
    expect(html).toContain('type="checkbox"');

    // The label must point at the checkbox, or clicking the marker does nothing.
    const toggleId = html.match(/<input[^>]*id="([^"]+)"/)?.[1];
    expect(toggleId).toBeTruthy();
    expect(html).toContain(`for="${toggleId}"`);
  });

  it("wires the toggle to the note body and names it", () => {
    const html = render("sn1", [
      {
        __typename: "Sidenote",
        sys: { id: "sn1" },
        note: noteContent("An aside."),
      },
    ]);

    // aria-controls must name the note body's own id, not just any id.
    const input = html.match(/<input[^>]*>/)?.[0] ?? "";
    const controls = input.match(/aria-controls="([^"]+)"/)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toMatch(
      new RegExp(`<span[^>]*id="${controls}"[^>]*class="sidenote-body[^"]*"`),
    );

    // The <sup> is decorative, so the label's accessible name comes from the
    // visually hidden text. Without it the control announces as bare "1".
    expect(html).toMatch(/<label[^>]*>\s*<span class="sr-only">Note 1<\/span>/);
  });

  // A note body renders through the same hyperlink renderer as the post body,
  // so these mirror the "hyperlink classification" cases above. Without it the
  // default renderer emitted data.uri as-is and a note was a way round the
  // allowlisting the body enforces.
  it("strips a javascript: URI inside a note body", () => {
    const html = renderNote(noteWithLink("javascript:alert(1)", "click me"));

    expect(html).not.toContain("<a");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("click me");
  });

  it("strips a protocol-relative URI inside a note body", () => {
    const html = renderNote(noteWithLink("//evil.example/x", "elsewhere"));

    expect(html).not.toContain("<a");
    expect(html).toContain("elsewhere");
  });

  it("gives an external link in a note the same new-window treatment", () => {
    const html = renderNote(noteWithLink("https://example.com/x", "elsewhere"));

    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("opens in a new window");
  });

  it("keeps an internal link in a note as a plain anchor", () => {
    const html = renderNote(noteWithLink("/privacy", "privacy"));

    expect(html).toContain('href="/privacy"');
    expect(html).not.toContain("_blank");
    expect(html).not.toContain("opens in a new window");
  });

  it("renders nothing (without throwing) for an unresolved entry id", () => {
    // No matching inline entry: a draft or deleted reference must not crash.
    expect(() => render("missing", [])).not.toThrow();
    const html = render("missing", []);
    expect(html).not.toContain("sidenote-body");
  });
});

describe("embedded asset descriptions", () => {
  // The description is both the alt text and the visible caption, so an asset
  // without one renders as decorative with no caption at all. Empty alt is the
  // correct render; the warning is what stops that happening unnoticed.
  const assetDoc = {
    nodeType: "document",
    data: {},
    content: [
      {
        nodeType: "embedded-asset-block",
        data: { target: { sys: { id: "asset-1" } } },
        content: [],
      },
    ],
  } as unknown as Document;

  const withDescription = (description?: string): Content =>
    ({
      json: assetDoc,
      links: {
        assets: {
          block: [
            {
              sys: { id: "asset-1" },
              url: "https://images.ctfassets.net/a.jpg",
              description,
            },
          ],
        },
      },
    }) as unknown as Content;

  it("warns and renders empty alt when the description is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <RichText content={withDescription()} headings={[]} />,
    );

    expect(html).toContain('alt=""');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/asset-1/);
    warn.mockRestore();
  });

  it("stays quiet and uses the description as alt when present", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <RichText
        content={withDescription("A tabby asleep on a keyboard")}
        headings={[]}
      />,
    );

    expect(html).toContain('alt="A tabby asleep on a keyboard"');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
