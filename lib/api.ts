import type { Post, PostCollectionResponse } from "./types";

const POST_GRAPHQL_FIELDS = `
  slug
  title
  coverImage {
    url
  }
  date
  author {
    name
    picture {
      url
    }
  }
  excerpt
  content {
    json
    links {
      assets {
        block {
          sys {
            id
          }
          url
          description
        }
      }
    }
  }
`;

type GraphQLVariables = Record<string, unknown>;

async function fetchGraphQL<T>(
  query: string,
  preview = false,
  variables: GraphQLVariables = {},
): Promise<T> {
  const response = await fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          preview
            ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
            : process.env.CONTENTFUL_ACCESS_TOKEN
        }`,
      },
      body: JSON.stringify({ query, variables }),
      next: { tags: ["posts"] },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Contentful GraphQL request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

function extractPost(fetchResponse: PostCollectionResponse): Post | undefined {
  return fetchResponse?.data?.postCollection?.items?.[0];
}

function extractPostEntries(fetchResponse: PostCollectionResponse): Post[] {
  return fetchResponse?.data?.postCollection?.items ?? [];
}

export async function getPreviewPostBySlug(
  slug: string | null,
): Promise<Post | undefined> {
  if (!slug) return undefined;

  const entry = await fetchGraphQL<PostCollectionResponse>(
    `query GetPreviewPost($slug: String!) {
      postCollection(where: { slug: $slug }, preview: true, limit: 1) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    true,
    { slug },
  );

  return extractPost(entry);
}

export async function getAllPosts(isDraftMode: boolean): Promise<Post[]> {
  const entries = await fetchGraphQL<PostCollectionResponse>(
    `query GetAllPosts($preview: Boolean) {
      postCollection(where: { slug_exists: true }, order: date_DESC, preview: $preview) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    isDraftMode,
    { preview: isDraftMode },
  );

  return extractPostEntries(entries);
}

export async function getPostAndMorePosts(
  slug: string,
  preview: boolean,
): Promise<{ post: Post | undefined; morePosts: Post[] }> {
  const entry = await fetchGraphQL<PostCollectionResponse>(
    `query GetPost($slug: String!, $preview: Boolean) {
      postCollection(where: { slug: $slug }, preview: $preview, limit: 1) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    preview,
    { slug, preview },
  );

  const entries = await fetchGraphQL<PostCollectionResponse>(
    `query GetMorePosts($slug: String!, $preview: Boolean) {
      postCollection(where: { slug_not_in: [$slug] }, order: date_DESC, preview: $preview, limit: 2) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    preview,
    { slug, preview },
  );

  return {
    post: extractPost(entry),
    morePosts: extractPostEntries(entries),
  };
}
