import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Container from "../../../../container";
import MoreStories from "../../../../more-stories";
import Pagination from "../../../../pagination";
import PageContext from "../../../../page-context";
import Breadcrumb, { type Crumb } from "../../../../breadcrumb";
import { getAllPosts, getPostsByTag, getTagBySlug } from "@/lib/api";
import { visibleTagSlugs } from "@/lib/tags";
import {
  POSTS_PER_PAGE,
  SITE_TITLE,
  SITE_URL,
  DEFAULT_OG_LOCALE,
} from "@/lib/constants";
import { widont } from "@/lib/typography";

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts(false);
  const visible = [...visibleTagSlugs(posts)];

  // No extra fetch per tag, unlike the category equivalent: getPostsByTag
  // filters the same getAllPosts result, so the counts are already here.
  return visible.flatMap((slug) => {
    const count = posts.filter((post) =>
      (post.tagsCollection?.items ?? []).some((t) => t.slug === slug),
    ).length;
    const totalPages = Math.max(1, Math.ceil(count / POSTS_PER_PAGE));
    const params: { slug: string; page: string }[] = [];
    for (let p = 2; p <= totalPages; p++) {
      params.push({ slug, page: String(p) });
    }
    return params;
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const { slug, page } = await params;
  const tag = await getTagBySlug(slug, isEnabled);

  if (!tag) {
    return { title: "Tag not found" };
  }

  const title = `${tag.name}, Page ${page}`;
  const description =
    tag.description || `Posts tagged ${tag.name} on ${SITE_TITLE}`;
  const canonical = `${SITE_URL}/tags/${slug}/page/${page}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      description,
      url: canonical,
      siteName: SITE_TITLE,
      images: [
        { url: "/be_useful.jpg", width: 1200, height: 630, alt: SITE_TITLE },
      ],
      type: "website",
      locale: DEFAULT_OG_LOCALE,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/be_useful.jpg"],
    },
  };
}

export default async function TagPaginatedPage({
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
  // Page 1 has a single canonical home at /tags/<slug>.
  if (pageNumber === 1) {
    redirect(`/tags/${slug}`);
  }

  const tag = await getTagBySlug(slug, isEnabled);
  if (!tag) {
    notFound();
  }

  const allPosts = await getAllPosts(isEnabled);
  const visible = visibleTagSlugs(allPosts);
  if (!visible.has(slug)) {
    notFound();
  }

  const posts = await getPostsByTag(slug, isEnabled);
  const otherTags = new Set([...visible].filter((s) => s !== slug));

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Tags", href: "/tags" },
    { label: tag.name },
  ];

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));

  if (pageNumber > totalPages) {
    notFound();
  }

  const pagePosts = posts.slice(
    (pageNumber - 1) * POSTS_PER_PAGE,
    pageNumber * POSTS_PER_PAGE,
  );

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mx-auto max-w-5xl mb-6 md:mb-8">
        <h1 className="text-4xl leading-tight md:text-5xl lg:text-6xl text-pretty">
          {widont(tag.name)}
        </h1>
        <PageContext currentPage={pageNumber} totalPages={totalPages} />
        {tag.description && (
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-brand-muted text-pretty">
            {tag.description}
          </p>
        )}
      </header>

      <MoreStories
        morePosts={pagePosts}
        variant="list"
        heading={null}
        priorityFirst
        visibleTags={otherTags}
      />
      <Pagination
        currentPage={pageNumber}
        totalPages={totalPages}
        basePath={`/tags/${slug}`}
      />
    </Container>
  );
}
