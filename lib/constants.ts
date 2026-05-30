export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulentyusuf.com";

function parseHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "bulentyusuf.com";
  }
}

export const SITE_HOSTNAME = parseHostname(SITE_URL);

export const SITE_TITLE = "Be Useful.";

export const SITE_DESCRIPTION =
  "Content & Code, with a little help from Generative AI.";

export const SITE_AUTHOR = "Bulent Yusuf";

// Posts shown per listing page (index and category). On page 1 of the index
// the hero counts as one of these, so every page holds the same number of posts.
export const POSTS_PER_PAGE = 5;

export const AUTHOR_EMAIL = `contact@${SITE_HOSTNAME}`;
