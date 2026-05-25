import Link from "next/link";
import { draftMode } from "next/headers";

import Date from "./date";
import CoverImage from "./cover-image";
import Avatar from "./avatar";
import MoreStories from "./more-stories";

import { getAllPosts } from "@/lib/api";

function HeroPost({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}: {
  title: string;
  coverImage?: any;
  date: string;
  excerpt: string;
  author: any;
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
      <div className="md:grid md:grid-cols-2 md:gap-x-16">
        <div>
          <h3 className="mb-4 text-4xl lg:text-6xl leading-tight font-bold">
            <Link
              href={`/posts/${slug}`}
              className="hover:text-brand-crimson transition-colors duration-200"
            >
              {title}
            </Link>
          </h3>
        </div>
        <div>
          <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
          {author && <Avatar name={author.name} picture={author.picture} />}
          <p className="mb-4 text-lg">
            <Date dateString={date} />
          </p>
        </div>
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
