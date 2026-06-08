import {
  getAllPosts,
  getAllPages,
  getAllCategories,
  getAllAuthors,
} from "@/lib/api";
import { SITE_URL } from "@/lib/constants";
import { escapeXml } from "@/lib/xml";
import type { Post } from "@/lib/types";

// On-demand revalidation via the Contentful webhook is the fast path. As a
// route handler this responds to revalidatePath("/sitemap.xml") immediately,
// the way feed.xml already does. This daily ISR interval is the self-heal
// fallback for when the webhook fails to propagate.
export const revalidate = 86400;

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
};

export async function GET() {
  const [posts, pages, categories, authors] = await Promise.all([
    getAllPosts(false),
    getAllPages(false),
    getAllCategories(false),
    getAllAuthors(false),
  ]);

  const postDate = (post: Post): Date =>
    new Date(post.updatedDate ?? post.date);

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

  // Same idea per author slug. Posts carry author.slug via POST_GRAPHQL_FIELDS.
  const newestByAuthor = new Map<string, Date>();
  for (const post of posts) {
    const slug = post.author?.slug;
    if (!slug) continue;
    const date = postDate(post);
    const current = newestByAuthor.get(slug);
    if (!current || date > current) newestByAuthor.set(slug, date);
  }

  const postEntries: SitemapEntry[] = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: postDate(post),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const pageEntries: SitemapEntry[] = pages.map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: new Date(
      page.sys.publishedAt ?? page.sys.firstPublishedAt ?? Date.now(),
    ),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const categoryEntries: SitemapEntry[] = categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: newestByCategory.get(category.slug) ?? newestSitewide,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const authorEntries: SitemapEntry[] = authors
    .filter((author) => author.slug)
    .map((author) => ({
      url: `${SITE_URL}/authors/${author.slug}`,
      lastModified: newestByAuthor.get(author.slug as string) ?? newestSitewide,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const entries: SitemapEntry[] = [
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
    {
      url: `${SITE_URL}/authors`,
      lastModified: newestSitewide,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...pageEntries,
    ...categoryEntries,
    ...authorEntries,
    ...postEntries,
  ];

  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}
