import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { getAllPosts, getPost } from "@/lib/api";
import { SITE_TITLE, SITE_AUTHOR } from "@/lib/constants";
import { widont } from "@/lib/typography";

// Branded Open Graph card generated per post at request time. This colocated
// file-based route takes precedence over any `openGraph.images` set in the
// page's generateMetadata, so the config there was removed to avoid dead code.
//
// Node runtime (not edge): the font is read from disk with fs at module scope,
// and the route fetches the post via the same Contentful GraphQL helper the
// page uses.
export const runtime = "nodejs";

// Prerender a card per post, alongside the pages themselves.
//
// Without this the route was the only dynamic non-API route on the site — the
// build printed `ƒ /posts/-/opengraph-image` while every page around it was ○
// or ●. Each scrape then paid for a Contentful query, a Satori render and a
// cover fetch, on a route whose output only changes when the post does.
//
// Colocated metadata routes do not inherit the page's generateStaticParams, so
// the slugs have to be enumerated again here. That is a second getAllPosts at
// build time — it is not cache()-wrapped — which is one listing query per
// build, paid once, against 20-odd renders moved off the request path.
//
// dynamicParams stays at its default of true, which is what makes this safe
// for a post published through the webhook: a slug that was not in the build
// still renders on demand, exactly as the whole route did before. The card is
// then prerendered from the next deploy on.
export async function generateStaticParams() {
  return (await getAllPosts(false)).map((post) => ({ slug: post.slug }));
}

export const alt = `${SITE_TITLE} — post`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Piazzolla at weight 500, committed as a static WOFF colocated with the route
// so it is never publicly served (unlike public/). next/font gives no raw bytes
// to ImageResponse, so the file is loaded directly. Read once at module scope,
// not per request. Satori accepts TTF, OTF and WOFF but not WOFF2. Piazzolla is
// SIL Open Font License 1.1, which permits embedding; the static instance was
// extracted from @fontsource/piazzolla 5.3.0
// (files/piazzolla-latin-500-normal.woff, github.com/huertatipografica/piazzolla).
//
// The committed file has its OpenType layout features stripped, and must keep
// them stripped. Satori's font parser handles only some GSUB lookup formats,
// and every stock Piazzolla build — fontsource and the Google Fonts static TTF
// alike — carries a contextual lookup (type 6, substFormat 2) under `liga`
// that it rejects outright with "lookupType: 6 - substFormat: 2 is not yet
// supported", failing the whole render. Dropping the features costs ligatures
// on the card and nothing else. Reproduce with:
//
//   pyftsubset piazzolla-latin-500-normal.woff --glyphs='*' \
//     --layout-features='kern' --flavor=woff --output-file=Piazzolla-Medium.woff
//
// This registers the latin subset only, so the capital eszett ẞ (U+1E9E,
// latin-ext) is absent from the cmap and a title containing it falls back off
// Piazzolla. Ordinary German characters (ä ö ü ß) are inside latin and render
// fine. Whether Satori falls back correctly across two entries registered under
// one family name is untested, so the latin-ext file is deliberately not added
// here — that belongs with the de-DE work, where it can be verified against a
// real German title.
const piazzolla = fs.readFileSync(
  path.join(process.cwd(), "app/posts/[slug]/Piazzolla-Medium.woff"),
);

// Brand ground and ink. Literal hex, not the CSS tokens — Satori cannot read
// custom properties, and these cards render the same in every context.
const BRAND_BG = "#FAF5F1";
const BRAND_INK = "#241B1D";
const BRAND_CRIMSON = "#A4243B";

// Satori has no text-overflow: ellipsis, so long titles are truncated in JS.
// widont then glues the final two words with a non-breaking space so the
// wrapped card title never ends on a lone last word, matching the on-page h1
// (Satori honours U+00A0 as non-breaking). Clamp first so the glue lands on the
// words that actually render.
function cardTitle(title: string): string {
  const clamped =
    title.length > 90 ? `${title.slice(0, 90).trimEnd()}…` : title;
  return widont(clamped);
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // OG cards are for public URLs, so draft mode is off.
  const post = await getPost(slug, false).catch(() => undefined);

  const title = post ? cardTitle(post.title) : SITE_TITLE;
  const author = post?.author?.name ?? SITE_AUTHOR;
  // Requested at the panel's exact pixel size. The card output is a fixed
  // 1200x630 PNG, so the panel is 480x630 at 1:1 and there is no DPR to serve.
  // Asking for a wider derivative only makes Satori crop a second time.
  const coverUrl = post?.coverImage
    ? `${post.coverImage.url}?w=480&h=630&fit=fill&fm=jpg&q=80`
    : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: BRAND_BG,
      }}
    >
      {/* Left column: title and footer, roughly 60% width. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "60%",
          height: "100%",
          padding: 64,
        }}
      >
        {/* The single crimson accent rule. */}
        <div
          style={{
            width: 96,
            height: 8,
            background: BRAND_CRIMSON,
            marginBottom: 40,
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Piazzolla",
            fontSize: 60,
            lineHeight: 1.1,
            color: BRAND_INK,
          }}
        >
          {title}
        </div>
        {/* Footer pinned to the bottom. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            fontFamily: "Piazzolla",
            color: BRAND_INK,
            opacity: 0.7,
            fontSize: 28,
          }}
        >
          <div style={{ display: "flex" }}>{SITE_TITLE}</div>
          <div style={{ display: "flex", marginTop: 4 }}>{author}</div>
        </div>
      </div>

      {/* Right column: cover panel, roughly 40% width. Solid ink when there
            is no cover so the layout never collapses. */}
      <div
        style={{
          display: "flex",
          width: "40%",
          height: "100%",
          background: BRAND_INK,
        }}
      >
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            width={480}
            height={630}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Piazzolla",
          data: piazzolla,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
