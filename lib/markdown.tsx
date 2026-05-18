import ContentfulImage from "./contentful-image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import type { Asset, Content } from "./types";
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
        className="w-full h-auto"
      />
      {asset.description && (
        <p className="text-sm text-gray-600 mt-2 text-center italic">
          {asset.description}
        </p>
      )}
    </div>
  );
}

export function Markdown({ content }: { content: Content }) {
  return documentToReactComponents(content.json, {
    renderNode: {
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
