import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { getPost } from "@/lib/api";
import { SITE_TITLE, SITE_AUTHOR } from "@/lib/constants";

// Branded Open Graph card generated per post at request time. This colocated
// file-based route takes precedence over any `openGraph.images` set in the
// page's generateMetadata, so the config there was removed to avoid dead code.
//
// Node runtime (not edge): the font is read from disk with fs at module scope,
// and the route fetches the post via the same Contentful GraphQL helper the
// page uses.
export const runtime = "nodejs";

export const alt = `${SITE_TITLE} — post`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fraunces at weight 600, committed as a static TTF colocated with the route so
// it is never publicly served (unlike public/). next/font gives no raw bytes to
// ImageResponse, so the file is loaded directly. Read once at module scope, not
// per request. Fraunces is SIL Open Font License 1.1, which permits embedding;
// the static instance was extracted from the @fontsource/fraunces package
// (github.com/undercasetype/Fraunces).
const fraunces = fs.readFileSync(
  path.join(process.cwd(), "app/posts/[slug]/Fraunces-SemiBold.ttf"),
);

// Brand ground and ink. Literal hex, not the CSS tokens — Satori cannot read
// custom properties, and these cards render the same in every context.
const BRAND_BG = "#FAF5F1";
const BRAND_INK = "#241B1D";
const BRAND_CRIMSON = "#A4243B";

// Satori has no text-overflow: ellipsis, so long titles are truncated in JS.
function clampTitle(title: string): string {
  return title.length > 90 ? `${title.slice(0, 90).trimEnd()}…` : title;
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // OG cards are for public URLs, so draft mode is off.
  const post = await getPost(slug, false).catch(() => undefined);

  const title = post ? clampTitle(post.title) : SITE_TITLE;
  const author = post?.author?.name ?? SITE_AUTHOR;
  // A modestly sized cover derivative keeps generation fast; full assets are
  // wasteful for a 480px-wide panel.
  const coverUrl = post?.coverImage
    ? `${post.coverImage.url}?w=600&h=630&fit=fill&fm=jpg&q=80`
    : null;

  return new ImageResponse(
    (
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
              fontFamily: "Fraunces",
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
              fontFamily: "Fraunces",
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
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Fraunces",
          data: fraunces,
          weight: 600,
          style: "normal",
        },
      ],
    },
  );
}
