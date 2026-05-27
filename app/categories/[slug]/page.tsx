import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import MoreStories from "../../more-stories";
import { getAllCategories, getCategoryBySlug, getPostsByCategory } from "@/lib/api";
import { SITE_TITLE } from "@/lib/constants";

// Allow on-demand rendering of categories added after build time, so a new
// category in Contentful doesn't 404 until the next deploy.
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getAllCategories(false);
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const { slug } = await params;
  const category = await getCategoryBySlug(slug, isEnabled);

  if (!category) {
    return { title: "Category not found" };
  }

  return {
    title: category.name,
    description: category.description || `Posts in ${category.name} on ${SITE_TITLE}.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { isEnabled } = await draftMode();
  const { slug } = await params;

  const category = await getCategoryBySlug(slug, isEnabled);

  if (!category) {
    notFound();
  }

  const posts = await getPostsByCategory(slug, isEnabled);

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

      {posts.length > 0 ? (
        <MoreStories morePosts={posts} variant="list" heading={null} />
      ) : (
        <p className="mx-auto max-w-5xl text-lg text-gray-500 mb-32">
          No posts in this category yet.
        </p>
      )}
    </div>
  );
}
