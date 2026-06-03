#!/usr/bin/env node
// Validates that every URL in public/llms.txt still resolves on the live site.
// It validates, it does not regenerate. Prose stays a human decision.
//
// Same-origin failures (4xx/5xx, or a redirect to a different path, which
// usually means a renamed slug) fail the run. External links (e.g. GitHub)
// only warn, so third-party rate limits never break CI.
//
// Usage:  node scripts/check-llms-links.mjs [path-to-llms.txt]
// Env:    SITE_URL  the canonical origin to treat as same-origin
//                   (default https://bulentyusuf.com)

import { readFile } from "node:fs/promises";

const FILE = process.argv[2] || "public/llms.txt";
const SITE_ORIGIN = new URL(
  process.env.SITE_URL || "https://bulentyusuf.com",
).origin;
const TIMEOUT_MS = 15000;

// Strip protocol and trailing slash so http/https and /about vs /about/
// are not counted as differences.
function normalise(u) {
  try {
    const url = new URL(u);
    let path = url.pathname.replace(/\/+$/, "");
    if (path === "") path = "/";
    return `${url.hostname}${path}`;
  } catch {
    return u;
  }
}

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "llms-link-check" },
    });
    const movedPath =
      res.redirected && normalise(res.url) !== normalise(url);
    return { status: res.status, finalUrl: res.url, movedPath };
  } catch (err) {
    return { status: 0, error: err.name === "AbortError" ? "timeout" : err.message };
  } finally {
    clearTimeout(timer);
  }
}

const text = await readFile(FILE, "utf8");
const urls = [
  ...new Set([...text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1])),
];

if (urls.length === 0) {
  console.error(`No URLs found in ${FILE}. Is the path right?`);
  process.exit(1);
}

console.log(`Checking ${urls.length} link(s) in ${FILE}\n`);

let failures = 0;
let warnings = 0;

for (const url of urls) {
  const sameOrigin = new URL(url).origin === SITE_ORIGIN;
  const r = await check(url);

  if (r.status >= 200 && r.status < 300 && !r.movedPath) {
    console.log(`ok    ${r.status}  ${url}`);
    continue;
  }

  const detail = r.error
    ? r.error
    : r.movedPath
      ? `redirects to ${r.finalUrl}`
      : `status ${r.status}`;

  if (sameOrigin) {
    failures++;
    console.log(`FAIL  ${detail}  ${url}`);
  } else {
    warnings++;
    console.log(`warn  ${detail}  ${url}  (external, not failing)`);
  }
}

console.log(
  `\n${urls.length} checked, ${failures} failure(s), ${warnings} warning(s).`,
);
process.exit(failures > 0 ? 1 : 0);
