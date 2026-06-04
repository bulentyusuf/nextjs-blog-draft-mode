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
}

export interface EntryLink {
  block: (CodeBlock | PromptBlock)[];
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
  thumbnail?: CoverImage;  // optional 4:3 category tile; absent on categories without one
}

export interface Post {
  slug: string;
  title: string;
  coverImage?: CoverImage;
  date: string;
  updatedDate?: string;  // optional, only set when post has been updated
  author?: Author;
  excerpt: string;
  content: Content;
  category?: Category;  // single reference; optional so untagged posts don't break
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
