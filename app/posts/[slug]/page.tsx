import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import MoreStories from "../../more-stories";
import Avatar from "../../avatar";
import Date from "../../date";
import CoverImage from "../../cover-image";
import { RichText } from "@/lib/rich-text";
import { getAllPosts, getPostAndMorePosts } from "@/lib/api";
import { extractHeadings } from "@/lib/headings";
import TableOfContents from "../../table-of-contents";
import { SITE_URL, SITE_AUTHOR, SITE_TITLE } from "@/lib/constants";

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
  const { post } = await getPostAndMorePosts(slug, isEnabled);

  if (!post) {
    return { title: "Post not found" };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updatedDate ?? post.date,
      images: post.coverImage
        ? [
            {
              url: `${post.coverImage.url}?w=1200&fm=jpg&q=80`,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage
        ? [`${post.coverImage.url}?w=1200&fm=jpg&q=80`]
        : [],
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
  const { post, morePosts } = await getPostAndMorePosts(slug, isEnabled);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage
      ? `${post.coverImage.url}?w=1200&fm=jpg&q=80`
      : undefined,
    datePublished: post.date,
    dateModified: post.updatedDate ?? post.date,
    author: {
      "@type": "Person",
      name: post.author?.name || SITE_AUTHOR,
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

  const headings = extractHeadings(post.content.json);

  return (
    <div className="max-w-5xl mx-auto px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-5xl pt-12">
        <div className="mb-4 text-sm text-gray-500">
  <span>Published <Date dateString={post.date} /></span>
  {showUpdated && (
    <span className="hidden md:inline ml-1">
      · Updated <Date dateString={post.updatedDate!} />
    </span>
  )}
</div>
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl">
          {post.title}
        </h1>
        {post.author && (
          <div className="mb-6">
            <Avatar name={post.author.name} picture={post.author.picture} />
          </div>
        )}
        {post.coverImage && (
          <div className="mb-10">
            <CoverImage
              title={post.title}
              url={post.coverImage.url}
              wide
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          </div>
        )}
        {/*
          Grid begins AFTER the cover image. The header block above
          (date, title, byline, image) is unchanged and full-width.
          Below xl: single column, body renders exactly as before.
          At xl+: sidebar in the left track, body in the right.
        */}
        <div className="xl:grid xl:grid-cols-[1fr_3fr] xl:gap-x-10">
          {/* Sidebar zone — empty placeholder for the shell.
              Hidden below xl; TOC/AI will live here at xl+. */}
          <aside className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto pb-4">
               <TableOfContents headings={headings} />
            </div>
          </aside>

          <div className="mx-auto max-w-2xl xl:mx-0 pb-28">
            <p className="mb-8 text-lg italic leading-relaxed text-gray-600">
              {post.excerpt}
            </p>
            <div className="prose prose-headings:scroll-mt-20">
              <RichText content={post.content} />
            </div>
          </div>
        </div>
      </article>
      <hr className="border-accent-2 mt-0 mb-24" />
      <MoreStories morePosts={morePosts} />
    </div>
  );
}
