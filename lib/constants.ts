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

export const AUTHOR_EMAIL = `contact@${SITE_HOSTNAME}`;
