import { MetadataRoute } from "next";
import { getAllPosts, getAllPages } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages] = await Promise.all([
    getAllPosts(false),
    getAllPages(false),
  ]);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.updatedDate ?? post.date),
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

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...pageEntries,
    ...postEntries,
  ];
}
