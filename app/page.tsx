import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";

import Date from "./date";
import CoverImage from "./cover-image";
import Avatar from "./avatar";
import Container from "./container";
import MoreStories from "./more-stories";
import Pagination from "./pagination";

import { getAllPosts } from "@/lib/api";
import { POSTS_PER_PAGE, SITE_URL } from "@/lib/constants";
import { createCoverNamer } from "@/lib/view-transition-name";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};
import type { Author, Category, CoverImage as CoverImageType } from "@/lib/types";

function HeroPost({
  title,
  coverImage,
  date,
  updatedDate,
  excerpt,
  author,
  slug,
  category,
  transitionName,
}: {
  title: string;
  coverImage?: CoverImageType;
  date: string;
  updatedDate?: string;
  excerpt: string;
  author?: Author;
  slug: string;
  category?: Category;
  transitionName?: string;
}) {
  const showUpdated = updatedDate && updatedDate !== date;

  // Lead with the published date (matches the index cards). The updated
  // date is desktop-only so the mobile byline stays one tight line.
  const dateline = (
    <>
      <Date dateString={date} />
      {showUpdated && (
        <span className="hidden sm:inline">
          {" · "}Updated <Date dateString={updatedDate!} />
        </span>
      )}
      {category && (
        <>
          {" · "}
          <Link
            href={`/categories/${category.slug}`}
            className="hover:text-brand-crimson transition-colors duration-200"
          >
            {category.name}
          </Link>
        </>
      )}
    </>
  );

  return (
    <section className="mx-auto max-w-5xl mb-section">
      <div>
        <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl leading-tight text-balance">
          <Link
            href={`/posts/${slug}`}
            className="hover:text-brand-crimson transition-colors duration-200"
          >
            {title}
          </Link>
        </h1>
        <p className="text-lg leading-relaxed mb-6 text-pretty">{excerpt}</p>
        {author && (
          <div className="flex items-center">
            <Avatar
              name={author.name}
              slug={author.slug}
              picture={author.picture}
              meta={dateline}
            />
          </div>
        )}
      </div>
      {coverImage && (
        <div className="mt-8 md:mt-10">
          <CoverImage
            title={title}
            slug={slug}
            url={coverImage.url}
            wide
            priority
            transitionName={transitionName}
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        </div>
      )}
    </section>
  );
}

export default async function Page() {
  const { isEnabled } = await draftMode();
  const allPosts = await getAllPosts(isEnabled);

  const heroPost = allPosts[0];
  // Hero counts toward the page budget, so page 1 shows the hero plus
  // (POSTS_PER_PAGE - 1) cards.
  const morePosts = allPosts.slice(1, POSTS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));

  // One name allocator for the whole page so the hero and the cards below can
  // never emit the same cover-{slug} twice (a duplicate would invalidate the
  // entire view transition). First occurrence — the hero — wins.
  const coverName = createCoverNamer();

  return (
    <Container>
      {heroPost && (
        <HeroPost
          title={heroPost.title}
          coverImage={heroPost.coverImage}
          date={heroPost.date}
          updatedDate={heroPost.updatedDate}
          author={heroPost.author}
          slug={heroPost.slug}
          excerpt={heroPost.excerpt}
          category={heroPost.category}
          transitionName={coverName(heroPost.slug)}
        />
      )}
      <MoreStories morePosts={morePosts} variant="list" heading="Latest Posts" coverName={coverName} />
      <Pagination currentPage={1} totalPages={totalPages} basePath="/" />
    </Container>
  );
}
