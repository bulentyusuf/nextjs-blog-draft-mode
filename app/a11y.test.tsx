/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { renderToReadableStream } from "react-dom/server";
import axe from "axe-core";
import type { AxeResults, Result } from "axe-core";
import type { CardPost, Content } from "@/lib/types";
import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import type { Document } from "@contentful/rich-text-types";

// Accessibility regression suite.
//
// This exists because the defects it guards were all found by running axe once,
// by hand, against markup rendered outside the test suite — and the run was
// then thrown away, so nothing stopped them coming back. Every rule below has
// caught a real defect in this repo: heading-order caught the footer's <h4>
// column labels skipping a level after the page's h2s, and the duplicate-link
// check (which axe does NOT implement) caught every listing card exposing its
// cover and its title as two links to one post with one name.
//
// Pages are composed from the real components inside the real RootLayout, so
// the header, footer, skip link and landmark structure are the shipped ones
// rather than a fixture approximating them. RootLayout is an async server
// component and CoverImage is another nested inside it, which is why this uses
// renderToReadableStream: renderToStaticMarkup cannot resolve either.

vi.mock("server-only", () => ({}));
// next/font/google reaches the network at module scope. The layout only uses
// the returned `variable`, so a stub is faithful enough for structure.
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Fraunces: () => ({ variable: "--font-fraunces" }),
}));
vi.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: false }),
}));
vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => null }));
// The blur fetch would hit Contentful. undefined is the component's real
// "no LQIP underlay" branch, so this exercises a shipped path.
vi.mock("@/lib/blur", () => ({ getBlurDataURL: async () => undefined }));

const RootLayout = (await import("@/app/layout")).default;
const MoreStories = (await import("@/app/more-stories")).default;
const Breadcrumb = (await import("@/app/breadcrumb")).default;
const Pagination = (await import("@/app/pagination")).default;
const CoverImage = (await import("@/app/cover-image")).default;
const Avatar = (await import("@/app/avatar")).default;
const { RichText } = await import("@/lib/rich-text");
const { extractHeadings } = await import("@/lib/headings");

/**
 * Rules that cannot be evaluated here, and where they are covered instead.
 *
 * Both need a layout engine, which jsdom has no part of — it computes no boxes
 * and applies no Tailwind stylesheet, so axe would either error or report a
 * false pass. Contrast is asserted numerically against the tokens themselves in
 * lib/tag-pill.test.ts, which is the more precise test anyway: it reads the
 * values out of globals.css rather than sampling rendered pixels.
 */
const LAYOUT_DEPENDENT_RULES = {
  "color-contrast": { enabled: false },
  "target-size": { enabled: false },
} as const;

function formatViolations(violations: Result[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 3)
        .map((n) => `      ${n.html.slice(0, 160).replace(/\s+/g, " ")}`)
        .join("\n");
      const more =
        v.nodes.length > 3 ? `\n      …and ${v.nodes.length - 3} more` : "";
      return `  [${v.impact}] ${v.id} — ${v.help}\n${nodes}${more}\n      ${v.helpUrl}`;
    })
    .join("\n\n");
}

/** Render a page into the document, then hand it to axe. */
async function renderPage(page: React.ReactElement): Promise<AxeResults> {
  const stream = await renderToReadableStream(page);
  await stream.allReady;
  const html = await new Response(stream).text();
  // RootLayout emits a full document; jsdom already has html/head/body, so the
  // body's contents are transplanted rather than the whole string parsed.
  document.body.innerHTML = html
    .replace(/^[\s\S]*?<body[^>]*>/i, "")
    .replace(/<\/body>[\s\S]*$/i, "");
  return axe.run(document.body, {
    resultTypes: ["violations"],
    rules: LAYOUT_DEPENDENT_RULES,
  });
}

function expectNoViolations(results: AxeResults) {
  if (results.violations.length > 0) {
    throw new Error(
      `axe found ${results.violations.length} violation(s):\n\n${formatViolations(results.violations)}`,
    );
  }
}

/**
 * Links inside <main> that share a destination AND an accessible name.
 *
 * axe does not flag this — both links are perfectly labelled, which is the
 * problem: they are the same label twice. It doubles the tab stops on a
 * listing and fills a screen reader's link list with pairs that cannot be told
 * apart. A cover image linking to the post its title also links to is the
 * shape this catches.
 *
 * Scoped to <main> deliberately. The header and footer both link to
 * /categories with the name "Categories", and that is ordinary site chrome,
 * not a defect — the landmarks distinguish them.
 */
function duplicateLinksInMain(): string[] {
  const main = document.querySelector("main");
  if (!main) throw new Error("no <main> landmark rendered");

  const seen = new Map<string, number>();
  for (const link of main.querySelectorAll("a[href]")) {
    // A link hidden from assistive tech is not announced, so it cannot
    // duplicate an announcement. That is exactly how the cover link opts out.
    if (link.closest('[aria-hidden="true"]')) continue;

    const labelledBy = link.getAttribute("aria-labelledby");
    const name = (
      link.getAttribute("aria-label") ??
      (labelledBy
        ? (document.getElementById(labelledBy)?.textContent ?? "")
        : (link.textContent ?? ""))
    )
      .replace(/\s+/g, " ")
      .trim();
    if (!name) continue;

    const key = `${link.getAttribute("href")} :: ${name}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, n]) => n > 1)
    .map(([key, n]) => `${key} (×${n})`);
}

function post(slug: string, tags: string[] = []): CardPost {
  return {
    slug,
    title: `Post ${slug}`,
    date: "2026-01-01",
    excerpt: `Excerpt for post ${slug}.`,
    coverImage: { url: "https://images.ctfassets.net/x/y/cover.jpg" },
    tagsCollection: {
      items: tags.map((t) => ({ name: t, slug: t.toLowerCase() })),
    },
  };
}

// A body exercising every embedded type: a figure with a caption, a code
// block, a prompt block and an inline sidenote. Each has its own naming rules.
const text = (value: string) => ({
  nodeType: "text",
  value,
  marks: [],
  data: {},
});
const para = (...content: unknown[]) => ({
  nodeType: BLOCKS.PARAGRAPH,
  data: {},
  content,
});
const h2 = (value: string) => ({
  nodeType: BLOCKS.HEADING_2,
  data: {},
  content: [text(value)],
});
const embed = (nodeType: string, id: string) => ({
  nodeType,
  data: { target: { sys: { id } } },
  content: [],
});

const bodyDoc = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    h2("First section"),
    para(
      text("Body copy carrying a note"),
      embed(INLINES.EMBEDDED_ENTRY, "n1"),
    ),
    embed(BLOCKS.EMBEDDED_ASSET, "img1"),
    embed(BLOCKS.EMBEDDED_ENTRY, "code1"),
    embed(BLOCKS.EMBEDDED_ENTRY, "prompt1"),
    h2("Second section"),
    para(text("Closing copy.")),
  ],
} as unknown as Document;

const bodyContent = {
  json: bodyDoc,
  links: {
    assets: {
      block: [
        {
          sys: { id: "img1" },
          url: "https://images.ctfassets.net/x/y/photo.jpg",
          description: "A cabinet of vintage computers stacked three high",
        },
      ],
    },
    entries: {
      block: [
        {
          sys: { id: "code1" },
          __typename: "CodeBlock",
          filename: "example.ts",
          code: "const a = 1;",
        },
        {
          sys: { id: "prompt1" },
          __typename: "PromptBlock",
          label: "A prompt",
          prompt: "Draw a cat",
        },
      ],
      inline: [
        {
          sys: { id: "n1" },
          __typename: "Sidenote",
          note: {
            json: {
              nodeType: BLOCKS.DOCUMENT,
              data: {},
              content: [para(text("The note body."))],
            },
          },
        },
      ],
    },
  },
} as unknown as Content;

describe("listing page", () => {
  const render = () =>
    renderPage(
      <RootLayout>
        <div className="mx-auto max-w-5xl px-5 py-8">
          <section className="mb-16">
            <h1>
              <a href="/posts/hero">The hero post</a>
            </h1>
            <CoverImage
              url="https://images.ctfassets.net/x/y/hero.jpg"
              slug="hero"
              wide
              priority
            />
          </section>
          <MoreStories
            morePosts={[post("a", ["Design"]), post("b", ["Retro", "Code"])]}
            heading="Latest Posts"
            visibleTags={new Set(["design", "retro", "code"])}
          />
          <Pagination currentPage={2} totalPages={5} basePath="/" />
        </div>
      </RootLayout>,
    );

  it("has no axe violations", async () => {
    expectNoViolations(await render());
  });

  it("announces each post exactly once", async () => {
    // The cover and the title both link to the post. The cover opts out of the
    // accessibility tree so only the title is announced; drop that and every
    // card here doubles.
    await render();
    expect(duplicateLinksInMain()).toEqual([]);
  });

  it("keeps heading levels contiguous", async () => {
    // The footer's column labels are <p> for this reason: as <h4> they landed
    // after the page's h2 and skipped h3.
    await render();
    const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
      (h) => Number(h.tagName[1]),
    );
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});

describe("post page", () => {
  const render = () =>
    renderPage(
      <RootLayout>
        <div className="mx-auto max-w-5xl px-5 py-8">
          <article>
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Archive", href: "/archive" },
                { label: "A post title" },
              ]}
            />
            <h1>A post title</h1>
            <CoverImage
              url="https://images.ctfassets.net/x/y/cover.jpg"
              wide
              priority
            />
            <Avatar
              name="Bulent Yusuf"
              slug="bulent-yusuf"
              meta={<span>1 January 2026</span>}
            />
            <div className="prose">
              <RichText
                content={bodyContent}
                headings={extractHeadings(bodyDoc)}
              />
            </div>
          </article>
        </div>
      </RootLayout>,
    );

  it("has no axe violations", async () => {
    expectNoViolations(await render());
  });

  it("announces each destination exactly once", async () => {
    await render();
    expect(duplicateLinksInMain()).toEqual([]);
  });

  it("keeps heading levels contiguous", async () => {
    await render();
    const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
      (h) => Number(h.tagName[1]),
    );
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it("describes a captioned figure once, not twice", async () => {
    // Contentful's `description` is one field feeding both. Emitted as alt as
    // well as caption, every figure announced the same sentence twice.
    await render();
    for (const figure of document.querySelectorAll("figure")) {
      const alt = figure.querySelector("img")?.getAttribute("alt");
      const caption = figure.querySelector("figcaption")?.textContent?.trim();
      if (caption) expect(alt).toBe("");
    }
  });
});
