import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import DateComponent from "../date";
import { getAllCategories, getRecentPostsByCategory } from "@/lib/api";
import { SITE_TITLE } from "@/lib/constants";

// How many recent posts to tease under each category. The full list lives on
// the individual category page (/categories/[slug]).
const PREVIEW_COUNT = 4;

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
    <div className="max-w-5xl mx-auto px-5 pt-8 pb-12">
      <header className="mb-16 md:mb-20">
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

      <div className="flex flex-col gap-16 md:gap-24">
        {categories.map((category) => {
          const posts = postsBySlug.get(category.slug) ?? [];
          return (
            <article key={category.slug}>
              <h2 className="mb-2 text-3xl font-bold tracking-tighter leading-tight md:text-4xl">
                <Link
                  href={`/categories/${category.slug}`}
                  className="hover:text-brand-crimson transition-colors duration-200"
                >
                  {category.name}
                </Link>
              </h2>

              {category.description && (
                <p className="mb-6 max-w-2xl text-lg leading-relaxed text-gray-600">
                  {category.description}
                </p>
              )}

              {posts.length > 0 ? (
                <>
                  <ul className="flex flex-col divide-y divide-gray-200 border-t border-gray-200">
                    {posts.map((post) => (
                      <li key={post.slug} className="py-3">
                        <Link
                          href={`/posts/${post.slug}`}
                          className="group flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between"
                        >
                          <span className="text-lg font-medium transition-colors duration-200 group-hover:text-brand-crimson">
                            {post.title}
                          </span>
                          <span className="text-sm text-gray-500 md:shrink-0 md:pl-6">
                            <DateComponent dateString={post.date} />
                          </span>
                        </Link>
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
