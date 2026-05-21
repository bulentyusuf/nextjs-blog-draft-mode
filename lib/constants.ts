export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulentyusuf.com";

export const SITE_HOSTNAME = new URL(SITE_URL).hostname;

export const SITE_TITLE = "Be Useful.";

export const SITE_DESCRIPTION =
  "Content & Code, with a little help from Generative AI.";

export const SITE_AUTHOR = "Bulent Yusuf";

export const AUTHOR_EMAIL = `noreply@${SITE_HOSTNAME}`;
