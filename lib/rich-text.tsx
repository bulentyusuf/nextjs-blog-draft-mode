import LightboxImage from "./lightbox-image";
import CopyButton from "./copy-button";
import ContentfulImage from "./contentful-image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import type { Block, Inline } from "@contentful/rich-text-types";
import type { ReactNode } from "react";
import type { Asset, Content } from "./types";
import type { Heading } from "./headings";
import { SITE_HOSTNAME } from "./constants";

function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    return !(
      hostname === SITE_HOSTNAME || hostname.endsWith(`.${SITE_HOSTNAME}`)
    );
  } catch {
    return false;
  }
}

function headingText(node: Block | Inline): string {
  if (!node?.content) return "";
  return node.content
    .map((child) =>
      child.nodeType === "text" ? child.value : headingText(child as Block | Inline),
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
        />
      ) : (
        <ContentfulImage
          src={asset.url}
          alt={asset.description || ""}
          width={1200}
          height={800}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 672px"
          className="w-full h-auto border-2 border-gray-300 dark:border-brand-dark/15"
        />
      )}
      {asset.description && (
        <figcaption className="text-sm text-brand-muted mt-1.5 text-center">
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
        return (
          <h2 id={slug} className="scroll-mt-24">
            {children}
          </h2>
        );
      },
      [BLOCKS.HEADING_1]: coalesceToH2,
      [BLOCKS.QUOTE]: (_node: Block | Inline, children: ReactNode) => (
        // Pull quote: crimson rule, display face. not-prose so the typography
        // plugin's blockquote styling doesn't fight ours; inner paragraphs are
        // de-margined ([&_p]:m-0) with a gap only between multiple paragraphs.
        <blockquote className="not-prose my-9 border-l-4 border-brand-crimson pl-5 font-display text-2xl font-medium leading-snug text-brand-dark md:text-[1.75rem] [&_p]:m-0 [&_p+p]:mt-4">
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
        const entry = content.links.entries?.block?.find((e) => e.sys.id === id);
        if (!entry) return null;

        if (entry.__typename === "CodeBlock") {
          const html = highlighted?.get(id);

          return (
            <div className="not-prose relative my-8 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              {entry.filename ? (
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 font-mono text-xs text-brand-muted dark:border-white/10 dark:bg-white/5">
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
                className="overflow-x-auto text-sm [&_pre]:m-0 [&_pre]:p-4 [&_pre]:w-max [&_pre]:min-w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <pre
                tabIndex={0}
                role="region"
                aria-label={entry.filename || "Code block"}
                className="overflow-x-auto p-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <code>{entry.code}</code>
              </pre>
            )}
            </div>
          );
        }

        if (entry.__typename === "PromptBlock") {
          return (
            <div className="not-prose my-8 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              {/* In dark mode brand-crimson lifts (for link legibility); white
                  text on the lifted hue fails AA, so the header ink goes dark. */}
              <div className="flex items-center justify-between bg-brand-crimson px-4 py-2 font-mono text-xs text-white dark:text-surface-dark">
                <span className="min-w-0 flex-1 truncate">
                  {entry.label || "Prompt"}
                </span>
                <CopyButton code={entry.prompt} label="prompt" variant="dark" />
              </div>
              <div className="flow-root whitespace-pre-wrap break-words bg-gray-50 p-4 font-mono text-sm text-gray-800 dark:bg-white/5 dark:text-brand-dark">
                {entry.image?.url && (
                  <span
                    aria-hidden="true"
                    className="relative float-left mb-1 mr-3 block h-[52px] w-[78px] overflow-hidden rounded-md shadow-md ring-1 ring-black/10"
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
                {entry.prompt}
              </div>
            </div>
          );
        }

        return null;
      },
      [INLINES.HYPERLINK]: (node: Block | Inline, children: ReactNode) => {
        const uri: string = (node as Inline).data.uri;
        const ALLOWED_SCHEMES = ["http:", "https:", "mailto:"];
        try {
          const parsed = new URL(uri);
          if (!ALLOWED_SCHEMES.includes(parsed.protocol)) return <>{children}</>;
        } catch {
          return <>{children}</>;
        }
        if (isExternalUrl(uri)) {
          return (
            <a href={uri} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        }
        return <a href={uri}>{children}</a>;
      },
    },
  });
}
