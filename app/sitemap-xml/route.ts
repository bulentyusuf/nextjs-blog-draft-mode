import {
  getAllPosts,
  getAllPages,
  getAllCategories,
  getAllAuthors,
} from "@/lib/api";
import { SITE_URL } from "@/lib/constants";
import { escapeXml } from "@/lib/xml";
import type { Post } from "@/lib/types";

// Served at /sitemap.xml via a rewrite in next.config.js. This handler lives on
// an ordinary path (/sitemap-xml) on purpose. Next treats the reserved
// /sitemap.xml route as a special metadata route handler whose cache entry does
// not carry our explicit fetch tags, so revalidateTag("posts") never reaches it
// there. On an ordinary path it behaves like /feed.xml, its cache entry carries
// the posts tag, and the publish webhook's revalidateTag("posts") busts it on
// demand. revalidate is the daily self-heal fallback.
export const revalidate = 86400;

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
};

// toISOString throws RangeError on an invalid date, and a throw inside this
// render makes Next serve the last good copy, which silently freezes the
// sitemap. feed.xml uses toUTCString, which returns a harmless string instead,
// which is why it never hit this. Clamp an unparseable date to the epoch.
const safeIso = (d: Date): string =>
  Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();

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
    <lastmod>${safeIso(entry.lastModified)}</lastmod>
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
