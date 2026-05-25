import Link from "next/link";
import DateComponent from "./date";
import CoverImage from "./cover-image";

function PostPreview({
  title,
  coverImage,
  date,
  excerpt,
  slug,
}: {
  title: string;
  coverImage?: any;
  date: string;
  excerpt: string;
  slug: string;
}) {
  return (
    <article className="grid grid-cols-1 gap-5 md:grid-cols-[2fr_3fr] md:gap-8 md:items-start">
      {coverImage && (
        <div>
          <CoverImage
            title={title}
            slug={slug}
            url={coverImage.url}
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

export default function MoreStories({ morePosts }: { morePosts: any[] }) {
  return (
    <section className="mx-auto max-w-5xl">
      <h2 className="mb-8 text-6xl md:text-7xl font-bold tracking-tighter leading-tight">
        More Stories
      </h2>
      <div className="flex flex-col gap-12 md:gap-16 mb-32">
        {morePosts.map((post) => (
          <PostPreview
            key={post.slug}
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            slug={post.slug}
            excerpt={post.excerpt}
          />
        ))}
      </div>
    </section>
  );
}
