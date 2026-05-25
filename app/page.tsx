import Link from "next/link";
import { draftMode } from "next/headers";

import Date from "./date";
import CoverImage from "./cover-image";
import Avatar from "./avatar";
import MoreStories from "./more-stories";

import { getAllPosts } from "@/lib/api";
import type { Author, CoverImage as CoverImageType } from "@/lib/types";

function HeroPost({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}: {
  title: string;
  coverImage?: CoverImageType;
  date: string;
  excerpt: string;
  author?: Author;
  slug: string;
}) {
  return (
    <section className="mx-auto max-w-5xl mb-20 md:mb-28">
      {coverImage && (
        <div className="mb-6 md:mb-8">
          <CoverImage
            title={title}
            slug={slug}
            url={coverImage.url}
            wide
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        </div>
      )}
      <div className="mx-auto max-w-2xl">
        <h3 className="mb-4 text-4xl lg:text-6xl leading-tight font-bold">
          <Link
            href={`/posts/${slug}`}
            className="hover:text-brand-crimson transition-colors duration-200"
          >
            {title}
          </Link>
        </h3>
        <div className="mb-4 text-lg text-gray-500">
          <Date dateString={date} />
        </div>
        <p className="text-lg leading-relaxed mb-6">{excerpt}</p>
        {author && <Avatar name={author.name} picture={author.picture} />}
      </div>
    </section>
  );
}

export default async function Page() {
  const { isEnabled } = await draftMode();
  const allPosts = await getAllPosts(isEnabled);
  const heroPost = allPosts[0];
  const morePosts = allPosts.slice(1);

  return (
    <div className="max-w-5xl mx-auto px-5 pt-12">
      {heroPost && (
        <HeroPost
          title={heroPost.title}
          coverImage={heroPost.coverImage}
          date={heroPost.date}
          author={heroPost.author}
          slug={heroPost.slug}
          excerpt={heroPost.excerpt}
        />
      )}
      <MoreStories morePosts={morePosts} />
    </div>
  );
}
