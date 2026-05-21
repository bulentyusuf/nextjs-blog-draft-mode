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
      width={2000}
      height={1333}
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"}
      className={cn("w-full h-auto", {
        "hover:opacity-90 transition-opacity duration-200": slug,
      })}
      src={url}
    />
  );
  return (
    <div className="sm:mx-0">
      {slug ? (
        <Link href={`/posts/${slug}`} aria-label={title}>
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
}
