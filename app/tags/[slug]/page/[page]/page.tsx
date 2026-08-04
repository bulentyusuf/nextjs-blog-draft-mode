import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import TaxonomyListing from "../../../../taxonomy-listing";
import PageContext from "../../../../page-context";
import { type Crumb } from "../../../../breadcrumb";
import { getAllPosts, getTagBySlug } from "@/lib/api";
import { postsWithTag, visibleTagSlugs } from "@/lib/tags";
import { SITE_TITLE, SITE_URL } from "@/lib/constants";
import { listingMetadata } from "@/lib/page-metadata";
import { pageItems, pageRangeParams, totalPagesFor } from "@/lib/paginate";
import { widont } from "@/lib/typography";

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts(false);

  // No extra fetch per tag, unlike the category equivalent: postsWithTag
  // filters the same getAllPosts result, so the counts are already here.
  return [...visibleTagSlugs(posts)].flatMap((slug) =>
    pageRangeParams(postsWithTag(posts, slug).length, (page) => ({
      slug,
      page,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const { slug, page } = await params;
  const tag = await getTagBySlug(slug, isEnabled);

  if (!tag) {
    return { title: "Tag not found" };
  }

  return listingMetadata({
    title: `${tag.name}, Page ${page}`,
    description: tag.description || `Posts tagged ${tag.name} on ${SITE_TITLE}`,
    canonical: `${SITE_URL}/tags/${slug}/page/${page}`,
  });
}

export default async function TagPaginatedPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { isEnabled } = await draftMode();
  const { slug, page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }
  // Page 1 has a single canonical home at /tags/<slug>.
  if (pageNumber === 1) {
    redirect(`/tags/${slug}`);
  }

  const tag = await getTagBySlug(slug, isEnabled);
  if (!tag) {
    notFound();
  }

  // One fetch, read twice — see the note on the unpaginated tag page.
  const allPosts = await getAllPosts(isEnabled);
  const visible = visibleTagSlugs(allPosts);
  if (!visible.has(slug)) {
    notFound();
  }

  const posts = postsWithTag(allPosts, slug);
  const otherTags = new Set([...visible].filter((s) => s !== slug));

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Tags", href: "/tags" },
    { label: tag.name },
  ];

  const totalPages = totalPagesFor(posts.length);

  if (pageNumber > totalPages) {
    notFound();
  }

  return (
    <TaxonomyListing
      crumbs={crumbs}
      posts={pageItems(posts, pageNumber)}
      currentPage={pageNumber}
      totalPages={totalPages}
      visibleTags={otherTags}
      basePath={`/tags/${slug}`}
    >
      <h1 className="text-4xl leading-tight md:text-5xl lg:text-6xl text-pretty">
        {widont(tag.name)}
      </h1>
      <PageContext currentPage={pageNumber} totalPages={totalPages} />
      {tag.description && (
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-brand-muted text-pretty">
          {tag.description}
        </p>
      )}
    </TaxonomyListing>
  );
}
