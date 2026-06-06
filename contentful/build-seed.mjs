import { writeFileSync } from "node:fs";

const L = "en-US";
const loc = (v) => ({ [L]: v });
const link = (id, linkType = "Entry") => ({ sys: { type: "Link", linkType, id } });

const PLACEHOLDER_ASSET_URL =
  "https://raw.githubusercontent.com/bulentyusuf/nextjs-blog-draft-mode/main/contentful/seed-assets/placeholder.jpg";

const text = (value) => ({ nodeType: "text", value, marks: [], data: {} });
const paragraph = (...kids) => ({ nodeType: "paragraph", data: {}, content: kids });
const heading2 = (value) => ({ nodeType: "heading-2", data: {}, content: [text(value)] });
const embed = (id) => ({ nodeType: "embedded-entry-block", data: { target: link(id) }, content: [] });
const doc = (...content) => ({ nodeType: "document", data: {}, content });

// publishedVersion makes contentful-import publish the entity. Verify after import.
const published = (sys) => ({ ...sys, publishedVersion: 1 });
const ct = (id) => ({ sys: { type: "Link", linkType: "ContentType", id } });
const entry = (id, contentType, fields) => ({
  sys: published({ id, type: "Entry", contentType: ct(contentType) }),
  fields,
});

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.";
const LOREM2 =
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa.";

const asset = {
  sys: published({ id: "placeholder-image", type: "Asset" }),
  fields: {
    title: loc("Placeholder image"),
    description: loc("Seed placeholder. Replace with your own image."),
    file: loc({
      contentType: "image/jpeg",
      fileName: "placeholder.jpg",
      url: PLACEHOLDER_ASSET_URL,
    }),
  },
};

const ph = () => loc(link("placeholder-image", "Asset"));

const entries = [
  entry("cat-main-quest", "category", {
    name: loc("Main Quest"),
    slug: loc("main-quest"),
    description: loc("The headline projects and the long builds."),
    thumbnail: ph(),
  }),
  entry("cat-side-quests", "category", {
    name: loc("Side Quests"),
    slug: loc("side-quests"),
    description: loc("Smaller experiments and detours."),
    thumbnail: ph(),
  }),
  entry("author-alex", "author", {
    name: loc("Alex Placeholder"),
    slug: loc("alex-placeholder"),
    picture: ph(),
    bio: loc(doc(paragraph(text(LOREM)))),
  }),
  entry("author-sam", "author", {
    name: loc("Sam Example"),
    slug: loc("sam-example"),
    picture: ph(),
    bio: loc(doc(paragraph(text(LOREM2)))),
  }),
  entry("code-example", "codeBlock", {
    filename: loc("example.tsx"),
    language: loc("tsx"),
    code: loc("export default function Hello() {\n  return <p>Hello from the template</p>;\n}"),
  }),
  entry("prompt-example", "promptBlock", {
    label: loc("Midjourney"),
    prompt: loc("a calm editorial illustration, warm directional light, gouache texture"),
  }),
  entry("post-first", "post", {
    title: loc("The first placeholder post"),
    slug: loc("first-placeholder-post"),
    date: loc("2026-05-01"),
    coverImage: ph(),
    excerpt: loc("A short placeholder excerpt for the first seeded post."),
    content: loc(
      doc(
        paragraph(text(LOREM)),
        heading2("Background"),
        paragraph(text(LOREM2)),
        heading2("A code block"),
        paragraph(text(LOREM)),
        embed("code-example"),
        heading2("Where this leaves us"),
        paragraph(text(LOREM2))
      )
    ),
    author: loc(link("author-alex")),
    category: loc(link("cat-main-quest")),
  }),
  entry("post-second", "post", {
    title: loc("A second sample entry"),
    slug: loc("second-sample-entry"),
    date: loc("2026-05-08"),
    coverImage: ph(),
    excerpt: loc("A short placeholder excerpt for the second seeded post."),
    content: loc(
      doc(
        paragraph(text(LOREM2)),
        heading2("A prompt block follows"),
        paragraph(text(LOREM)),
        embed("prompt-example")
      )
    ),
    author: loc(link("author-sam")),
    category: loc(link("cat-side-quests")),
  }),
  entry("post-third", "post", {
    title: loc("One more for the archive"),
    slug: loc("one-more-for-the-archive"),
    date: loc("2026-05-15"),
    coverImage: ph(),
    excerpt: loc("A short placeholder excerpt for the third seeded post."),
    content: loc(doc(paragraph(text(LOREM)), paragraph(text(LOREM2)))),
    author: loc(link("author-alex")),
    category: loc(link("cat-main-quest")),
  }),
  entry("page-about", "page", {
    title: loc("About"),
    slug: loc("about"),
    body: loc(doc(paragraph(text(LOREM)), paragraph(text(LOREM2)))),
  }),
  entry("page-privacy", "page", {
    title: loc("Privacy"),
    slug: loc("privacy"),
    body: loc(doc(paragraph(text(LOREM)))),
  }),
];

writeFileSync("contentful/seed.json", JSON.stringify({ assets: [asset], entries }, null, 2) + "\n");
console.log(`Wrote contentful/seed.json: 1 asset, ${entries.length} entries.`);
