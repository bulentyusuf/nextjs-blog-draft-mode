import LightboxImage from "./lightbox-image";
import Sidenote from "./sidenote";
import { renderHyperlink } from "./rich-text-link";
import CopyButton from "./copy-button";
import ContentfulImage from "./contentful-image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import type { Block, Inline } from "@contentful/rich-text-types";
import type { ReactNode } from "react";
import type { Asset, Content } from "./types";
import type { Heading } from "./headings";
import { widont } from "./typography";

function headingText(node: Block | Inline): string {
  if (!node?.content) return "";
  return node.content
    .map((child) =>
      child.nodeType === "text"
        ? child.value
        : headingText(child as Block | Inline),
    )
    .join("");
}

function RichTextAsset({
  id,
  assets,
  lightbox,
  priority,
}: {
  id: string;
  assets: Asset[] | undefined;
  lightbox: boolean;
  priority?: boolean;
}) {
  const asset = assets?.find((asset) => asset.sys.id === id);

  if (!asset?.url) return null;

  // The description is the caption, and only the caption — see the alt note
  // below. So a missing one does not degrade the image's description, it
  // removes it: no caption renders, and with alt empty by design the figure
  // reaches the reader entirely unlabelled. A filename or a guessed
  // description would be worse, and nothing in the CMS flags the gap, so warn
  // instead — it surfaces in the build log while the asset can still be
  // traced.
  if (!asset.description) {
    console.warn(
      `[rich-text] Embedded asset ${asset.sys.id} has no description, so it renders with empty alt text and no caption.`,
    );
  }

  return (
    // not-prose so the typography plugin does not inject its own margins into
    // the image (2em) and caption — those would dominate the image-to-caption
    // gap and make mt-1.5 invisible. Spacing is owned here: my-8 around the
    // figure, mt-1.5 under the caption. Matches the code/prompt blocks.
    <figure className="not-prose my-8">
      {lightbox ? (
        <LightboxImage
          src={asset.url}
          alt={asset.description || ""}
          caption={asset.description}
          width={asset.width}
          height={asset.height}
        />
      ) : (
        <ContentfulImage
          src={asset.url}
          // Always empty, and not a bug. The description is the caption
          // rendered directly below, so repeating it here made every figure
          // announce the same sentence twice in a row. With a visible caption
          // adjacent in the DOM the image is already described, which is the
          // case W3C's own guidance makes for an empty alt. When there is no
          // description there is no caption either, and empty was already the
          // documented render (the build warning above still fires).
          alt=""
          // The asset's real shape, with 3:2 as the fallback for an asset that
          // carries no dimensions — see the same pair in lightbox-image.tsx.
          // w-full h-auto means the bitmap wins once loaded either way, so a
          // wrong ratio here is a layout shift rather than a wrong render.
          width={asset.width ?? 1200}
          height={asset.height ?? 800}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 672px"
          className="w-full h-auto border-2 border-gray-300 dark:border-brand-dark/15"
        />
      )}
      {asset.description && (
        // italic: the caption shares its size and muted colour with a sidenote
        // body, so slant is what tells the two apart when a note sits level
        // with a figure. Deliberately not applied to the sidenote instead — a
        // note's own italic emphasis would then have nothing to flip to.
        // The size is em, matching .sidenote-body in globals.css, so the pair
        // keeps its ratio to the prose body when that size moves.
        <figcaption className="text-[0.875em] italic text-brand-muted mt-1.5 text-center">
          {asset.description}
        </figcaption>
      )}
    </figure>
  );
}

export function RichText({
  content,
  headings,
  highlighted,
  lightbox = true,
  prioritizeFirstImage = false,
}: {
  content: Content;
  headings: Heading[];
  highlighted?: Map<string, string>;
  lightbox?: boolean;
  prioritizeFirstImage?: boolean;
}) {
  // Single source of truth for heading ids. `headings` comes from
  // extractHeadings() on the page. documentToReactComponents walks in document
  // order, so advancing one index per non-empty H2 pairs each heading with its
  // precomputed slug. The empty-heading skip below mirrors extractHeadings()
  // exactly. rich-text.test.tsx asserts the two never drift.
  let headingIndex = 0;
  // Pages prioritise their first embedded image (the lead image is the LCP).
  // Posts leave this false: the LCP is the cover, body images stay lazy.
  let assetIndex = 0;
  // Document-order number for inline sidenotes, feeding each note's aria-label
  // and its in-text marker. The floated note's own "N." prefix comes from a CSS
  // counter (globals.css); both count once per note in order, so they agree.
  let sidenoteIndex = 1;

  // The post title is the page's only h1, so a stray h1 in body content would
  // duplicate it. Coalesce body h1 to h2. H3 to H6 are intentional sub-structure
  // in long-form posts and pass through to the renderer defaults (prose styles
  // them), so they keep their real levels. They carry no id and are not in the
  // ToC, which stays H2-only by design.
  const coalesceToH2 = (_node: Block | Inline, children: ReactNode) => (
    <h2>{children}</h2>
  );

  return documentToReactComponents(content.json, {
    renderNode: {
      [BLOCKS.HEADING_2]: (node: Block | Inline, children: ReactNode) => {
        const text = headingText(node).trim();
        if (!text) return <h2>{children}</h2>;
        const slug = headings[headingIndex++]?.slug;
        // Apply widont only when the heading is a single plain-text run, so a
        // trailing token (e.g. a parenthesised year) can't widow. Headings that
        // carry inline marks (links, italics) keep their original children so
        // the formatting survives — widont() takes a plain string and would
        // otherwise flatten them.
        const isPlainRun =
          node.content?.length === 1 && node.content[0]?.nodeType === "text";
        return (
          // No scroll-mt here. The offset that parks a fragment-linked
          // heading below the sticky header is `scroll-padding-top` on <html>
          // (globals.css), which covers keyboard focus too. The two are
          // additive, so a scroll-margin here would push the landing point
          // past the line app/table-of-contents.tsx activates on.
          <h2 id={slug} className="group/heading">
            {isPlainRun ? widont(text) : children}
            {slug ? (
              <a
                href={`#${slug}`}
                // The visible glyph is decorative, so it is hidden from the
                // accessibility tree and the link carries a real name instead.
                // Without this every permalink announces as "number sign".
                // The name is deliberately just "Permalink", not "Permalink to
                // <heading>": the anchor sits inside the <h2>, so accessible-
                // name-from-content folds this label into the heading's own
                // name. A descriptive label would make every heading announce
                // its title twice. Per-section descriptive links live in the
                // ToC, which is where AT users reach for them anyway.
                aria-label="Permalink"
                // The negative right margin cancels the anchor's own advance,
                // so it consumes no width when the line is measured and can
                // never be pushed onto a line of its own. Without it the marker
                // wraps whenever a heading's last line is nearly full, and
                // because it is opacity-0 rather than hidden that line still
                // takes its height — an empty band under the heading, on a
                // heading that looks like it had room to spare. Measured in
                // Chromium across 201 column widths: 15 of them orphaned the
                // marker before, none after.
                //
                // Deliberately not zero-width, which fixes the wrap equally
                // well and collapses the focus ring to a 2px bar beside the
                // glyph instead of tracing it. The cost is that the marker can
                // overhang the measure by up to about 22px when the last line
                // is completely full, which is inside the gutter it sits in.
                className="ml-2 -mr-[1em] inline-block align-middle text-brand-muted no-underline opacity-0 transition-opacity duration-200 group-hover/heading:opacity-100 focus-visible:opacity-100 hover:text-brand-crimson"
              >
                <span aria-hidden="true">#</span>
              </a>
            ) : null}
          </h2>
        );
      },
      [BLOCKS.HEADING_1]: coalesceToH2,
      [BLOCKS.QUOTE]: (_node: Block | Inline, children: ReactNode) => (
        // Pull quote: crimson rule, display face. not-prose so the typography
        // plugin's blockquote styling doesn't fight ours; inner paragraphs are
        // de-margined ([&_p]:m-0) with a gap only between multiple paragraphs.
        <blockquote className="not-prose my-9 border-l-4 border-brand-crimson pl-5 font-display text-2xl font-normal leading-snug text-brand-dark md:text-[1.75rem] [&_p]:m-0 [&_p+p]:mt-4">
          {children}
        </blockquote>
      ),
      [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => (
        <RichTextAsset
          id={(node as Block).data.target.sys.id}
          assets={content.links.assets.block}
          lightbox={lightbox}
          priority={prioritizeFirstImage && assetIndex++ === 0}
        />
      ),
      [BLOCKS.EMBEDDED_ENTRY]: (node: Block | Inline) => {
        const id = (node as Block).data.target.sys.id;
        const entry = content.links.entries?.block?.find(
          (e) => e.sys.id === id,
        );
        if (!entry) return null;

        if (entry.__typename === "CodeBlock") {
          const html = highlighted?.get(id);

          return (
            <div className="not-prose relative my-8 overflow-hidden rounded-lg border border-hairline">
              {entry.filename ? (
                <div className="flex items-center justify-between border-b border-hairline bg-gray-50 px-4 py-2 font-mono text-[0.67em] text-brand-muted dark:bg-white/5">
                  <span>{entry.filename}</span>
                  <CopyButton code={entry.code} />
                </div>
              ) : (
                <div className="absolute right-2 top-2">
                  <CopyButton code={entry.code} />
                </div>
              )}
              {html ? (
                <div
                  tabIndex={0}
                  role="region"
                  aria-label={entry.filename || "Code block"}
                  className="overflow-x-auto text-[0.78em] [&_pre]:m-0 [&_pre]:p-4 [&_pre]:w-max [&_pre]:min-w-full focus-visible:outline-offset-[-2px]"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <pre
                  tabIndex={0}
                  role="region"
                  aria-label={entry.filename || "Code block"}
                  className="overflow-x-auto p-4 text-[0.78em] focus-visible:outline-offset-[-2px]"
                >
                  <code>{entry.code}</code>
                </pre>
              )}
            </div>
          );
        }

        if (entry.__typename === "PromptBlock") {
          return (
            <figure className="not-prose my-8 overflow-hidden rounded-lg border border-hairline">
              {/* figcaption as figure's first child names the whole block
                  natively — no role or aria-labelledby needed. In dark mode
                  brand-crimson lifts (for link legibility); white text on the
                  lifted hue fails AA at 2.53:1, so the header ink goes dark
                  (6.64:1). The label is not mono: at this size a fixed-advance
                  face draws stems thin enough that measured contrast stops
                  predicting legibility, and the label is a caption rather than a
                  verbatim string. It also sits at the body's size rather than
                  below it — a label smaller than the content it names had
                  nothing to justify it. */}
              <figcaption className="flex items-center justify-between bg-brand-crimson px-4 py-2 text-[0.78em] font-semibold text-white dark:text-surface-dark">
                <span className="min-w-0 flex-1">
                  {entry.label || "Prompt"}
                </span>
                <CopyButton code={entry.prompt} label="prompt" variant="dark" />
              </figcaption>
              <div className="flow-root whitespace-pre-wrap break-words bg-gray-50 p-4 font-mono text-[0.78em] text-gray-800 dark:bg-white/5 dark:text-brand-dark">
                {entry.image?.url && (
                  /* Decorative thumbnail: floats only from sm up, so text
                     wraps around it rather than sitting in a fixed column for
                     the whole prompt. Hidden below sm, where a fixed 78px
                     column would leave too narrow a strip beside it to read
                     (WCAG 1.4.10); the image carries no information, so
                     hiding it there costs nothing. */
                  <span
                    aria-hidden="true"
                    className="relative mb-1 mr-3 hidden h-[52px] w-[78px] overflow-hidden rounded-md shadow-md ring-1 ring-black/10 sm:float-left sm:block"
                  >
                    <ContentfulImage
                      src={entry.image.url}
                      alt=""
                      fill
                      sizes="78px"
                      className="object-cover"
                    />
                  </span>
                )}
                <code>{entry.prompt}</code>
              </div>
            </figure>
          );
        }

        return null;
      },
      [INLINES.EMBEDDED_ENTRY]: (node: Block | Inline) => {
        const id = (node as Inline).data.target.sys.id;
        const entry = content.links.entries?.inline?.find(
          (e) => e.sys.id === id,
        );
        // Same defensive shape as the block case: an unresolved id (draft or
        // deleted entry) or a non-Sidenote inline embed renders nothing rather
        // than throwing.
        if (!entry || entry.__typename !== "Sidenote") return null;

        return <Sidenote content={entry.note} number={sidenoteIndex++} />;
      },
      [INLINES.HYPERLINK]: renderHyperlink,
    },
  });
}
