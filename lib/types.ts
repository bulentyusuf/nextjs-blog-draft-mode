import type { Document } from "@contentful/rich-text-types";

export interface Asset {
  sys: {
    id: string;
  };
  url: string;
  description: string;
}

export interface AssetLink {
  block: Asset[];
}

export interface CodeBlock {
  __typename: "CodeBlock";
  sys: { id: string };
  language?: string;
  code: string;
  filename?: string;
}

export interface PromptBlock {
  __typename: "PromptBlock";
  sys: { id: string };
  prompt: string;
  label?: string; // optional header text; falls back to "Prompt" when absent
  image?: { url: string; description?: string }; // linked asset; absent on text-only prompts
}

export interface Sidenote {
  __typename: "Sidenote";
  sys: { id: string };
  note: Content; // rich text — reuses the Content shape (json + links)
}

export interface EntryLink {
  // Block-level embeds (CodeBlock, PromptBlock) sit between paragraphs.
  block: (CodeBlock | PromptBlock)[];
  // Inline embeds (Sidenote) sit inside a paragraph, referenced by an
  // INLINES.EMBEDDED_ENTRY node. Optional: only POST_GRAPHQL_FIELDS fetches it.
  inline?: Sidenote[];
}

export interface Content {
  json: Document;
  links: {
    assets: AssetLink;
    entries?: EntryLink;
  };
}

export interface Author {
  name: string;
  slug?: string; // optional: legacy/draft authors may predate the field
  bio?: Content; // optional: not every author has a bio, and draft-safe
  picture: {
    url: string;
  };
}

export interface AuthorCollectionResponse {
  data?: {
    authorCollection?: {
      items: Author[];
    };
  };
}

export interface CoverImage {
  url: string;
}

export interface Category {
  name: string;
  slug: string;
  description?: string;
  thumbnail?: CoverImage; // optional 4:3 category tile; absent on categories without one
}

export interface Post {
  slug: string;
  title: string;
  coverImage?: CoverImage;
  date: string;
  updatedDate?: string; // optional, only set when post has been updated
  author?: Author;
  excerpt: string;
  content: Content;
  category?: Category; // single reference; optional so untagged posts don't break
}

export interface CategoryCollectionResponse {
  data?: {
    categoryCollection?: {
      items: Category[];
    };
  };
}

export interface PostCollectionResponse {
  data?: {
    postCollection?: {
      items: Post[];
    };
  };
}

export type CardPost = Pick<
  Post,
  "slug" | "title" | "date" | "excerpt" | "coverImage"
>;

export interface CardPostCollectionResponse {
  data?: {
    postCollection?: {
      items: CardPost[];
    };
  };
}

// A post as returned by the sitewide listing query (getAllPosts / LIST_GRAPHQL_FIELDS).
// It carries the card and byline fields the home page, feed, and sitemap render,
// but omits the heavy `content` body and the author `bio` — those are absent, so
// don't read them. Use getPostAndMorePosts / getPostsByCategory for a full Post.
export type ListPost = Omit<Post, "content" | "author"> & {
  author?: Omit<Author, "bio">;
};

export interface ListPostCollectionResponse {
  data?: {
    postCollection?: {
      items: ListPost[];
    };
  };
}

export interface Page {
  slug: string;
  title: string;
  body: Content;
  sys: {
    publishedAt: string | null;
    firstPublishedAt: string | null;
  };
}

export interface PageMeta {
  slug: string;
  sys: {
    publishedAt: string | null;
    firstPublishedAt: string | null;
  };
}

export interface PageMetaCollectionResponse {
  data?: {
    pageCollection?: {
      items: PageMeta[];
    };
  };
}

export interface PageCollectionResponse {
  data?: {
    pageCollection?: {
      items: Page[];
    };
  };
}
