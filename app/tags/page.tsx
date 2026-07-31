import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import DateComponent from "../date";
import Container from "../container";
import Breadcrumb, { type Crumb } from "../breadcrumb";
import { getAllPosts } from "@/lib/api";
import { groupPostsByTag, MIN_POSTS_PER_TAG } from "@/lib/tags";
import { SITE_TITLE, SITE_URL, DEFAULT_OG_LOCALE } from "@/lib/constants";
import { widont } from "@/lib/typography";

const tagsDescription = `Every topic on ${SITE_TITLE}, with the posts filed under each.`;

export const metadata: Metadata = {
  title: "Tags",
  description: tagsDescription,
  alternates: { canonical: `${SITE_URL}/tags` },
  openGraph: {
    description: tagsDescription,
    url: `${SITE_URL}/tags`,
    siteName: SITE_TITLE,
    images: [
      { url: "/be_useful.jpg", width: 1200, height: 630, alt: SITE_TITLE },
    ],
    type: "website",
    locale: DEFAULT_OG_LOCALE,
  },
  twitter: {
    card: "summary_large_image",
    description: tagsDescription,
    images: ["/be_useful.jpg"],
  },
};

export default async function TagsPage() {
  const { isEnabled } = await draftMode();

  // One query, grouped in memory. Contentful's GraphQL cannot filter on an
  // Array<Link> field, and the linkedFrom workaround has no ordering, so a
  // per-tag query could not preserve date_DESC. getAllPosts already sorts.
  const posts = await getAllPosts(isEnabled);
  const groups = groupPostsByTag(posts);

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "Tags" }];

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mb-8 md:mb-10">
        <h1 className="mb-3 text-4xl leading-tight md:text-5xl lg:text-6xl">
          Tags
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-brand-muted text-pretty">
          Categories say where a post lives; tags say what it is about, so a
          post can carry up to three. {tagsDescription}
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="text-lg text-brand-muted">
          No tags yet. A tag appears here once {MIN_POSTS_PER_TAG} posts carry
          it.
        </p>
      ) : (
        // The glossary repeats every post title up to three times, once per tag
        // it carries. Pagefind indexes whatever it is given, so without this the
        // same titles would be weighted several times over and outrank the posts
        // themselves. Same reasoning as the table of contents on a post page.
        <div data-pagefind-ignore>
          {/* An index to the index. With a dozen tags the page is long enough
              that landing on it without a way to skip ahead is a chore, and it
              doubles as the destination for every tag pill on the site. */}
          <nav aria-label="Jump to a tag" className="mb-10 md:mb-12">
            <ul className="flex flex-wrap gap-x-3 gap-y-2">
              {groups.map(({ tag, posts: tagged }) => (
                <li key={tag.slug}>
                  <Link
                    href={`#${tag.slug}`}
                    className="text-sm uppercase tracking-wide text-brand-muted transition-colors duration-200 hover:text-brand-crimson"
                  >
                    {tag.name}
                    <span className="ml-1 tabular-nums">({tagged.length})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {groups.map(({ tag, posts: tagged }) => (
            <section
              key={tag.slug}
              // scroll-mt clears the sticky header when a pill lands here, the
              // same offset prose headings use on a post page.
              id={tag.slug}
              className="mb-10 scroll-mt-20 last:mb-0"
            >
              <h2 className="mb-2 flex items-baseline gap-x-3 text-2xl text-brand-muted md:text-3xl">
                {tag.name}
                <span className="font-sans text-sm font-normal text-brand-muted tabular-nums">
                  {tagged.length} {tagged.length === 1 ? "post" : "posts"}
                </span>
              </h2>
              {tag.description && (
                <p className="mb-4 max-w-3xl leading-relaxed text-brand-muted text-pretty">
                  {tag.description}
                </p>
              )}
              <ul className="space-y-3 border-t border-hairline pt-4">
                {tagged.map((post) => (
                  <li
                    key={post.slug}
                    className="flex flex-col gap-y-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-6"
                  >
                    <Link
                      href={`/posts/${post.slug}`}
                      className="hover:text-brand-crimson transition-colors duration-200"
                    >
                      {widont(post.title)}
                    </Link>
                    <span className="shrink-0 text-sm tabular-nums text-brand-muted sm:text-right">
                      <DateComponent dateString={post.date} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
