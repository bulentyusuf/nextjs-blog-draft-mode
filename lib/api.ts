import { cache } from "react";
import type {
  Post,
  PostCollectionResponse,
  ListPost,
  ListPostCollectionResponse,
  CardPost,
  CardPostCollectionResponse,
  Page,
  PageCollectionResponse,
  PageMeta,
  PageMetaCollectionResponse,
  Category,
  CategoryCollectionResponse,
  Tag,
  TagCollectionResponse,
  BrowseIntro,
  BrowseIntroCollectionResponse,
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
    bio {
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
        inline {
          sys {
            id
          }
          __typename
          ... on Sidenote {
            note {
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
          }
        }
      }
    }
  }
  category {
    name
    slug
  }
  tagsCollection(limit: 3) {
    items {
      name
      slug
    }
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

// Listing fragment for getAllPosts. It is the union of fields the sitewide
// listing consumers actually render — the home hero + cards, pagination, the RSS
// feed, and the sitemap — which is everything in POST_GRAPHQL_FIELDS minus the
// two heavy branches none of them read: the full rich-text `content` (body JSON
// plus every embedded asset and CodeBlock source) and the author `bio`. Omitting
// them keeps the entire body text of every post out of the home/feed/sitemap ISR
// cache entries. Posts returned with this fragment are partial: `content` and
// `author.bio` are absent. The per-post detail page uses POST_GRAPHQL_FIELDS.
//
// tagsCollection rides along because /tags groups this result in memory rather
// than querying per tag: Contentful's GraphQL cannot filter on an Array<Link>
// field at all, and its linkedFrom workaround has no ordering, so a per-tag
// query could not reproduce date_DESC.
//
// These template literals are GraphQL, not JavaScript. A `//` comment inside
// one is a syntax error the API rejects with 400, which fails every post query
// rather than the field it sits next to. Keep prose out here; use `#` if a note
// truly must sit inline.
const LIST_GRAPHQL_FIELDS = `
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
  category {
    name
    slug
  }
  tagsCollection(limit: 3) {
    items {
      name
      slug
    }
  }
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

const GRAPHQL_MAX_ATTEMPTS = 3;
const GRAPHQL_RETRY_BASE_MS = 500;

type RetryDelay = (ms: number) => Promise<void>;

const realRetryDelay: RetryDelay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let retryDelay: RetryDelay = realRetryDelay;

// A test seam, and the only supported way to make the retry loop fast in a
// test. Each retry-exhausting case otherwise spends 1.5 seconds of real time
// waiting, which made the suite roughly two thirds sleep. The tempting
// alternative is to shrink GRAPHQL_RETRY_BASE_MS, but that changes how long
// production actually waits on Contentful in order to suit a test. Replace the
// delay, never the constant. Called with no argument, restores the real one.
export function setRetryDelayForTests(next: RetryDelay = realRetryDelay): void {
  // This has to be exported to be reachable — fetchGraphQL is module-private and
  // the tests drive it through the public getters — which also makes it callable
  // from application code, where disabling the backoff would quietly turn three
  // retries into three immediate hammers on Contentful. Refusing in production
  // keeps the seam useful where it is needed and inert where it is not.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "setRetryDelayForTests must not be called in production. It exists only so the test suite can skip the real backoff.",
    );
  }
  retryDelay = next;
}

// Contentful 5xx and rate-limit responses are usually transient. A 4xx other
// than 429 is a real client error and retrying it only slows the build down.
const GRAPHQL_RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

type GraphQLVariables = Record<string, unknown>;

// The shape every Contentful GraphQL response shares, regardless of query.
// `data` and `errors` can both be present at once.
type GraphQLEnvelope = { data?: unknown; errors?: unknown[] };

// Trimmed because a trailing newline pasted into a host's environment variable
// UI is a common and otherwise baffling failure. An absent variable used to
// produce a request to `/spaces/undefined` and a 404 that named nothing useful.
function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local locally and in your host's environment variables.`,
    );
  }
  return value;
}

async function fetchGraphQL<T>(
  query: string,
  preview = false,
  variables: GraphQLVariables = {},
): Promise<T> {
  const spaceId = requireEnv("CONTENTFUL_SPACE_ID");
  const token = requireEnv(
    preview ? "CONTENTFUL_PREVIEW_ACCESS_TOKEN" : "CONTENTFUL_ACCESS_TOKEN",
  );
  const url = `https://graphql.contentful.com/content/v1/spaces/${spaceId}`;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= GRAPHQL_MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await retryDelay(GRAPHQL_RETRY_BASE_MS * 2 ** (attempt - 2));
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
        next: { tags: ["posts"] },
      });
    } catch (cause) {
      // Socket-level failure rather than an HTTP response. Worth another go.
      // The cause is attached rather than stringified, because the underlying
      // stack is the only thing that distinguishes a DNS failure from a reset
      // connection from a TLS error once this surfaces in a build log.
      lastError = new Error(
        `Contentful GraphQL request failed: ${String(cause)}`,
        {
          cause,
        },
      );
      continue;
    }

    if (!response.ok) {
      const detail = await response.text();
      lastError = new Error(
        `Contentful GraphQL request failed: ${response.status} ${response.statusText} ${detail}`,
      );
      if (GRAPHQL_RETRY_STATUSES.has(response.status)) continue;
      throw lastError;
    }

    // Read as text and parse separately. `response.json()` consumes the body,
    // so a parse failure would otherwise leave nothing to quote back, and the
    // raw SyntaxError names neither Contentful nor the status it arrived with.
    const raw = await response.text();
    let body: GraphQLEnvelope;
    try {
      body = JSON.parse(raw) as GraphQLEnvelope;
    } catch (cause) {
      // A 200 carrying something that is not JSON is a transport fault, not a
      // GraphQL error. It is usually an HTML error page from a proxy or edge
      // node, so it belongs in the retry path rather than thrown outright.
      lastError = new Error(
        `Contentful GraphQL returned an unparseable response: ${response.status} ${response.statusText} ${raw.slice(0, 200)}`,
        { cause },
      );
      continue;
    }

    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const detail = JSON.stringify(body.errors);
      // No `data` at all means the query never ran, so the caller would get
      // undefined and render an empty page with no signal. With `data` present
      // this is almost always an unresolvable link to an unpublished entry,
      // which should warn rather than take a build down.
      if (!body.data) {
        throw new Error(`Contentful GraphQL returned errors: ${detail}`);
      }
      console.warn(`Contentful GraphQL partial response: ${detail}`);
    }

    return body as T;
  }

  throw lastError ?? new Error("Contentful GraphQL request failed");
}

function extractPost(fetchResponse: PostCollectionResponse): Post | undefined {
  return fetchResponse?.data?.postCollection?.items?.[0];
}

function extractCardEntries(
  fetchResponse: CardPostCollectionResponse,
): CardPost[] {
  return fetchResponse?.data?.postCollection?.items ?? [];
}

export async function getAllPosts(isDraftMode = false): Promise<ListPost[]> {
  const entries = await fetchGraphQL<ListPostCollectionResponse>(
    `query GetAllPosts($preview: Boolean) {
      postCollection(where: { slug_exists: true }, order: date_DESC, preview: $preview) {
        items {
          ${LIST_GRAPHQL_FIELDS}
        }
      }
    }`,
    isDraftMode,
    { preview: isDraftMode },
  );

  return entries?.data?.postCollection?.items ?? [];
}

// A single post, listing fragment only — no related/backfill queries and no
// heavy `content`/`bio`. For consumers that need just the post's own fields
// (e.g. generateMetadata), where fetching morePosts via getPostAndMorePosts
// would fire 1–2 extra GraphQL round-trips whose result is then discarded.
// Returns a partial post: `content` and `author.bio` are absent (see ListPost).
export const getPost = cache(
  async (slug: string, preview = false): Promise<ListPost | undefined> => {
    const entry = await fetchGraphQL<ListPostCollectionResponse>(
      `query GetPostMeta($slug: String!, $preview: Boolean) {
      postCollection(where: { slug: $slug }, preview: $preview, limit: 1) {
        items {
          ${LIST_GRAPHQL_FIELDS}
        }
      }
    }`,
      preview,
      { slug, preview },
    );

    return entry?.data?.postCollection?.items?.[0];
  },
);

export const getPostAndMorePosts = cache(
  async (
    slug: string,
    preview = false,
  ): Promise<{ post: Post | undefined; morePosts: CardPost[] }> => {
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
      morePosts = [
        ...morePosts,
        ...recent.filter((p) => !seen.has(p.slug)),
      ].slice(0, 2);
    }

    return { post, morePosts };
  },
);

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

export async function getAllPages(isDraftMode: boolean): Promise<PageMeta[]> {
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

// The editable standfirst and meta description for a browse page.
//
// cache()-wrapped because every page that uses it calls it TWICE: once in
// generateMetadata and once in the component. Next only memoises GET and
// fetchGraphQL issues POST, so without this each of those pages would issue two
// identical requests per render. The two calls must pass the same arguments —
// cache() dedupes identical calls, not equivalent ones — which is why both
// resolve draftMode() first and pass the same slug. Same trap as
// getPostAndMorePosts on the post route.
//
// Returns undefined when no entry exists. Callers fall back rather than throw,
// so a fork with an empty space renders a page with just its heading instead of
// a 500.
export const getBrowseIntro = cache(
  async (
    slug: string,
    isDraftMode = false,
  ): Promise<BrowseIntro | undefined> => {
    const entries = await fetchGraphQL<BrowseIntroCollectionResponse>(
      `query GetBrowseIntro($slug: String!, $preview: Boolean) {
      browseIntroCollection(where: { slug: $slug }, preview: $preview, limit: 1) {
        items {
          title
          slug
          standfirst
          metaDescription
        }
      }
    }`,
      isDraftMode,
      { slug, preview: isDraftMode },
    );

    return entries?.data?.browseIntroCollection?.items?.[0];
  },
);

// Tags with their descriptions, for the /tags glossary.
//
// Deliberately a separate query rather than adding `description` to
// LIST_GRAPHQL_FIELDS' tagsCollection. That fragment feeds the home page, the
// feed and the sitemap, and exists to keep weight out of their ISR entries;
// carrying a gloss on every listing so one page can print it would undo that.
// The glossary joins these to the grouped posts by slug.
export async function getAllTags(isDraftMode = false): Promise<Tag[]> {
  const entries = await fetchGraphQL<TagCollectionResponse>(
    `query GetAllTags($preview: Boolean) {
      tagCollection(where: { slug_exists: true }, order: name_ASC, preview: $preview) {
        items {
          name
          slug
          description
        }
      }
    }`,
    isDraftMode,
    { preview: isDraftMode },
  );

  return entries?.data?.tagCollection?.items ?? [];
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

export const getCategoryBySlug = cache(
  async (slug: string, isDraftMode = false): Promise<Category | undefined> => {
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
  },
);

// Every post in a category, newest first and uncapped — the category index
// paginates this in memory with .slice(), so it needs the whole set to know how
// many pages there are.
//
// Uses the card fragment, not POST_GRAPHQL_FIELDS. Both consumers pass the
// result straight to <MoreStories morePosts={...}>, which takes CardPost[] —
// five fields. Fetching the full fragment pulled every post's rich-text body,
// every embedded CodeBlock's source, every linked asset and the author bio, and
// then rendered an excerpt from it. That whole payload also sat in the ISR cache
// entry for each category page.
//
// If a caller ever needs `category`, `author` or `updatedDate` here, add
// LIST_GRAPHQL_FIELDS rather than reaching back for the full one.
export async function getPostsByCategory(
  slug: string,
  isDraftMode = false,
): Promise<CardPost[]> {
  const entries = await fetchGraphQL<CardPostCollectionResponse>(
    `query GetPostsByCategory($slug: String!, $preview: Boolean) {
      postCollection(where: { category: { slug: $slug } }, order: date_DESC, preview: $preview) {
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

// Recent posts in a category, capped server-side. Same card fragment as
// getPostsByCategory above; the difference is the limit. This one teases a few
// posts on the categories landing page, that one returns the whole category so
// the index can paginate it.
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

export const getAuthorBySlug = cache(
  async (slug: string, isDraftMode = false): Promise<Author | undefined> => {
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
  },
);

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

export async function getAllAuthors(isDraftMode = false): Promise<Author[]> {
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
