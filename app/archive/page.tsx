import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import DateComponent from "../date";
import Container from "../container";
import Breadcrumb, { type Crumb } from "../breadcrumb";
import ContentfulImage from "@/lib/contentful-image";
import { getAllPosts } from "@/lib/api";
import type { ListPost } from "@/lib/types";
import { SITE_TITLE, SITE_URL, DEFAULT_OG_LOCALE } from "@/lib/constants";

const archiveDescription = `Every post on ${SITE_TITLE}, grouped by year.`;

export const metadata: Metadata = {
  title: "Archive",
  description: archiveDescription,
  alternates: { canonical: `${SITE_URL}/archive` },
  openGraph: {
    description: archiveDescription,
    url: `${SITE_URL}/archive`,
    siteName: SITE_TITLE,
    images: [{ url: "/be_useful.jpg", width: 1200, height: 630, alt: SITE_TITLE }],
    type: "website",
    locale: DEFAULT_OG_LOCALE,
  },
  twitter: {
    card: "summary_large_image",
    description: archiveDescription,
    images: ["/be_useful.jpg"],
  },
};

export default async function ArchivePage() {
  const { isEnabled } = await draftMode();

  // getAllPosts returns ListPost[] already ordered date_DESC.
  const posts = await getAllPosts(isEnabled);

  // Group by year, preserving the incoming date_DESC order. Because posts is
  // already newest-first, each year's array is newest-first too — no re-sort.
  const byYear = new Map<number, ListPost[]>();
  for (const post of posts) {
    const year = new Date(post.date).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(post);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a); // newest year first

  // Oldest post anchors the header strapline. posts is date_DESC, so it is
  // the final item.
  const oldest = posts.length > 0 ? posts[posts.length - 1] : undefined;

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "Archive" }];

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mb-8 md:mb-10">
        <h1 className="mb-3 text-4xl leading-tight md:text-5xl lg:text-6xl">
          Archive
        </h1>
        {oldest && (
          <p className="max-w-3xl text-lg leading-relaxed text-brand-muted">
            {posts.length} {posts.length === 1 ? "post" : "posts"} since{" "}
            {format(new Date(oldest.date), "LLLL yyyy", { locale: enGB })},
            newest first.
          </p>
        )}
      </header>

      {years.length === 0 ? (
        <p className="text-lg text-brand-muted">No posts yet.</p>
      ) : (
        years.map((year) => {
          const yearPosts = byYear.get(year)!;
          return (
            <section key={year} className="mb-12 last:mb-0">
              <h2 className="mb-5 flex items-baseline gap-x-4 text-5xl text-brand-muted md:text-6xl">
                {year}
                <span className="font-sans text-sm font-normal text-brand-muted">
                  {yearPosts.length} {yearPosts.length === 1 ? "post" : "posts"}
                </span>
              </h2>
              <ul className="space-y-3">
                {yearPosts.map((post) => (
                  <li
                    key={post.slug}
                    className="group relative flex flex-col gap-y-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-6"
                  >
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="hover:text-brand-crimson transition-colors duration-200"
                      >
                        {post.title}
                      </Link>
                      {post.category && (
                        <span className="text-xs uppercase tracking-wide text-brand-muted">
                          {post.category.name}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-brand-muted sm:text-right">
                      <DateComponent dateString={post.date} formatString="d MMM" />
                    </span>
                    {post.coverImage && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-full right-0 z-10 mb-3 hidden w-60 overflow-hidden rounded-lg shadow-lg group-focus-within:block pointer-fine:group-hover:block"
                      >
                        <ContentfulImage
                          alt=""
                          src={post.coverImage.url}
                          width={240}
                          height={135}
                          sizes="240px"
                          className="block h-auto w-full"
                        />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </Container>
  );
}
