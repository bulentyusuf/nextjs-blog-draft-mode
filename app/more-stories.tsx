import Link from "next/link";
import DateComponent from "./date";
import CoverImage from "./cover-image";
import TagPill from "./tag-pill";
import type { CardPost, CoverImage as CoverImageType, Tag } from "@/lib/types";
import { createCoverNamer } from "@/lib/view-transition-name";
import { postTags } from "@/lib/tags";
import { widont } from "@/lib/typography";

type Variant = "grid" | "list";

// Pills sit below the excerpt, not above the title. Above it they would be the
// first interactive thing in the card and would route the reader away from the
// listing before they reached the headline; worse, the count varies from one to
// three and wraps at three, so they would push each title down by a different
// amount and titles would stop aligning with the top of their cover images.
// Below the excerpt that variability lands at the foot of the card, where
// nothing depends on it.
//
// aria-label rather than a visible "Tagged" label. The post page carries one
// because it appears once there; repeated down a listing it is five identical
// labels of pure noise, and the pill shape already reads as a tag. Screen
// readers still need the row named, hence the label — without it this is an
// unexplained list of links on every card.
function TagRow({ tags, className }: { tags: Tag[]; className: string }) {
  if (tags.length === 0) return null;

  return (
    <ul aria-label="Tags" className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <li key={tag.slug}>
          <TagPill tag={tag} size="compact" />
        </li>
      ))}
    </ul>
  );
}

function PostPreview({
  title,
  coverImage,
  date,
  excerpt,
  slug,
  variant,
  priority = false,
  as = "h3",
  transitionName,
  tags = [],
}: {
  title: string;
  coverImage?: CoverImageType;
  date: string;
  excerpt: string;
  slug: string;
  variant: Variant;
  priority?: boolean;
  as?: "h2" | "h3";
  transitionName?: string;
  tags?: Tag[];
}) {
  const Heading = as;

  if (variant === "list") {
    return (
      <article className="grid grid-cols-1 gap-5 py-10 first:pt-0 md:grid-cols-[2fr_3fr] md:gap-8 md:items-start md:py-12 md:first:pt-0">
        {coverImage && (
          <div>
            <CoverImage
              slug={slug}
              url={coverImage.url}
              priority={priority}
              hover
              transitionName={transitionName}
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        )}
        <div>
          <Heading className="text-2xl md:text-3xl mb-2 leading-snug text-pretty">
            <Link
              href={`/posts/${slug}`}
              className="hover:text-brand-crimson transition-colors duration-200"
            >
              {widont(title)}
            </Link>
          </Heading>
          <div className="text-sm text-brand-muted mb-3 tabular-nums">
            <DateComponent dateString={date} />
          </div>
          <p className="text-lg leading-relaxed text-pretty">{excerpt}</p>
          <TagRow tags={tags} className="mt-3" />
        </div>
      </article>
    );
  }

  return (
    <div>
      {coverImage && (
        <div className="mb-4">
          <CoverImage
            slug={slug}
            url={coverImage.url}
            priority={priority}
            hover
            transitionName={transitionName}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 450px"
          />
        </div>
      )}
      <Heading className="text-3xl mb-3 leading-snug text-pretty">
        <Link
          href={`/posts/${slug}`}
          className="hover:text-brand-crimson transition-colors duration-200"
        >
          {widont(title)}
        </Link>
      </Heading>
      <div className="text-sm text-brand-muted mb-4 tabular-nums">
        <DateComponent dateString={date} />
      </div>
      <p className="text-lg leading-relaxed text-pretty">{excerpt}</p>
      <TagRow tags={tags} className="mt-4" />
    </div>
  );
}

export default function MoreStories({
  morePosts,
  variant = "list",
  heading,
  priorityFirst = false,
  coverName = createCoverNamer(),
  visibleTags,
}: {
  morePosts: CardPost[];
  variant?: Variant;
  heading: string | null;
  // When true, the first post's cover image is fetched with priority. Use on
  // heroless listing pages (index page 2+, category pages) where that image is
  // the LCP. Leave false where a hero already owns priority (index page 1).
  priorityFirst?: boolean;
  // Per-render view-transition-name allocator. Pages with a hero pass their own
  // namer so the hero and any repeated card share one name only once (see
  // lib/view-transition-name.ts). Standalone listings get a fresh namer by
  // default, which is enough to dedupe within this list.
  coverName?: (slug: string) => string | undefined;
  // Pass to show tag pills; omit for no pills. It is the visibility set rather
  // than a boolean on purpose: a pill links to `/tags/[slug]`, and that route
  // 404s for a tag below MIN_POSTS_PER_TAG, so an unfiltered pill can point at
  // a dead URL. Requiring the set makes it impossible to switch pills on
  // without deciding that question.
  //
  // A tag page passes this set minus its own slug: every post there carries
  // that tag, so repeating it on each card says nothing.
  //
  // The set must be computed from ALL posts, via visibleTagSlugs(getAllPosts()).
  // Deriving it from the posts on one category or author page counts a subset
  // and would hide tags the glossary shows.
  visibleTags?: Set<string>;
}) {
  const container =
    variant === "list"
      ? "flex flex-col divide-y divide-hairline"
      : "grid grid-cols-1 md:grid-cols-2 md:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32";

  // When the section renders its own h2 heading, post titles sit one level
  // below it (h3). With no section heading, the page h1 is the parent, so post
  // titles step up to h2 to avoid skipping a level.
  const titleAs = heading ? "h3" : "h2";

  return (
    <section className="mx-auto max-w-5xl">
      {heading && (
        <h2 className="mb-8 text-4xl md:text-5xl leading-tight text-pretty">
          {widont(heading)}
        </h2>
      )}
      <div className={container}>
        {morePosts.map((post, i) => (
          <PostPreview
            key={post.slug}
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            slug={post.slug}
            excerpt={post.excerpt}
            variant={variant}
            priority={priorityFirst && i === 0}
            as={titleAs}
            transitionName={coverName(post.slug)}
            tags={
              visibleTags
                ? postTags(post).filter((t) => visibleTags.has(t.slug))
                : []
            }
          />
        ))}
      </div>
    </section>
  );
}
