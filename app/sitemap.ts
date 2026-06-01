import { MetadataRoute } from "next";
import { getAllPosts, getAllPages, getAllCategories } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";
import type { Post } from "@/lib/types";

// On-demand revalidation via the Contentful webhook is the fast path, but a
// statically built metadata sitemap does not reliably respond to it, so this
// daily ISR interval is the self-heal fallback for when the webhook fails to
// propagate. The webhook stays the instant path on publish.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages, categories] = await Promise.all([
    getAllPosts(false),
    getAllPages(false),
    getAllCategories(false),
  ]);

  const postDate = (post: Post): Date => new Date(post.updatedDate ?? post.date);

  // getAllPosts orders date_DESC, so posts[0] is the freshest sitewide entry.
  const newestSitewide = posts.length ? postDate(posts[0]) : new Date();

  // Freshest post per category slug, so each category page reports a real
  // lastModified instead of the render time.
  const newestByCategory = new Map<string, Date>();
  for (const post of posts) {
    const slug = post.category?.slug;
    if (!slug) continue;
    const date = postDate(post);
    const current = newestByCategory.get(slug);
    if (!current || date > current) newestByCategory.set(slug, date);
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: postDate(post),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const pageEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: new Date(
      page.sys.publishedAt ?? page.sys.firstPublishedAt ?? Date.now(),
    ),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: newestByCategory.get(category.slug) ?? newestSitewide,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: newestSitewide,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: newestSitewide,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...pageEntries,
    ...categoryEntries,
    ...postEntries,
  ];
}
