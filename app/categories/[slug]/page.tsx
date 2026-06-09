import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import Container from "../../container";
import MoreStories from "../../more-stories";
import Pagination from "../../pagination";
import Breadcrumb, { type Crumb } from "../../breadcrumb";
import { getAllCategories, getCategoryBySlug, getPostsByCategory } from "@/lib/api";
import { POSTS_PER_PAGE, SITE_TITLE, SITE_URL } from "@/lib/constants";

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

  const description = category.description || `Posts in ${category.name} on ${SITE_TITLE}`;
  const canonical = `${SITE_URL}/categories/${slug}`;

  return {
    title: category.name,
    description,
    alternates: { canonical },
    openGraph: {
      description,
      url: canonical,
      siteName: SITE_TITLE,
      images: [{ url: "/be_useful.jpg", width: 1200, height: 630, alt: SITE_TITLE }],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: category.name,
      description,
      images: ["/be_useful.jpg"],
    },
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

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
    { label: category.name },
  ];

  const posts = await getPostsByCategory(slug, isEnabled);
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const pagePosts = posts.slice(0, POSTS_PER_PAGE);

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mx-auto max-w-5xl mb-6 md:mb-8">
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tighter md:text-6xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
            {category.description}
          </p>
        )}
      </header>

      {posts.length > 0 ? (
        <>
          <MoreStories
            morePosts={pagePosts}
            variant="list"
            heading={null}
            priorityFirst
          />
          <Pagination
            currentPage={1}
            totalPages={totalPages}
            basePath={`/categories/${slug}`}
          />
        </>
      ) : (
        <p className="mx-auto max-w-5xl text-lg text-gray-600">
          No posts in this category yet.
        </p>
      )}
    </Container>
  );
}
