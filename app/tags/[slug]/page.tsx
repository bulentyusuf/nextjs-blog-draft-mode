import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import Container from "../../container";
import MoreStories from "../../more-stories";
import Pagination from "../../pagination";
import Breadcrumb, { type Crumb } from "../../breadcrumb";
import { getAllPosts, getTagBySlug } from "@/lib/api";
import { postsWithTag, visibleTagSlugs } from "@/lib/tags";
import {
  POSTS_PER_PAGE,
  SITE_TITLE,
  SITE_URL,
  DEFAULT_OG_LOCALE,
} from "@/lib/constants";
import { widont } from "@/lib/typography";

// Allow on-demand rendering of tags that clear the threshold after build time,
// so a tag reaching its second post doesn't 404 until the next deploy.
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only tags the glossary shows. A tag below MIN_POSTS_PER_TAG has no pill and
  // no glossary entry, so a page for it would be unreachable from anywhere on
  // the site — and the page below 404s for exactly the same reason.
  const posts = await getAllPosts(false);
  return [...visibleTagSlugs(posts)].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const { slug } = await params;
  const tag = await getTagBySlug(slug, isEnabled);

  if (!tag) {
    return { title: "Tag not found" };
  }

  const description =
    tag.description || `Posts tagged ${tag.name} on ${SITE_TITLE}`;
  const canonical = `${SITE_URL}/tags/${slug}`;

  return {
    title: tag.name,
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
      title: tag.name,
      description,
      images: ["/be_useful.jpg"],
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { isEnabled } = await draftMode();
  const { slug } = await params;

  const tag = await getTagBySlug(slug, isEnabled);
  if (!tag) {
    notFound();
  }

  // One fetch, read twice. The threshold check needs the sitewide list and the
  // post list is a filter over that same result, so fetching for each was two
  // identical requests — getAllPosts is not cache()-wrapped.
  const allPosts = await getAllPosts(isEnabled);
  const visible = visibleTagSlugs(allPosts);

  // A tag below the threshold is hidden from the glossary and renders no pills,
  // so serving a page for it would strand a URL nothing links to. One rule, and
  // it lives in visibleTagSlugs rather than here.
  if (!visible.has(slug)) {
    notFound();
  }

  const posts = postsWithTag(allPosts, slug);

  // Every post on this page carries this tag, so a pill repeating it on each
  // card says nothing. The other tags a post carries are still worth showing —
  // they are the reason a reader might leave sideways rather than down.
  const otherTags = new Set([...visible].filter((s) => s !== slug));

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Tags", href: "/tags" },
    { label: tag.name },
  ];

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const pagePosts = posts.slice(0, POSTS_PER_PAGE);

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mx-auto max-w-5xl mb-6 md:mb-8">
        <h1 className="mb-3 text-4xl leading-tight md:text-5xl lg:text-6xl text-pretty">
          {widont(tag.name)}
        </h1>
        {tag.description && (
          <p className="max-w-3xl text-lg leading-relaxed text-brand-muted text-pretty">
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
        currentPage={1}
        totalPages={totalPages}
        basePath={`/tags/${slug}`}
      />
    </Container>
  );
}
