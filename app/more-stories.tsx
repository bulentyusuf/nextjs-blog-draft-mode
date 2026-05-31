import Link from "next/link";
import DateComponent from "./date";
import CoverImage from "./cover-image";
import type { Post, CoverImage as CoverImageType } from "@/lib/types";

type Variant = "grid" | "list";

function PostPreview({
  title,
  coverImage,
  date,
  excerpt,
  slug,
  variant,
  priority = false,
}: {
  title: string;
  coverImage?: CoverImageType;
  date: string;
  excerpt: string;
  slug: string;
  variant: Variant;
  priority?: boolean;
}) {
  if (variant === "list") {
    return (
      <article className="grid grid-cols-1 gap-5 py-10 first:pt-0 md:grid-cols-[2fr_3fr] md:gap-8 md:items-start md:py-12 md:first:pt-0">
        {coverImage && (
          <div>
            <CoverImage
              title={title}
              slug={slug}
              url={coverImage.url}
              priority={priority}
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        )}
        <div>
          <h3 className="text-2xl md:text-3xl mb-2 leading-snug font-bold">
            <Link
              href={`/posts/${slug}`}
              className="hover:text-brand-crimson transition-colors duration-200"
            >
              {title}
            </Link>
          </h3>
          <div className="text-base text-gray-500 mb-3">
            <DateComponent dateString={date} />
          </div>
          <p className="text-lg leading-relaxed">{excerpt}</p>
        </div>
      </article>
    );
  }

  return (
    <div>
      {coverImage && (
        <div className="mb-4">
          <CoverImage
            title={title}
            slug={slug}
            url={coverImage.url}
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 450px"
          />
        </div>
      )}
      <h3 className="text-3xl mb-3 leading-snug font-bold">
        <Link
          href={`/posts/${slug}`}
          className="hover:text-brand-crimson transition-colors duration-200"
        >
          {title}
        </Link>
      </h3>
      <div className="text-lg text-gray-500 mb-4">
        <DateComponent dateString={date} />
      </div>
      <p className="text-lg leading-relaxed">{excerpt}</p>
    </div>
  );
}

export default function MoreStories({
  morePosts,
  variant = "list",
  heading,
  priorityFirst = false,
}: {
  morePosts: Post[];
  variant?: Variant;
  heading: string | null;
  // When true, the first post's cover image is fetched with priority. Use on
  // heroless listing pages (index page 2+, category pages) where that image is
  // the LCP. Leave false where a hero already owns priority (index page 1).
  priorityFirst?: boolean;
}) {
  const container =
    variant === "list"
      ? "flex flex-col divide-y divide-gray-200"
      : "grid grid-cols-1 md:grid-cols-2 md:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32";

  return (
    <section className="mx-auto max-w-5xl">
      {heading && (
        <h2 className="mb-8 text-6xl md:text-7xl font-bold tracking-tighter leading-tight">
          {heading}
        </h2>
      )}
      <div className={container}>
        {morePosts.map((post, i) => (
          <PostPreview
            key={post.slug}
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            slug={post.slug}
            excerpt={post.excerpt}
            variant={variant}
            priority={priorityFirst && i === 0}
          />
        ))}
      </div>
    </section>
  );
}
