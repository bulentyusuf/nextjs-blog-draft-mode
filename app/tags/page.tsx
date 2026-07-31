import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import DateComponent from "../date";
import Container from "../container";
import Breadcrumb, { type Crumb } from "../breadcrumb";
import { getAllPosts, getAllTags } from "@/lib/api";
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

  // Posts grouped in memory. Contentful's GraphQL cannot filter on an
  // Array<Link> field, and the linkedFrom workaround has no ordering, so a
  // per-tag query could not preserve date_DESC. getAllPosts already sorts.
  //
  // Descriptions come from a second query rather than riding on every post's
  // tagsCollection, which would weigh down the home page, feed and sitemap for
  // one page's benefit. Joined by slug below.
  const [posts, allTags] = await Promise.all([
    getAllPosts(isEnabled),
    getAllTags(isEnabled),
  ]);
  const groups = groupPostsByTag(posts);
  const descriptions = new Map(
    allTags.map((tag) => [tag.slug, tag.description]),
  );

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "Tags" }];

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mb-8 md:mb-10">
        <h1 className="mb-3 text-4xl leading-tight md:text-5xl lg:text-6xl">
          Tags
        </h1>
        {/* Not the metadata description: that one is written for search
            results and repeats the site name, which reads oddly next to the
            h1 and collides with the full stop in "Be Useful." */}
        <p className="max-w-3xl text-lg leading-relaxed text-brand-muted text-pretty">
          Categories say where a post lives; tags say what it is about, so a
          post can carry up to three. A tag appears here once{" "}
          {MIN_POSTS_PER_TAG} posts share it.
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
          {/* No jump list. It was compensating for a page with nothing to read
              on it: twelve anchors is not much to scroll past, and it repeated
              the counts each section states anyway. */}
          {groups.map(({ tag, posts: tagged }) => (
            <section
              key={tag.slug}
              // scroll-mt clears the sticky header when a pill lands here, the
              // same offset prose headings use on a post page.
              id={tag.slug}
              className="mb-10 scroll-mt-20 last:mb-0"
            >
              {/* Smaller than the archive's year headings and in body ink
                  rather than muted. A year is wayfinding, so it recedes; a tag
                  name is the subject of its section, so it reads as a term in a
                  glossary with the gloss directly beneath. */}
              <h2 className="mb-1 flex items-baseline gap-x-3 text-xl md:text-2xl">
                {tag.name}
                <span className="font-sans text-sm font-normal text-brand-muted tabular-nums">
                  {tagged.length} {tagged.length === 1 ? "post" : "posts"}
                </span>
              </h2>
              {descriptions.get(tag.slug) && (
                <p className="mb-4 max-w-3xl leading-relaxed text-brand-muted text-pretty">
                  {descriptions.get(tag.slug)}
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
