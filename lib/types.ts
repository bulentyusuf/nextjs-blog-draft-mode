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

export interface Post {
  slug: string;
  title: string;
  coverImage: CoverImage;
  date: string;
  updatedDate?: string;  // optional, only set when post has been updated
  author?: Author;
  excerpt: string;
  content: Content;
}

export interface PostCollectionResponse {
  data?: {
    postCollection?: {
      items: Post[];
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

export interface PageCollectionResponse {
  data?: {
    pageCollection?: {
      items: Page[];
    };
  };
}
