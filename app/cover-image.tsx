import ContentfulImage from "../lib/contentful-image";
import Link from "next/link";
import { clsx as cn } from "clsx";

export default function CoverImage({
  title,
  url,
  slug,
  sizes,
  wide,
  priority = false,
}: {
  title: string;
  url: string;
  slug?: string;
  sizes?: string;
  // When true, the image is 3:2 on mobile and 16:9 on desktop (md+).
  // Used only by the post hero. Omitted everywhere else (cards stay 3:2).
  wide?: boolean;
  // Set on the above-the-fold hero image only (index + post page) so the
  // LCP element is fetched eagerly. Leave false for cards and grids.
  priority?: boolean;
}) {
  const image = (
    <ContentfulImage
      alt={`Cover Image for ${title}`}
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      fill
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"}
      className={cn("object-cover", {
        "hover:opacity-90 transition-opacity duration-200": slug,
      })}
      src={url}
    />
  );
  return (
    <div className="shadow-lg sm:mx-0">
      <div className={cn("relative overflow-hidden", wide ? "aspect-3/2 md:aspect-video" : "aspect-3/2", {
        "cursor-pointer": slug,
      })}>
        {slug ? (
          <Link href={`/posts/${slug}`} aria-label={title} className="block h-full">
            {image}
          </Link>
        ) : (
          image
        )}
      </div>
    </div>
  );
}
