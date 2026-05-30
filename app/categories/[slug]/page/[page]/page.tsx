import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import MoreStories from "../../../../more-stories";
import Pagination from "../../../../pagination";
import { getAllCategories, getCategoryBySlug, getPostsByCategory } from "@/lib/api";
import { POSTS_PER_PAGE, SITE_TITLE } from "@/lib/constants";

export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getAllCategories(false);
  const params: { slug: string; page: string }[] = [];
  for (const category of categories) {
    const posts = await getPostsByCategory(category.slug, false);
    const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
    for (let p = 2; p <= totalPages; p++) {
      params.push({ slug: category.slug, page: String(p) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const { slug, page } = await params;
  const category = await getCategoryBySlug(slug, isEnabled);

  if (!category) {
    return { title: "Category not found" };
  }

  return {
    title: `${category.name}, page ${page}`,
    description: category.description || `Posts in ${category.name} on ${SITE_TITLE}.`,
  };
}

export default async function CategoryPaginatedPage({
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
  // Page 1 has a single canonical home at /categories/<slug>.
  if (pageNumber === 1) {
    redirect(`/categories/${slug}`);
  }

  const category = await getCategoryBySlug(slug, isEnabled);
  if (!category) {
    notFound();
  }

  const posts = await getPostsByCategory(slug, isEnabled);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));

  if (pageNumber > totalPages) {
    notFound();
  }

  const pagePosts = posts.slice(
    (pageNumber - 1) * POSTS_PER_PAGE,
    pageNumber * POSTS_PER_PAGE,
  );

  return (
    <div className="max-w-5xl mx-auto px-5 pt-8">
      <header className="mx-auto max-w-5xl mb-16 md:mb-20">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-crimson">
          Category
        </p>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tighter md:text-6xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-2xl text-lg leading-relaxed text-gray-600">
            {category.description}
          </p>
        )}
      </header>

      <MoreStories
        morePosts={pagePosts}
        variant="list"
        heading={null}
        priorityFirst
      />
      <Pagination
        currentPage={pageNumber}
        totalPages={totalPages}
        basePath={`/categories/${slug}`}
      />
    </div>
  );
}
