# Be Useful.

The source for [bulentyusuf.com](https://bulentyusuf.com), a personal blog about content, code, and making things with generative AI.

## About

A small, statically generated blog. Posts are written and managed in a headless CMS, rendered by Next.js, and deployed continuously. The content model is deliberately compact, a Post type backed by Author and Category, with a Code Block type for embedded snippets, a Prompt Block type for publishing the image prompt behind a cover, and a Page type for standalone pages like the privacy notice.

A recurring subject of the blog is the process of building and maintaining it. Much of the codebase has been developed in collaboration with [Claude](https://claude.ai), and several posts document what that's actually like in practice. The visual identity uses editorial-style cover images generated with [Midjourney](https://www.midjourney.com).

## Stack

- **[Next.js](https://nextjs.org)** (App Router), rendering and routing
- **[Contentful](https://www.contentful.com)**, headless CMS queried over GraphQL, with draft mode and live preview
- **[Tailwind CSS](https://tailwindcss.com)**, styling
- **[Vercel](https://vercel.com)**, hosting and deployment
- **TypeScript** throughout

## Content model

- **Post**, the main entry type. Title, slug, publish and updated dates, cover image, excerpt, rich-text body, and links to one author and one category
- **Author**, name, picture, slug, and a short bio, with its own landing page
- **Category**, name, slug, description, and thumbnail, with its own landing page. Posts are filed under Main Quest or Side Quests
- **Code Block**, embedded into post bodies for syntax-highlighted snippets. Optional filename and a fixed list of languages
- **Prompt Block**, embedded into post bodies to publish the generative-image prompt behind a cover, with an optional label and image
- **Page**, standalone rich-text pages such as About and Privacy

## Features

- Static generation with on-demand revalidation. Content edits in the CMS go live immediately via a webhook, without a full redeploy
- Draft mode and live preview for editing posts before publishing
- Paginated home, category, and author listings
- Category and author landing pages, each with a directory index
- Syntax-highlighted code blocks with a copy button, powered by Shiki
- Per-post table of contents and an image lightbox
- Auto-generated sitemap, `robots.txt`, and RSS feed
- Open Graph and Twitter card metadata for shareable links
- Security-reviewed, with branch protection, CodeQL scanning, and dependency monitoring

## Getting started

This repository works as a template. Fork it, point it at your own Contentful space, and deploy your own version. It is MIT licensed.

### Prerequisites

- Node 20 or newer
- A Contentful account with an empty space
- Optionally, a Vercel account for hosting

### 1. Install

```
git clone https://github.com/bulentyusuf/nextjs-blog-draft-mode.git
cd nextjs-blog-draft-mode
npm install
```

### 2. Configure environment

Copy the example file and fill in the values.

```
cp .env.local.example .env.local
```

- `CONTENTFUL_SPACE_ID`, your space ID, under Settings then General settings in Contentful
- `CONTENTFUL_ACCESS_TOKEN`, a Content Delivery API token from Settings then API keys
- `CONTENTFUL_PREVIEW_ACCESS_TOKEN`, the Content Preview API token from the same API keys page
- `CONTENTFUL_PREVIEW_SECRET`, any random string you choose, it guards the draft preview route
- `CONTENTFUL_REVALIDATE_SECRET`, any random string you choose, it guards the revalidation webhook
- `NEXT_PUBLIC_SITE_URL`, your public site URL such as `https://example.com`, used for canonical links, Open Graph tags, the sitemap, and the RSS feed

### 3. Import the content model

This creates the content types and locales in your space from `contentful/export.json`. It needs a Contentful Management token, which is different from the delivery and preview tokens above. It is passed only on the command line and never committed.

```
npm run import:contentful -- --space-id YOUR_SPACE_ID --management-token YOUR_MANAGEMENT_TOKEN
```

### 4. Add example content (optional)

Seeds a few placeholder posts, authors, categories, and pages, all published, so the site renders straight away.

```
npm run import:seed -- --space-id YOUR_SPACE_ID --management-token YOUR_MANAGEMENT_TOKEN
```

The seed ships a single placeholder image, reused for every cover, avatar, and thumbnail. This keeps the import light and free of bundled media. Replace it and the dummy text with your own once you are set up.

### 5. Run locally

```
npm run dev
```

The site runs at `http://localhost:3000`.

### 6. Deploy

Push to GitHub and import the repository into Vercel, then set the same environment variables in the Vercel project settings.

### 7. Live updates and preview (optional)

- **Revalidation.** In Contentful, add a webhook that sends a `POST` to `https://YOUR_DOMAIN/api/revalidate` with a header `x-vercel-reval-key` set to your `CONTENTFUL_REVALIDATE_SECRET`. Trigger it on entry publish and unpublish. Published edits then go live without a redeploy.
- **Preview.** Set the Post type's content preview URL to `https://YOUR_DOMAIN/api/draft?secret=YOUR_PREVIEW_SECRET&slug={entry.fields.slug}`. Editors can then open a draft in place.
