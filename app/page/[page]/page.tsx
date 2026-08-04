import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";

import Container from "../../container";
import MoreStories from "../../more-stories";
import Pagination from "../../pagination";
import PageContext from "../../page-context";

import { getAllPosts } from "@/lib/api";
import { visibleTagSlugs } from "@/lib/tags";
import { SITE_URL } from "@/lib/constants";
import { pageItems, pageRangeParams, totalPagesFor } from "@/lib/paginate";

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
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
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

  return (
    <Container>
      <header className="mb-6 md:mb-8">
        {/* Title case, matching the "Latest Posts" heading this page continues
            on the index — and matching this page's own metadata title, which
            has always read "Latest Posts, Page N". The h1 was the only one of
            the three in sentence case. */}
        <h1 className="text-4xl leading-tight md:text-5xl lg:text-6xl text-pretty">
          Latest Posts
        </h1>
        <PageContext currentPage={pageNumber} totalPages={totalPages} />
      </header>
      <MoreStories
        morePosts={posts}
        variant="list"
        heading={null}
        priorityFirst
        visibleTags={visibleTagSlugs(allPosts)}
      />
      <Pagination
        currentPage={pageNumber}
        totalPages={totalPages}
        basePath="/"
      />
    </Container>
  );
}
