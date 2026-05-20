# Fun with GenAI

The source for [bulentyusuf.com](https://bulentyusuf.com) — a personal blog about content, code, and making things with generative AI.

## About

This is a small, statically generated blog. Posts are written and managed in a headless CMS, rendered by Next.js, and deployed continuously. The site is deliberately simple: a single `Post` type and a single `Author` type.

A recurring subject of the blog is the process of building and maintaining it — much of the codebase has been developed in collaboration with [Claude](https://claude.ai), and several posts document what that's actually like in practice. The visual identity uses editorial-style cover images generated with [Midjourney](https://www.midjourney.com).

## Stack

- **[Next.js](https://nextjs.org)** (App Router) — rendering and routing
- **[Contentful](https://www.contentful.com)** — headless CMS, queried over GraphQL, with draft mode and live preview
- **[Tailwind CSS](https://tailwindcss.com)** — styling
- **[Vercel](https://vercel.com)** — hosting and deployment
- **TypeScript** throughout

## Features

- Static generation with on-demand revalidation — content edits in the CMS go live immediately via a webhook, without a full redeploy
- Draft mode and live preview for editing posts before publishing
- Auto-generated sitemap, `robots.txt`, and RSS feed
- Open Graph and Twitter card metadata for shareable links
- Security-reviewed, with branch protection, CodeQL scanning, and dependency monitoring

## Writing about the build
 
Some posts document the process of building and maintaining this site:
 
- [Rebuilding this site with Claude as my Copilot](https://bulentyusuf.com/posts/rebuilding-blog-claude-copilot)
- [The Blogger's Blueprint](https://bulentyusuf.com/posts/bloggers-blueprint)

## License

See [LICENSE.md](./LICENSE.md).
