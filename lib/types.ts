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
  json: any;
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
  author?: Author;
  excerpt: string;
  content: Content;
}

// Contentful GraphQL response shapes
export interface PostCollectionResponse {
  data?: {
    postCollection?: {
      items: Post[];
    };
  };
}
