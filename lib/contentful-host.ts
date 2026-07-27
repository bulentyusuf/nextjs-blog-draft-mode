// Contentful's Images API host, shared by every module that decides whether a
// CMS-supplied URL can be trusted: lib/contentful-image.tsx before appending
// transform params, and lib/blur.ts before fetching one server-side.
//
// It lives in its own module rather than in lib/constants.ts because
// contentful-image.tsx is a client component, and importing constants.ts there
// would pull the SITE_URL resolver — which reads the server-only
// VERCEL_PROJECT_PRODUCTION_URL — into the client bundle.
export const CONTENTFUL_IMAGE_HOST = "images.ctfassets.net";
