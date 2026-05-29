import LightboxImage from "./lightbox-image";
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
}: {
  content: Content;
  headings: Heading[];
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
