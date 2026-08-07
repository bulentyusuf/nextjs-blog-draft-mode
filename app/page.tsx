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

  // Cover first, then headline, excerpt and byline. In the old order this was
  // a post page's masthead rendered on the index — same elements, same order,
  // same scale — so home read as a preview of the article rather than as the
  // top of a list. The band above made that unmissable by putting a real
  // masthead directly over a masthead-shaped block that is not one.
  //
  // The cover keeps `wide` and `priority`. It is still the LCP element and it
  // is now the first painted image in document order as well, so it is
  // preloaded exactly as before and contentful-image.tsx still opens it at its
  // `instant` reveal state rather than waiting on hydration.
  return (
    <section className="mx-auto max-w-5xl mb-section">
      {coverImage && (
        <div className="mb-8 md:mb-10">
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
      <div>
        {/* An h2, so home's outline reads site name, hero, Latest Posts,
            cards. That is what makes the masthead structurally the top of the
            page rather than only visually it.

            One step above a list card's text-2xl md:text-3xl and two below the
            masthead's ramp, which is the "closer to the card" end of the gap.
            At the wide h1 ramp it carried before, this was the same size as a
            post page's own headline, which is the whole reason it read as one. */}
        <h2 className="mb-4 text-3xl md:text-4xl leading-tight text-pretty">
          <Link
            href={`/posts/${slug}`}
            className="hover:text-brand-crimson transition-colors duration-200"
          >
            {widont(title)}
          </Link>
        </h2>
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
    // The band carries the site masthead, which is what every other index does
    // with the site as its subject. It is home's h1 now that the hero below is
    // an h2, so the outline and the visual hierarchy finally say the same
    // thing. It stays unlinked, because a link on / points at the page the
    // reader is already on, which is why the last breadcrumb crumb is plain
    // text too. The bar's own wordmark hides itself here through a rule in
    // globals.css, so the name is said once rather than twice within 100px.
    //
    // No font-display and no weight class. The base-layer rule in globals.css
    // gives h1 both, and as a <p> this rendered at 400 against the 700 of the
    // post headlines under it, which is what a per-component override would
    // have papered over.
    //
    // Neither element names a colour. Both take white from the band's root, as
    // every other band's contents do.
    <BrowsePage
      header={
        <>
          <h1 className="site-masthead mb-3 text-4xl leading-tight md:text-5xl lg:text-6xl">
            {SITE_TITLE}
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed">
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
