"use client";
import Image, { type ImageProps } from "next/image";

type ContentfulImageProps = Omit<ImageProps, "loader" | "src"> & {
  src: string;
};

// Contentful's Images API host. The transform query params below are only
// meaningful for assets served from here, so we host-check before appending
// them rather than trusting whatever URL the CMS hands us. Anything else is
// returned untouched (CSP img-src is the hard backstop on what can load).
const CONTENTFUL_IMAGE_HOST = "images.ctfassets.net";

const contentfulLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  try {
    const url = new URL(src);
    if (url.hostname !== CONTENTFUL_IMAGE_HOST) return src;
  } catch {
    return src;
  }
  return `${src}?w=${width}&q=${quality || 75}&fm=webp`;
};

export default function ContentfulImage(props: ContentfulImageProps) {
  return <Image loader={contentfulLoader} {...props} />;
}
