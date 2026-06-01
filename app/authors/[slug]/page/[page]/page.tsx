import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import ContentfulImage from "@/lib/contentful-image";
import Container from "../../../../container";
import MoreStories from "../../../../more-stories";
import Pagination from "../../../../pagination";
import Breadcrumb, { type Crumb } from "../../../../breadcrumb";
import { getAllAuthors, getAuthorBySlug, getPostsByAuthor } from "@/lib/api";
import { POSTS_PER_PAGE, SITE_TITLE } from "@/lib/constants";

export const dynamicParams = true;

export async function generateStaticParams() {
  const authors = await getAllAuthors(false);
  const perAuthor = await Promise.all(
    authors
      .filter((author) => author.slug)
      .map(async (author) => {
        const slug = author.slug as string;
        const posts = await getPostsByAuthor(slug, false);
        const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
        const params: { slug: string; page: string }[] = [];
        for (let p = 2; p <= totalPages; p++) {
          params.push({ slug, page: String(p) });
        }
        return params;
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

  return {
    title: `${author.name}, page ${page}`,
    description: `Posts by ${author.name} on ${SITE_TITLE}.`,
    openGraph: author.picture?.url ? { images: [author.picture.url] } : undefined,
  };
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

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: author.name }];

  const posts = await getPostsByAuthor(slug, isEnabled);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));

  if (pageNumber > totalPages) {
    notFound();
  }

  const pagePosts = posts.slice(
    (pageNumber - 1) * POSTS_PER_PAGE,
    pageNumber * POSTS_PER_PAGE,
  );

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mx-auto max-w-5xl mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          {author.picture?.url && (
            <ContentfulImage
              alt={author.name}
              className="rounded-full object-cover h-20 w-20 shrink-0"
              width={80}
              height={80}
              src={author.picture.url}
            />
          )}
          <h1 className="text-5xl font-bold leading-tight tracking-tighter md:text-6xl">
            {author.name}
          </h1>
        </div>
      </header>

      <MoreStories morePosts={pagePosts} variant="list" heading={null} priorityFirst />
      <Pagination currentPage={pageNumber} totalPages={totalPages} basePath={`/authors/${slug}`} />
    </Container>
  );
}
