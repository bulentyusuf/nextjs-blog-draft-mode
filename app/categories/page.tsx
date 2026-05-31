import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import ContentfulImage from "@/lib/contentful-image";
import DateComponent from "../date";
import { getAllCategories, getRecentPostsByCategory } from "@/lib/api";
import { SITE_TITLE } from "@/lib/constants";

// How many recent posts to tease under each category. The full list lives on
// the individual category page (/categories/[slug]).
const PREVIEW_COUNT = 3;

export const metadata: Metadata = {
  title: "Categories",
  description: `Browse posts by category on ${SITE_TITLE}`,
};

export default async function CategoriesPage() {
  const { isEnabled } = await draftMode();

  // Categories come back ordered name_ASC, so "Main Quest" precedes "Side
  // Quests" (M before S). If a future category needs a different order, add an
  // explicit order field to the Category type rather than relying on the name.
  const categories = await getAllCategories(isEnabled);

  // One capped fetch per category, in parallel.
  const previews = await Promise.all(
    categories.map(
      async (c) =>
        [c.slug, await getRecentPostsByCategory(c.slug, PREVIEW_COUNT, isEnabled)] as const,
    ),
  );
  const postsBySlug = new Map(previews);

  return (
    <div className="max-w-5xl mx-auto px-5 pt-8 pb-16">
      <header className="mb-6 md:mb-8">
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-crimson">
          Browse
        </p>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tighter md:text-6xl">
          Categories
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
          One main quest, the rest are side quests. Pick a path.
        </p>
      </header>

      {/* One card per category, two across on desktop, stacked on mobile. */}
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-10">
        {categories.map((category) => {
          const posts = postsBySlug.get(category.slug) ?? [];
          const thumbUrl = category.thumbnail?.url;
          return (
            <article key={category.slug} className="flex flex-col min-w-0">
              {thumbUrl && (
                // Decorative: the heading below carries the category name, so
                // alt is intentionally empty to avoid screen-reader duplication.
                <div className="mb-5 shadow-lg">
                  <div className="relative aspect-3/2 overflow-hidden">
                    <ContentfulImage
                      src={thumbUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              <h2 className="mb-3 text-2xl font-bold leading-snug md:text-3xl">
                <Link
                  href={`/categories/${category.slug}`}
                  className="hover:text-brand-crimson transition-colors duration-200"
                >
                  {category.name}
                </Link>
              </h2>

              {category.description && (
                <p className="mb-5 text-lg leading-relaxed text-gray-600">
                  {category.description}
                </p>
              )}

              {posts.length > 0 ? (
                <>
                  <ul className="flex flex-col divide-y divide-gray-200 border-t border-gray-200">
                    {posts.map((post) => (
                      <li key={post.slug} className="py-4">
                        <Link
                          href={`/posts/${post.slug}`}
                          className="text-lg font-medium hover:text-brand-crimson transition-colors duration-200"
                        >
                          {post.title}
                        </Link>
                        <div className="mt-1 text-sm text-gray-500">
                          <DateComponent dateString={post.date} />
                        </div>
                        {post.excerpt && (
                          <p className="mt-1 text-base leading-relaxed text-gray-600 line-clamp-1">
                            {post.excerpt}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="mt-5 inline-block text-sm font-bold uppercase tracking-wide text-brand-crimson hover:underline"
                  >
                    See all in {category.name} &rarr;
                  </Link>
                </>
              ) : (
                <p className="text-lg text-gray-500">No posts here yet.</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
