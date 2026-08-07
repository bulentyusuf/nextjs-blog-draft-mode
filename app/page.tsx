import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";

import Date from "./date";
import CoverImage from "./cover-image";
import Avatar from "./avatar";
import BrowsePage from "./browse-page";
import MoreStories from "./more-stories";
import Pagination from "./pagination";

import { getAllPosts } from "@/lib/api";
import { visibleTagSlugs } from "@/lib/tags";
import {
  POSTS_PER_PAGE,
  SITE_URL,
  SITE_TITLE,
  SITE_DESCRIPTION,
} from "@/lib/constants";
import { totalPagesFor } from "@/lib/paginate";
import { createCoverNamer } from "@/lib/view-transition-name";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};
import type {
  Author,
  Category,
  CoverImage as CoverImageType,
} from "@/lib/types";
import { widont } from "@/lib/typography";

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
        <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl leading-tight text-pretty">
          <Link
            href={`/posts/${slug}`}
            className="hover:text-brand-crimson transition-colors duration-200"
          >
            {widont(title)}
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
  const totalPages = totalPagesFor(allPosts.length);

  // One name allocator for the whole page so the hero and the cards below can
  // never emit the same cover-{slug} twice (a duplicate would invalidate the
  // entire view transition). First occurrence — the hero — wins.
  const coverName = createCoverNamer();

  return (
    // No crumbs, because this is the root, and no bleed, because the hero
    // leads with its title rather than its cover and has nothing to pull up.
    //
    // Home is the one wide page with no page-level h1 of its own, since its h1
    // is the hero post title down in the column. So the band carries the site
    // masthead instead, which is what every other index does with the site as
    // its subject. Neither element is a heading or a link. A heading would take
    // the h1 away from the hero post, and a link would point at the page the
    // reader is already on, which is why the last breadcrumb crumb is plain
    // text too. The bar's own wordmark hides itself here through a rule in
    // globals.css, so the name is said once rather than twice within 100px.
    //
    // Neither element names a colour. Both take white from the band's root, as
    // every other band's contents do.
    <BrowsePage
      header={
        <>
          <p className="site-masthead font-display text-4xl leading-tight md:text-5xl lg:text-6xl">
            {SITE_TITLE}
          </p>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed">
            {SITE_DESCRIPTION}
          </p>
        </>
      }
    >
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
      <MoreStories
        morePosts={morePosts}
        variant="list"
        heading="Latest Posts"
        coverName={coverName}
        visibleTags={visibleTagSlugs(allPosts)}
      />
      <Pagination currentPage={1} totalPages={totalPages} basePath="/" />
    </BrowsePage>
  );
}
