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
  content: string;
}

// Contentful GraphQL response shapes
export interface PostCollectionResponse {
  data?: {
    postCollection?: {
      items: Post[];
    };
  };
}

export interface PostAndMorePostsResponse {
  data?: {
    post?: {
      items: Post[];
    };
    morePosts?: {
      items: Post[];
    };
  };
}
