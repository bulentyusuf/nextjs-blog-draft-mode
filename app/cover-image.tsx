import ContentfulImage from "../lib/contentful-image";
import Link from "next/link";
import { clsx as cn } from "clsx";
import { getBlurDataURL } from "@/lib/blur";

export default async function CoverImage({
  title,
  url,
  slug,
  sizes,
  wide,
  priority = false,
  hover = false,
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
  // Opt-in gentle zoom on hover/keyboard-focus, for interactive listing-card
  // previews only. Off for the homepage hero and post cover (not previews).
  // Reduced-motion users get no movement (motion-safe: prefix), no JS.
  hover?: boolean;
}) {
  // Cold-cache LQIP: a tiny blurred preview underlays the frame so covers show a
  // full colour wash from first paint rather than a stark void. Undefined when
  // the fetch fails — the bg-brand-dark/5 tint on the wrapper is the fallback.
  const blurDataURL = await getBlurDataURL(url);
  const image = (
    <ContentfulImage
      alt=""
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      fill
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"}
      className={cn("object-cover", {
        "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.02] motion-safe:group-focus-within:scale-[1.02] pointer-fine:motion-safe:will-change-transform":
          hover,
      })}
      src={url}
    />
  );
  return (
    <div className="shadow-lg sm:mx-0">
      <div className={cn("relative overflow-hidden bg-brand-dark/5", wide ? "aspect-3/2 md:aspect-video" : "aspect-3/2", {
        "cursor-pointer": slug,
        group: hover,
        "motion-safe:transform-gpu": hover,
      })}>
        {blurDataURL && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${blurDataURL})` }}
          />
        )}
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
