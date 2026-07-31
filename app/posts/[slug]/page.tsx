import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import Container from "../../container";
import MoreStories from "../../more-stories";
import Avatar from "../../avatar";
import Date from "../../date";
import CoverImage from "../../cover-image";
import { RichText } from "@/lib/rich-text";
import { getAllPosts, getPostAndMorePosts } from "@/lib/api";
import { postTags, visibleTagSlugs } from "@/lib/tags";
import { extractHeadings } from "@/lib/headings";
import { readingTimeMinutes } from "@/lib/reading-time";
import { highlightCodeBlocks } from "@/lib/highlight";
import TableOfContents from "../../table-of-contents";
import ExploreWithAI from "../../explore-with-ai";
import AuthorBioCard from "../../author-bio-card";
import Breadcrumb, { type Crumb } from "../../breadcrumb";
import {
  SITE_URL,
  SITE_AUTHOR,
  SITE_TITLE,
  DEFAULT_OG_LOCALE,
} from "@/lib/constants";
import { jsonLdHtml } from "@/lib/json-ld";
import { widont } from "@/lib/typography";

export async function generateStaticParams() {
  const allPosts = await getAllPosts(false);
  return allPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { isEnabled } = await draftMode();
  const { slug } = await params;
  // Deliberately the same call the page component makes below, not the slimmer
  // getPost. Both are wrapped in React's cache(), so the two run once per
  // request and the page reuses this result instead of refetching. Calling
  // getPost here would be a smaller query but a second one, since cache() only
  // dedupes identical calls — which is how this page ended up issuing two
  // requests for one post. getPost is still the right helper where nothing else
  // fetches the post in the same pass, as in opengraph-image.tsx.
  const { post } = await getPostAndMorePosts(slug, isEnabled);

  if (!post) {
    return { title: "Post not found" };
  }

  const canonical = `${SITE_URL}/posts/${slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical },
    // The og:image (and the Twitter image Next derives from it) now comes from
    // the colocated opengraph-image route, which generates a branded card and
    // takes precedence over config-based metadata — so no images are set here.
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updatedDate ?? post.date,
      url: canonical,
      siteName: SITE_TITLE,
      locale: DEFAULT_OG_LOCALE,
      authors: post.author?.slug
        ? [`${SITE_URL}/authors/${post.author.slug}`]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { isEnabled } = await draftMode();
  const { slug } = await params;
  // getAllPosts alongside the post itself, because a pill may only render if
  // its tag clears the threshold across the whole site, and that count cannot
  // be derived from one post. The list fragment omits every post body, and the
  // response is ISR-cached under the same "posts" tag as everything else, so
  // this costs one slim cached query rather than a second body fetch.
  const [{ post, morePosts }, allPosts] = await Promise.all([
    getPostAndMorePosts(slug, isEnabled),
    getAllPosts(isEnabled),
  ]);

  if (!post) {
    notFound();
  }

  const visible = visibleTagSlugs(allPosts);
  const tags = postTags(post).filter((t) => visible.has(t.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage
      ? `${post.coverImage.url}?w=1200&h=630&fit=fill&fm=jpg&q=80`
      : `${SITE_URL}/be_useful.jpg`,
    datePublished: post.date,
    dateModified: post.updatedDate ?? post.date,
    author: {
      "@type": "Person",
      name: post.author?.name || SITE_AUTHOR,
      ...(post.author?.slug
        ? { url: `${SITE_URL}/authors/${post.author.slug}` }
        : {}),
    },
    publisher: {
      "@type": "Person",
      name: SITE_AUTHOR,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/posts/${slug}`,
    },
  };

  const showUpdated = post.updatedDate && post.updatedDate !== post.date;
  const minutes = readingTimeMinutes(post.content.json);

  // Byline sub-line: lead with the published date (matches the index cards),
  // flag the revision on mobile, show the full updated date on desktop, then
  // the estimated reading time.
  const dateline = (
    <span className="tabular-nums">
      <Date dateString={post.date} />
      {showUpdated && (
        <>
          <span className="md:hidden"> (updated)</span>
          <span className="hidden md:inline">
            {" · "}Updated <Date dateString={post.updatedDate!} />
          </span>
        </>
      )}
      {" · "}
      {minutes} min read
    </span>
  );

  const headings = extractHeadings(post.content.json);
  const highlighted = await highlightCodeBlocks(post.content);

  const crumbs: Crumb[] = post.category
    ? [
        { label: "Home", href: "/" },
        { label: "Categories", href: "/categories" },
        {
          label: post.category.name,
          href: `/categories/${post.category.slug}`,
        },
        { label: post.title },
      ]
    : [{ label: "Home", href: "/" }, { label: post.title }];

  return (
    <Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      {/* data-pagefind-body scopes the Pagefind index to post content only.
          Pages without this attribute are excluded from search entirely.
          data-pagefind-meta="url" records the clean, extensionless route as the
          result URL: Pagefind indexes the prerendered `<slug>.html` files, so
          its derived url carries a `.html` that 404s on Next's routes. The
          Component UI has no JS layer to rewrite it, so the fix lives in the
          index — the result template reads `meta.url` in preference to that
          derived url. */}
      <article
        data-pagefind-body
        data-pagefind-meta="url[data-url]"
        data-url={`/posts/${slug}`}
        className="mx-auto max-w-5xl"
      >
        <Breadcrumb items={crumbs} />
        <h1 className="mb-8 text-4xl leading-tight md:text-5xl lg:text-6xl text-pretty">
          {widont(post.title)}
        </h1>
        {post.coverImage && (
          <div className="mb-10">
            <CoverImage
              title={post.title}
              url={post.coverImage.url}
              wide
              priority
              transitionName={`cover-${post.slug}`}
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          </div>
        )}
        {/*
          Grid begins AFTER the cover image. The header block above
          (category, title, image) is full-width.
          Below xl: single column — standfirst, then byline (with date), then body.
          At xl+: sidebar (TOC + AI) in the left track, content in the right.
        */}
        <div className="xl:grid xl:grid-cols-[1fr_3fr] xl:gap-x-10">
          {/* Sidebar zone — TOC always rendered (collapsed disclosure on
              mobile, sticky open panel at xl+). ExploreWithAI stays xl-only
              per the separate mobile-AI decision. */}
          {/* TOC repeats every heading; excluded so headings are not
              double-weighted in search. */}
          <aside data-pagefind-ignore className="mb-4 xl:mb-0">
            <div className="xl:sticky xl:top-20 space-y-8 xl:pb-4">
              <TableOfContents headings={headings} />
              <div className="hidden xl:block">
                <ExploreWithAI slug={slug} />
              </div>
            </div>
          </aside>

          <div className="mx-auto max-w-2xl xl:mx-0">
            <p className="mb-8 text-lg leading-relaxed text-brand-muted text-pretty">
              {post.excerpt}
            </p>
            {post.author && (
              <div className="mb-10">
                <Avatar
                  name={post.author.name}
                  slug={post.author.slug}
                  picture={post.author.picture}
                  meta={dateline}
                />
              </div>
            )}
            {/* text-pretty on the prose container inherits into every child —
                paragraphs and in-body headings alike — so line breaking just
                avoids a lone last word, without the aggressive re-balancing of
                text-wrap: balance. One class covers the whole article body. */}
            <div className="prose text-pretty prose-headings:scroll-mt-20 prose-h2:text-[1.75em] prose-h3:text-[1.375em] prose-h4:text-[1.15em]">
              <RichText
                content={post.content}
                headings={headings}
                highlighted={highlighted}
              />
            </div>
            {/* Below the body rather than in the sidebar: the sidebar is
                xl-and-up only, so tags placed there would vanish on the
                viewports most people read on. Every pill links into the /tags
                glossary, and only tags that clear the threshold are rendered —
                a hidden tag would otherwise link to an anchor that is not on
                that page. */}
            {tags.length > 0 && (
              <nav
                aria-label="Tags"
                className="mt-12 border-t border-hairline pt-6"
              >
                {/* The label is sentence case and unstyled while the tags are
                    bordered, so "Tagged" cannot be mistaken for a third tag.
                    All three were previously uppercase muted text, which made
                    the label look like one of them and gave the links no
                    affordance at all. */}
                <ul className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  <li className="mr-1 text-sm text-brand-muted">Tagged</li>
                  {tags.map((tag) => (
                    <li key={tag.slug}>
                      <Link
                        href={`/tags#${tag.slug}`}
                        className="inline-block rounded-full border border-hairline px-3 py-1 text-sm text-brand-muted transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson"
                      >
                        {tag.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {post.author?.bio && (
              <div className="mt-12 border-t border-hairline pt-8">
                <AuthorBioCard author={post.author} />
              </div>
            )}
          </div>
        </div>
      </article>
      <div className="mt-section">
        <MoreStories morePosts={morePosts} variant="grid" heading="Read Next" />
      </div>
    </Container>
  );
}
