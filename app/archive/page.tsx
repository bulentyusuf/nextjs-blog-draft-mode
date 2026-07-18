import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import DateComponent from "../date";
import Container from "../container";
import Breadcrumb, { type Crumb } from "../breadcrumb";
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

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "Archive" }];

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mb-6 md:mb-8">
        <h1 className="mb-6 text-4xl leading-tight md:text-5xl lg:text-6xl">
          Archive
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-brand-muted">
          Every post, oldest to newest.
        </p>
      </header>

      {years.length === 0 ? (
        <p className="text-lg text-brand-muted">No posts yet.</p>
      ) : (
        years.map((year) => (
          <section key={year} className="mb-10">
            <h2 className="mb-4 text-2xl">{year}</h2>
            <ul className="space-y-3">
              {byYear.get(year)!.map((post) => (
                <li
                  key={post.slug}
                  className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3"
                >
                  <Link
                    href={`/posts/${post.slug}`}
                    className="hover:text-brand-crimson transition-colors duration-200"
                  >
                    {post.title}
                  </Link>
                  <span className="shrink-0 text-sm text-brand-muted">
                    <DateComponent dateString={post.date} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Container>
  );
}
