# Be Useful.

The source for [bulentyusuf.com](https://bulentyusuf.com), a personal blog about content, code, and making things with generative AI.

## About

A small, statically generated blog. Posts are written and managed in a headless CMS, rendered by Next.js, and deployed continuously. The content model is deliberately compact, a Post type backed by Author and Category, with a Code Block type for embedded snippets and a Page type for standalone pages like the privacy notice.

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
