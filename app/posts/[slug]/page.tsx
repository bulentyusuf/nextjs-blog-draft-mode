import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import MoreStories from "../../more-stories";
import Avatar from "../../avatar";
import Date from "../../date";
import CoverImage from "../../cover-image";
import { RichText } from "@/lib/rich-text";
import { getAllPosts, getPostAndMorePosts } from "@/lib/api";
import { SITE_URL, SITE_AUTHOR } from "@/lib/constants";

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
      images: [
        {
          url: `${post.coverImage.url}?w=1200&fm=jpg&q=80`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`${post.coverImage.url}?w=1200&fm=jpg&q=80`],
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
    image: `${post.coverImage.url}?w=1200&fm=jpg&q=80`,
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

  const showUpdated =
    post.updatedDate && post.updatedDate !== post.date;

  return (
    <div className="container mx-auto px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="mb-20 mt-8 text-2xl font-bold leading-tight tracking-tight md:text-4xl md:tracking-tighter">
        <Link href="/" className="hover:underline">
          Fun with Gen AI
        </Link>
        .
      </h2>
      <article className="mx-auto max-w-4xl">
        {/* Date line */}
        <div className="mb-4 text-sm text-gray-500">
          <Date dateString={post.date} />
          {showUpdated && (
            <span className="ml-3">
              · Updated <Date dateString={post.updatedDate!} />
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl">
          {post.title}
        </h1>

        {/* Byline */}
        {post.author && (
          <div className="mb-8">
            <Avatar name={post.author.name} picture={post.author.picture} />
          </div>
        )}

        {/* Cover image — wider than prose, constrained to article width */}
        <div className="mb-8 aspect-[3/2] w-full overflow-hidden">
          <CoverImage
            title={post.title}
            url={post.coverImage.url}
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>

        {/* Standfirst */}
        <div className="mx-auto max-w-2xl">
          <p className="mb-8 border-l-2 border-gray-300 pl-4 text-xl font-light leading-relaxed text-gray-600">
            {post.excerpt}
          </p>

          {/* Body copy */}
          <div className="prose">
            <RichText content={post.content} />
          </div>
        </div>
      </article>

      <hr className="border-accent-2 mt-28 mb-24" />
      <MoreStories morePosts={morePosts} />
    </div>
  );
}
