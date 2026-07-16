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
  // Reveal the image only once its bitmap is genuinely ready; the blur underlay
  // (rendered by the caller) shows through during the brief 'pending' window, so
  // there is never a white frame. The 300ms fade runs only for the network path
  // — cached images that are already complete at hydration reveal instantly, no
  // fade theatre. The `@media (scripting: none)` rule in globals.css forces img
  // opacity to 1, keeping images visible without JS.
  //   'pending' = not yet shown (blur underlay visible)
  //   'instant' = already complete at hydration (cached) -> show with no fade
  //   'fade'    = arrived over the network -> crossfade in
  const [reveal, setReveal] = useState<"pending" | "instant" | "fade">("pending");

  return (
    <Image
      loader={contentfulLoader}
      {...props}
      className={cn(
        className,
        reveal === "fade" && "transition-opacity duration-300",
        reveal === "pending" ? "opacity-0" : "opacity-100",
      )}
      // Cached case: complete at mount, reveal with no fade theatre.
      ref={(img) => {
        if (img?.complete) setReveal((r) => (r === "pending" ? "instant" : r));
      }}
      // Network case: only fade if we had not already revealed instantly.
      onLoad={(event) => {
        setReveal((r) => (r === "pending" ? "fade" : r));
        onLoad?.(event);
      }}
    />
  );
}
