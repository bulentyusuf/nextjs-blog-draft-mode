export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulentyusuf.com";

export const SITE_HOSTNAME = new URL(SITE_URL).hostname;

export const SITE_TITLE = "Fun with Gen AI";

export const SITE_DESCRIPTION = "Words & Pictures made with Generative AI.";

export const SITE_AUTHOR = "Bulent Yusuf";

export const AUTHOR_EMAIL = `noreply@${SITE_HOSTNAME}`;
