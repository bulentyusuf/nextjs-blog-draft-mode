import type { Metadata } from "next";
import { getBrowseIntro } from "./api";
import {
  SITE_TITLE,
  SITE_URL,
  SITE_DESCRIPTION,
  DEFAULT_OG_LOCALE,
} from "./constants";

/**
 * Metadata for a browse page (/tags, /categories, /authors, /archive).
 *
 * The four had byte-identical metadata objects differing only in title and
 * path. Making the description editable meant converting each from a static
 * `export const metadata` to `generateMetadata`, which would have turned one
 * copy-paste into four; this collapses them instead.
 *
 * `slug` doubles as the route and as the BrowseIntro key, which is why they are
 * one argument rather than two — the entry for /tags has slug "tags".
 *
 * Must be called with the same slug the page component passes to
 * getBrowseIntro(). That helper is cache()-wrapped, so identical calls collapse
 * into one request per render; different arguments would issue two.
 */
export async function browsePageMetadata({
  slug,
  title,
  isDraftMode,
}: {
  slug: string;
  title: string;
  isDraftMode: boolean;
}): Promise<Metadata> {
  const intro = await getBrowseIntro(slug, isDraftMode);

  // Falls back to the site description rather than rendering an empty tag: a
  // missing entry should cost the page its bespoke snippet, not its metadata.
  // Trimmed because a field holding only whitespace is an empty field.
  const description = intro?.metaDescription?.trim() || SITE_DESCRIPTION;
  const url = `${SITE_URL}/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      description,
      url,
      siteName: SITE_TITLE,
      images: [
        { url: "/be_useful.jpg", width: 1200, height: 630, alt: SITE_TITLE },
      ],
      type: "website",
      locale: DEFAULT_OG_LOCALE,
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: ["/be_useful.jpg"],
    },
  };
}
