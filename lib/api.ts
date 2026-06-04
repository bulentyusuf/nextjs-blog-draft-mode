import type {
  Post,
  PostCollectionResponse,
  CardPost,
  CardPostCollectionResponse,
  Page,
  PageCollectionResponse,
  PageMeta,
  PageMetaCollectionResponse,
  Category,
  CategoryCollectionResponse,
  Author,
  AuthorCollectionResponse,
} from "./types";

const POST_GRAPHQL_FIELDS = `
  slug
  title
  coverImage {
    url
  }
  date
  updatedDate
  author {
    name
    slug
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
      entries {
        block {
          sys {
            id
          }
          __typename
          ... on CodeBlock {
            language
            code
            filename
          }
          ... on PromptBlock {
            prompt
            label
            image {
              url
              description
            }
          }
        }
      }
    }
  }
  category {
    name
    slug
  }
`;

// Slim fragment for listing previews (e.g. the categories landing page). Pulls
// only what a card renders, so we don't fetch full rich-text content + links
// for posts we're only teasing. Posts returned with this fragment are partial:
// `content`, `author`, `updatedDate`, `category` are absent. Don't read them.
const CARD_GRAPHQL_FIELDS = `
  slug
  title
  coverImage {
    url
  }
  date
  excerpt
`;

const PAGE_GRAPHQL_FIELDS = `
  slug
  title
  sys {
    publishedAt
    firstPublishedAt
  }
  body {
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
    const detail = await response.text();
    throw new Error(
      `Contentful GraphQL request failed: ${response.status} ${response.statusText} — ${detail}`,
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

function extractCardEntries(fetchResponse: CardPostCollectionResponse): CardPost[] {
  return fetchResponse?.data?.postCollection?.items ?? [];
}

export async function getAllPosts(isDraftMode = false): Promise<Post[]> {
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
  preview = false,
): Promise<{ post: Post | undefined; morePosts: CardPost[] }> {
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

  const post = extractPost(entry);
  const categorySlug = post?.category?.slug;

  // Same-category posts, newest first, excluding the current one.
  const related = categorySlug
    ? extractCardEntries(
        await fetchGraphQL<CardPostCollectionResponse>(
          `query GetRelated($slug: String!, $category: String!, $preview: Boolean) {
            postCollection(
              where: { slug_not_in: [$slug], category: { slug: $category } }
              order: date_DESC, preview: $preview, limit: 2
            ) {
              items {
                ${CARD_GRAPHQL_FIELDS}
              }
            }
          }`,
          preview,
          { slug, category: categorySlug, preview },
        ),
      )
    : [];

  // Backfill with recent sitewide posts when the category gives us < 2.
  // limit: 3 so that after de-duping the one related post we already hold,
  // we can still reach 2 total.
  let morePosts = related;
  if (morePosts.length < 2) {
    const recent = extractCardEntries(
      await fetchGraphQL<CardPostCollectionResponse>(
        `query GetMorePosts($slug: String!, $preview: Boolean) {
          postCollection(where: { slug_not_in: [$slug] }, order: date_DESC, preview: $preview, limit: 3) {
            items {
              ${CARD_GRAPHQL_FIELDS}
            }
          }
        }`,
        preview,
        { slug, preview },
      ),
    );
    const seen = new Set(morePosts.map((p) => p.slug));
    morePosts = [...morePosts, ...recent.filter((p) => !seen.has(p.slug))].slice(0, 2);
  }

  return { post, morePosts };
}

export async function getPage(
  slug: string,
  preview = false,
): Promise<Page | undefined> {
  const entry = await fetchGraphQL<PageCollectionResponse>(
    `query GetPage($slug: String!, $preview: Boolean) {
      pageCollection(where: { slug: $slug }, preview: $preview, limit: 1) {
        items {
          ${PAGE_GRAPHQL_FIELDS}
        }
      }
    }`,
    preview,
    { slug, preview },
  );

  return entry?.data?.pageCollection?.items?.[0];
}

export async function getAllPages(
  isDraftMode: boolean,
): Promise<PageMeta[]> {
  const entries = await fetchGraphQL<PageMetaCollectionResponse>(
    `query GetAllPages($preview: Boolean) {
      pageCollection(where: { slug_exists: true }, preview: $preview) {
        items {
          slug
          sys {
            publishedAt
            firstPublishedAt
          }
        }
      }
    }`,
    isDraftMode,
    { preview: isDraftMode },
  );

  return entries?.data?.pageCollection?.items ?? [];
}

export async function getAllCategories(
  isDraftMode = false,
): Promise<Category[]> {
  const entries = await fetchGraphQL<CategoryCollectionResponse>(
    `query GetAllCategories($preview: Boolean) {
      categoryCollection(where: { slug_exists: true }, order: name_ASC, preview: $preview) {
        items {
          name
          slug
          description
          thumbnail {
            url
          }
        }
      }
    }`,
    isDraftMode,
    { preview: isDraftMode },
  );

  return entries?.data?.categoryCollection?.items ?? [];
}

export async function getCategoryBySlug(
  slug: string,
  isDraftMode = false,
): Promise<Category | undefined> {
  const entries = await fetchGraphQL<CategoryCollectionResponse>(
    `query GetCategory($slug: String!, $preview: Boolean) {
      categoryCollection(where: { slug: $slug }, preview: $preview, limit: 1) {
        items {
          name
          slug
          description
        }
      }
    }`,
    isDraftMode,
    { slug, preview: isDraftMode },
  );

  return entries?.data?.categoryCollection?.items?.[0];
}

export async function getPostsByCategory(
  slug: string,
  isDraftMode = false,
): Promise<Post[]> {
  const entries = await fetchGraphQL<PostCollectionResponse>(
    `query GetPostsByCategory($slug: String!, $preview: Boolean) {
      postCollection(where: { category: { slug: $slug } }, order: date_DESC, preview: $preview) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    isDraftMode,
    { slug, preview: isDraftMode },
  );

  return entries?.data?.postCollection?.items ?? [];
}

// Recent posts in a category, capped server-side and fetched with the slim card
// fragment. For listing previews only (categories landing page). Returns partial
// Post objects: see CARD_GRAPHQL_FIELDS note. For the full category index use
// getPostsByCategory, which also needs the full count for pagination.
export async function getRecentPostsByCategory(
  slug: string,
  limit: number,
  isDraftMode = false,
): Promise<CardPost[]> {
  const entries = await fetchGraphQL<CardPostCollectionResponse>(
    `query GetRecentPostsByCategory($slug: String!, $limit: Int!, $preview: Boolean) {
      postCollection(where: { category: { slug: $slug } }, order: date_DESC, preview: $preview, limit: $limit) {
        items {
          ${CARD_GRAPHQL_FIELDS}
        }
      }
    }`,
    isDraftMode,
    { slug, limit, preview: isDraftMode },
  );

  return entries?.data?.postCollection?.items ?? [];
}

export async function getAuthorBySlug(
  slug: string,
  isDraftMode = false,
): Promise<Author | undefined> {
  const entries = await fetchGraphQL<AuthorCollectionResponse>(
    `query GetAuthor($slug: String!, $preview: Boolean) {
      authorCollection(where: { slug: $slug }, preview: $preview, limit: 1) {
        items {
          name
          slug
          bio {
            json
            links {
              assets {
                block {
                  sys { id }
                  url
                  description
                }
              }
            }
          }
          picture { url }
        }
      }
    }`,
    isDraftMode,
    { slug, preview: isDraftMode },
  );

  return entries?.data?.authorCollection?.items?.[0];
}

export async function getPostsByAuthor(
  slug: string,
  isDraftMode = false,
): Promise<CardPost[]> {
  const entries = await fetchGraphQL<CardPostCollectionResponse>(
    `query GetPostsByAuthor($slug: String!, $preview: Boolean) {
      postCollection(where: { author: { slug: $slug } }, order: date_DESC, preview: $preview) {
        items {
          ${CARD_GRAPHQL_FIELDS}
        }
      }
    }`,
    isDraftMode,
    { slug, preview: isDraftMode },
  );

  return entries?.data?.postCollection?.items ?? [];
}

export async function getAllAuthors(
  isDraftMode = false,
): Promise<Author[]> {
  const entries = await fetchGraphQL<AuthorCollectionResponse>(
    `query GetAllAuthors($preview: Boolean) {
      authorCollection(where: { slug_exists: true }, order: name_ASC, preview: $preview) {
        items {
          name
          slug
          picture { url }
        }
      }
    }`,
    isDraftMode,
    { preview: isDraftMode },
  );

  return entries?.data?.authorCollection?.items ?? [];
}
