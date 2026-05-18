"use client";
import Image, { type ImageProps } from "next/image";

type ContentfulImageProps = Omit<ImageProps, "loader" | "src"> & {
  src: string;
};

const contentfulLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  return `${src}?w=${width}&q=${quality || 75}&fm=webp`;
};

export default function ContentfulImage(props: ContentfulImageProps) {
  return <Image loader={contentfulLoader} {...props} />;
}
