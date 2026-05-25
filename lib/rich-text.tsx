import ContentfulImage from "./contentful-image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import type { Asset, Content } from "./types";
import { SITE_HOSTNAME } from "./constants";
import { createSlugger } from "./headings";

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

// Pull plain text out of a heading node's inline children, so the id matches
// the slug the TOC computes from the same text.
function headingText(node: any): string {
  if (!node?.content) return "";
  return node.content
    .map((child: any) =>
      child.nodeType === "text" ? child.value : headingText(child),
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
      <ContentfulImage
        src={asset.url}
        alt={asset.description || ""}
        width={1200}
        height={800}
        sizes="(max-width: 768px) 100vw, 800px"
        className="w-full h-auto border-2 border-gray-300"
      />
      {asset.description && (
        <p className="text-sm text-gray-600 mt-2 text-center italic">
          {asset.description}
        </p>
      )}
    </div>
  );
}

export function RichText({ content }: { content: Content }) {
  // One slugger instance per render. documentToReactComponents walks nodes in
  // document order, so the Nth H2 rendered draws the Nth slug — identical to
  // the sequence extractHeadings() produces for the TOC.
  const slugger = createSlugger();

  return documentToReactComponents(content.json, {
    renderNode: {
      [BLOCKS.HEADING_2]: (node: any, children: any) => {
        const id = slugger(headingText(node).trim());
        return (
          <h2 id={id} className="scroll-mt-24">
            {children}
          </h2>
        );
      },
      [BLOCKS.EMBEDDED_ASSET]: (node: any) => (
        <RichTextAsset
          id={node.data.target.sys.id}
          assets={content.links.assets.block}
        />
      ),
      [INLINES.HYPERLINK]: (node: any, children: any) => {
        const uri: string = node.data.uri;
        if (isExternalUrl(uri)) {
          return (
            <a href={uri} target="_blank" rel="noopener">
              {children}
            </a>
          );
        }
        return <a href={uri}>{children}</a>;
      },
    },
  });
}
