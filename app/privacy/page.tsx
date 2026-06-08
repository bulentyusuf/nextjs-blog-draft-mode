import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import Date from "../date";
import Container from "../container";
import { RichText } from "@/lib/rich-text";
import { getPage } from "@/lib/api";
import { SITE_TITLE, SITE_URL } from "@/lib/constants";

const SLUG = "privacy";

export async function generateMetadata(): Promise<Metadata> {
  const { isEnabled } = await draftMode();
  const page = await getPage(SLUG, isEnabled);

  if (!page) {
    return { title: "Privacy" };
  }

  const description = `How ${SITE_TITLE} handles data.`;
  const canonical = `${SITE_URL}/${SLUG}`;

  return {
    title: page.title,
    description,
    alternates: { canonical },
    openGraph: {
      description,
      url: canonical,
      siteName: SITE_TITLE,
      images: [{ url: "/be_useful.jpg", width: 1200, height: 630, alt: SITE_TITLE }],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: ["/be_useful.jpg"],
    },
  };
}

export default async function PrivacyPage() {
  const { isEnabled } = await draftMode();
  const page = await getPage(SLUG, isEnabled);

  if (!page) {
    notFound();
  }

  const lastUpdated = page.sys.publishedAt ?? page.sys.firstPublishedAt;

  return (
    <Container>
      <article className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-4xl font-bold tracking-tighter md:text-5xl">
          {page.title}
        </h1>
        {lastUpdated && (
          <p className="mb-8 text-sm text-gray-500">
            Last updated: <Date dateString={lastUpdated} />
          </p>
        )}
        <div className="prose">
          <RichText content={page.body} headings={[]} lightbox={false} prioritizeFirstImage />
        </div>
      </article>
    </Container>
  );
}
