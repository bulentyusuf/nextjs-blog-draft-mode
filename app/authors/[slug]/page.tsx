import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import ContentfulImage from "@/lib/contentful-image";
import Container from "../../container";
import MoreStories from "../../more-stories";
import Pagination from "../../pagination";
import Breadcrumb, { type Crumb } from "../../breadcrumb";
import { RichText } from "@/lib/rich-text";
import { getAllAuthors, getAuthorBySlug, getPostsByAuthor } from "@/lib/api";
import { POSTS_PER_PAGE, SITE_TITLE } from "@/lib/constants";

// Allow on-demand rendering of authors added after build time.
export const dynamicParams = true;

export async function generateStaticParams() {
  const authors = await getAllAuthors(false);
  return authors
    .filter((author) => author.slug)
    .map((author) => ({ slug: author.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const { slug } = await params;
  const author = await getAuthorBySlug(slug, isEnabled);

  if (!author) {
    return { title: "Author not found" };
  }

  return {
    title: author.name,
    description: `Posts by ${author.name} on ${SITE_TITLE}.`,
    openGraph: author.picture?.url ? { images: [author.picture.url] } : undefined,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { isEnabled } = await draftMode();
  const { slug } = await params;

  const author = await getAuthorBySlug(slug, isEnabled);

  if (!author) {
    notFound();
  }

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Authors", href: "/authors" },
    { label: author.name },
  ];

  const posts = await getPostsByAuthor(slug, isEnabled);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const pagePosts = posts.slice(0, POSTS_PER_PAGE);

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mx-auto max-w-5xl mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-6">
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
        {author.bio && (
          <div className="max-w-3xl text-lg leading-relaxed text-gray-600">
            <RichText content={author.bio} headings={[]} />
          </div>
        )}
      </header>

      {posts.length > 0 ? (
        <>
          <MoreStories morePosts={pagePosts} variant="list" heading={null} priorityFirst />
          <Pagination currentPage={1} totalPages={totalPages} basePath={`/authors/${slug}`} />
        </>
      ) : (
        <p className="mx-auto max-w-5xl text-lg text-gray-500">
          No posts by this author yet.
        </p>
      )}
    </Container>
  );
}
