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
}: {
  id: string;
  assets: Asset[] | undefined;
}) {
  const asset = assets?.find((asset) => asset.sys.id === id);

  if (!asset?.url) return null;

  return (
    <div className="my-8">
      <LightboxImage
        src={asset.url}
        alt={asset.description || ""}
        caption={asset.description}
      />
      {asset.description && (
        <p className="text-sm text-gray-600 mt-2 text-center italic">
          {asset.description}
        </p>
      )}
    </div>
  );
}

export function RichText({
  content,
  headings,
  highlighted,
}: {
  content: Content;
  headings: Heading[];
  highlighted?: Map<string, string>;
}) {
  // Single source of truth for heading ids. `headings` comes from
  // extractHeadings() on the page. documentToReactComponents walks in document
  // order, so advancing one index per non-empty H2 pairs each heading with its
  // precomputed slug. The empty-heading skip below mirrors extractHeadings()
  // exactly. rich-text.test.tsx asserts the two never drift.
  let headingIndex = 0;

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
      [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => (
        <RichTextAsset
          id={(node as Block).data.target.sys.id}
          assets={content.links.assets.block}
        />
      ),
      [BLOCKS.EMBEDDED_ENTRY]: (node: Block | Inline) => {
        const id = (node as Block).data.target.sys.id;
        const entry = content.links.entries?.block?.find((e) => e.sys.id === id);
        if (!entry) return null;

        if (entry.__typename === "CodeBlock") {
          const html = highlighted?.get(id);

          return (
            <div className="not-prose relative my-8 overflow-hidden rounded-lg border border-gray-200">
              {entry.filename ? (
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 font-mono text-xs text-gray-500">
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
            <div className="not-prose my-8 overflow-hidden rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 bg-brand-crimson px-4 py-2 font-mono text-xs text-white">
                {entry.image?.url && (
                  <div
                    aria-hidden="true"
                    className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded"
                  >
                    <ContentfulImage
                      src={entry.image.url}
                      alt=""
                      fill
                      sizes="42px"
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="flex-1 text-sm font-semibold">{entry.label || "Prompt"}</span>
                <CopyButton code={entry.prompt} label="prompt" />
              </div>
              <div
                tabIndex={0}
                role="region"
                aria-label={entry.label || "Prompt"}
                className="overflow-x-auto whitespace-pre-wrap break-words bg-gray-50 px-4 py-3 font-mono text-sm text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
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
