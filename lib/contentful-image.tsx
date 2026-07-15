"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { clsx as cn } from "clsx";

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

export default function ContentfulImage({
  className,
  onLoad,
  ...props
}: ContentfulImageProps) {
  // Hold the image invisible until its bitmap is genuinely ready, then crossfade
  // in. The blur underlay (rendered by the caller) shows through until then, so
  // there is never a white frame. The `@media (scripting: none)` rule in
  // globals.css forces img opacity to 1, keeping images visible without JS.
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      loader={contentfulLoader}
      {...props}
      className={cn(
        className,
        "transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
      )}
      // Covers the warm-cache case where the load event may never fire.
      ref={(img) => {
        if (img?.complete) setLoaded(true);
      }}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}
