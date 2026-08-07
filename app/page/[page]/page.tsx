import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";

import TaxonomyListing from "../../taxonomy-listing";

import { getAllPosts } from "@/lib/api";
import { visibleTagSlugs } from "@/lib/tags";
import { SITE_URL } from "@/lib/constants";
import {
  pageItems,
  pageRangeParams,
  parsePageParam,
  totalPagesFor,
} from "@/lib/paginate";

// Render pages added after build on demand; out-of-range pages 404 below.
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts(false);
  // Page 1 lives at "/", so only build 2..totalPages here.
  return pageRangeParams(posts.length, (page) => ({ page }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  // The component 404s on anything that is not a page number, so metadata has
  // to agree — otherwise a title and a canonical are built out of the raw
  // segment for a URL that is about to not exist.
  if (parsePageParam(page) === null) {
    return { title: "Page not found" };
  }
  return {
    title: `Latest Posts, Page ${page}`,
    alternates: { canonical: `${SITE_URL}/page/${page}` },
  };
}

export default async function IndexPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNumber = parsePageParam(page);

  if (pageNumber === null) {
    notFound();
  }
  // Page 1 has a single canonical home at "/".
  if (pageNumber === 1) {
    redirect("/");
  }

  const { isEnabled } = await draftMode();
  const allPosts = await getAllPosts(isEnabled);
  const totalPages = totalPagesFor(allPosts.length);

  if (pageNumber > totalPages) {
    notFound();
  }

  const posts = pageItems(allPosts, pageNumber);

  // No `crumbs`. Pagination sets basePath="/", so page 1 of this listing is the
  // home page and there is no level above it to link to. No `emptyMessage`
  // either, because the guard above 404s past the last page, so empty is
  // unreachable and omitting the prop asserts that.
  return (
    <TaxonomyListing
      posts={posts}
      currentPage={pageNumber}
      totalPages={totalPages}
      visibleTags={visibleTagSlugs(allPosts)}
      basePath="/"
    >
      {/* Title case, matching the "Latest Posts" heading this page continues
          on the index — and matching this page's own metadata title, which
          has always read "Latest Posts, Page N". The h1 was the only one of
          the three in sentence case. */}
      <h1 className="text-4xl leading-tight md:text-5xl lg:text-6xl text-pretty">
        Latest Posts
      </h1>
    </TaxonomyListing>
  );
}
