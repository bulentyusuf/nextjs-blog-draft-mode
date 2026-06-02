import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";

import Container from "../../container";
import MoreStories from "../../more-stories";
import Pagination from "../../pagination";

import { getAllPosts } from "@/lib/api";
import { POSTS_PER_PAGE, SITE_URL } from "@/lib/constants";

// Render pages added after build on demand; out-of-range pages 404 below.
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts(false);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  // Page 1 lives at "/", so only build 2..totalPages here.
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Page ${page}`,
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
  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));

  if (pageNumber > totalPages) {
    notFound();
  }

  const posts = allPosts.slice(
    (pageNumber - 1) * POSTS_PER_PAGE,
    pageNumber * POSTS_PER_PAGE,
  );

  return (
    <Container>
      <MoreStories morePosts={posts} variant="list" heading="Latest posts" priorityFirst />
      <Pagination currentPage={pageNumber} totalPages={totalPages} basePath="/" />
    </Container>
  );
}
