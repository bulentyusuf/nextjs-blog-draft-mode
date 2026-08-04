import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import ContentfulImage from "@/lib/contentful-image";
import TaxonomyListing from "../../../../taxonomy-listing";
import PageContext from "../../../../page-context";
import { type Crumb } from "../../../../breadcrumb";
import { RichText } from "@/lib/rich-text";
import {
  getAllAuthors,
  getAuthorBySlug,
  getPostsByAuthor,
  getVisibleTagSlugs,
} from "@/lib/api";
import { SITE_TITLE, SITE_URL } from "@/lib/constants";
import { listingMetadata } from "@/lib/page-metadata";
import { pageItems, pageRangeParams, totalPagesFor } from "@/lib/paginate";
import { widont } from "@/lib/typography";

export const dynamicParams = true;

export async function generateStaticParams() {
  const authors = await getAllAuthors(false);
  const perAuthor = await Promise.all(
    authors
      .filter((author) => author.slug)
      .map(async (author) => {
        const slug = author.slug as string;
        const posts = await getPostsByAuthor(slug, false);
        return pageRangeParams(posts.length, (page) => ({ slug, page }));
      }),
  );
  return perAuthor.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const { slug, page } = await params;
  const author = await getAuthorBySlug(slug, isEnabled);

  if (!author) {
    return { title: "Author not found" };
  }

  return listingMetadata({
    title: `${author.name}, Page ${page}`,
    description: `Posts by ${author.name} on ${SITE_TITLE}`,
    canonical: `${SITE_URL}/authors/${slug}/page/${page}`,
    images: author.picture?.url ? [author.picture.url] : undefined,
  });
}

export default async function AuthorPaginatedPage({
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
  // Page 1 has a single canonical home at /authors/<slug>.
  if (pageNumber === 1) {
    redirect(`/authors/${slug}`);
  }

  const author = await getAuthorBySlug(slug, isEnabled);
  if (!author) {
    notFound();
  }

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Authors", href: "/authors" },
    { label: author.name },
  ];

  // Independent queries, so they go out together — see the unpaginated page.
  const [posts, visibleTags] = await Promise.all([
    getPostsByAuthor(slug, isEnabled),
    getVisibleTagSlugs(isEnabled),
  ]);
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
      visibleTags={visibleTags}
      basePath={`/authors/${slug}`}
    >
      <div className="flex items-center gap-6">
        {author.picture?.url && (
          <ContentfulImage
            alt=""
            className="rounded-full object-cover h-28 w-28 shrink-0"
            width={112}
            height={112}
            src={author.picture.url}
          />
        )}
        <h1 className="text-4xl leading-tight md:text-5xl lg:text-6xl text-pretty">
          {widont(author.name)}
        </h1>
      </div>
      <PageContext currentPage={pageNumber} totalPages={totalPages} />
      {author.bio && (
        <div className="mt-4 max-w-3xl text-lg leading-relaxed text-brand-muted text-pretty">
          <RichText content={author.bio} headings={[]} />
        </div>
      )}
    </TaxonomyListing>
  );
}
