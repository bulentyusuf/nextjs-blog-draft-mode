import type { Metadata } from "next";
import { getBrowseIntro } from "./api";
import {
  SITE_TITLE,
  SITE_URL,
  SITE_DESCRIPTION,
  DEFAULT_OG_LOCALE,
} from "./constants";

// The site's own card, used by every page with no image of its own.
const SITE_CARD_URL = "/be_useful.jpg";
const SITE_CARD = [
  { url: SITE_CARD_URL, width: 1200, height: 630, alt: SITE_TITLE },
];

/**
 * The Open Graph and Twitter blocks, which are identical on every page that is
 * not a post and differ only in title, description, URL and image.
 *
 * Ten pages carried a hand-written copy of this — the four browse indexes and
 * the six taxonomy listings — so a change to the card size or the OG type meant
 * ten edits, and the copies had already drifted: an author page fell back to
 * the site card for `og:image` but emitted no `twitter:image` at all when the
 * author had no portrait. Both fall back here, so the two agree on every page.
 *
 * `title` is optional because the browse indexes deliberately omit
 * `twitter.title` and inherit the document title instead.
 */
function socialCard({
  title,
  description,
  url,
  images,
}: {
  title?: string;
  description: string;
  url: string;
  /** Entity-specific images, e.g. an author's portrait. Absent → the site card. */
  images?: string[];
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      description,
      url,
      siteName: SITE_TITLE,
      images: images ?? SITE_CARD,
      type: "website",
      locale: DEFAULT_OG_LOCALE,
    },
    twitter: {
      card: "summary_large_image",
      ...(title === undefined ? {} : { title }),
      description,
      images: images ?? [SITE_CARD_URL],
    },
  };
}

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
    ...socialCard({ description, url }),
  };
}

/**
 * Metadata for one taxonomy listing — a category, tag or author page, in either
 * its unpaginated or its paginated form.
 *
 * The six routes differ in four values and agreed on the other thirty lines.
 * `canonical` is passed whole rather than assembled from a slug because the
 * paginated routes append `/page/N` to it, and a route that knows its own URL
 * is clearer than a helper that reconstructs it.
 */
export function listingMetadata({
  title,
  description,
  canonical,
  images,
}: {
  title: string;
  description: string;
  canonical: string;
  images?: string[];
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    ...socialCard({ title, description, url: canonical, images }),
  };
}
