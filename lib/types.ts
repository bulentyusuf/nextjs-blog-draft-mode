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

export interface Content {
  json: Document;
  links: {
    assets: AssetLink;
  };
}

export interface Author {
  name: string;
  picture: {
    url: string;
  };
}

export interface CoverImage {
  url: string;
}

export interface Category {
  name: string;
  slug: string;
  description?: string;
}

export interface Post {
  sys: { id: string };
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

export interface Page {
  sys: {
    id: string;
    publishedAt: string | null;
    firstPublishedAt: string | null;
  };
  slug: string;
  title: string;
  body: Content;
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
