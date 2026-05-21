import ContentfulImage from "../lib/contentful-image";
import Link from "next/link";

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function CoverImage({
  title,
  url,
  slug,
  sizes,
}: {
  title: string;
  url: string;
  slug?: string;
  sizes?: string;
}) {
  const image = (
    <ContentfulImage
      alt={`Cover Image for ${title}`}
      priority={!slug}
      fill
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"}
      className={cn("object-cover", {
        "hover:opacity-90 transition-opacity duration-200": slug,
      })}
      src={url}
    />
  );
  return (
    <div className={cn("relative aspect-[3/2] sm:mx-0 shadow-lg", {
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
  );
}
