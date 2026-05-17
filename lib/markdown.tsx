import ContentfulImage from "./contentful-image";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";

interface Asset {
  sys: {
    id: string;
  };
  url: string;
  description: string;
}

interface AssetLink {
  block: Asset[];
}

interface Content {
  json: any;
  links: {
    assets: AssetLink;
  };
}

const INTERNAL_HOST = "bulentyusuf.com";

function isExternalUrl(url: string): boolean {
  // Relative URLs and same-host absolute URLs are internal.
  // Anything else is external.
  try {
    // URL constructor needs a base for relative URLs; we just want to know
    // if parsing as absolute succeeds and the host differs.
    const parsed = new URL(url);
    return !parsed.hostname.endsWith(INTERNAL_HOST);
  } catch {
    // Not parseable as absolute URL → it's relative (e.g. /posts/foo, #anchor)
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
