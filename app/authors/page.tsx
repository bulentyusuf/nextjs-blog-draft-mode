import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import ContentfulImage from "@/lib/contentful-image";
import Container from "../container";
import Breadcrumb, { type Crumb } from "../breadcrumb";
import { RichText } from "@/lib/rich-text";
import { getAllAuthors, getAuthorBySlug } from "@/lib/api";
import { SITE_TITLE, SITE_URL } from "@/lib/constants";

const authorsDescription = `Meet the authors behind ${SITE_TITLE}`;

export const metadata: Metadata = {
  title: "Authors",
  description: authorsDescription,
  openGraph: {
    description: authorsDescription,
    url: `${SITE_URL}/authors`,
    siteName: SITE_TITLE,
    images: [{ url: "/be_useful.jpg", width: 1200, height: 630, alt: SITE_TITLE }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    description: authorsDescription,
    images: ["/be_useful.jpg"],
  },
};

export default async function AuthorsPage() {
  const { isEnabled } = await draftMode();

  const list = await getAllAuthors(isEnabled);
  // Each author's full record (with bio) in parallel, mirroring the categories
  // index fetching a preview per category.
  const authors = (
    await Promise.all(
      list.map((a) => getAuthorBySlug(a.slug as string, isEnabled)),
    )
  ).filter((a): a is NonNullable<typeof a> => Boolean(a));

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "Authors" }];

  return (
    <Container>
      <Breadcrumb items={crumbs} />
      <header className="mb-6 md:mb-8">
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tighter md:text-6xl">
          Authors
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
          Two of these are not real. The site never pretends otherwise.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-10">
        {authors.map((author) => (
          <article
            key={author.slug ?? author.name}
            className="flex flex-col min-w-0"
          >
            <div className="mb-5 flex items-center gap-4">
              {author.picture?.url && (
                // Decorative: the heading carries the name, so alt is empty to
                // avoid screen-reader duplication, same as the category cards.
                <ContentfulImage
                  alt=""
                  src={author.picture.url}
                  width={80}
                  height={80}
                  className="rounded-full object-cover h-20 w-20 shrink-0"
                />
              )}
              <h2 className="text-2xl font-bold leading-snug md:text-3xl">
                <Link
                  href={`/authors/${author.slug}`}
                  className="hover:text-brand-crimson transition-colors duration-200"
                >
                  {author.name}
                </Link>
              </h2>
            </div>

            {author.bio && (
              <div className="mb-5 text-lg leading-relaxed text-gray-600">
                <RichText content={author.bio} headings={[]} />
              </div>
            )}

            <Link
              href={`/authors/${author.slug}`}
              className="mt-auto inline-block text-sm font-bold uppercase tracking-wide text-brand-crimson hover:underline"
            >
              View posts by {author.name} &rarr;
            </Link>
          </article>
        ))}
      </div>
    </Container>
  );
}
