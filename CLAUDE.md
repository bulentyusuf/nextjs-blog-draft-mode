# Notes for future audits

## Next.js version: 16.x

This repo is on Next.js 16, which has breaking API changes vs. earlier majors. Before flagging an API call as "wrong", check the installed version's type definitions in `node_modules/next/dist/`.

### Specific gotchas seen during audits

- **`revalidateTag(tag, profile)`** — In Next 16 the second argument is **required** (`string | CacheLifeConfig`). `revalidateTag("posts", { expire: 0 })` is correct, not a bug. In Next 14/15 the second arg didn't exist; don't pattern-match from older docs.
- **`params` is a Promise** — Route handlers and page components receive `params: Promise<{ slug: string }>` and must `await` it. Older Next versions passed a plain object.
- **`draftMode()` is async** — Must be awaited: `(await draftMode()).enable()`.
- **`cookies()` / `headers()` are async** — Same as above.

### Verification workflow

When recommending an API change, run `npx next build` locally (or at least `tsc --noEmit`) before reporting it as a fix. Type-check failures are the fastest signal that a "fix" relied on outdated API knowledge.

### CSP notes

Next.js App Router needs `'unsafe-inline'` in `script-src` for hydration. A nonce-based CSP requires middleware that injects a per-request nonce into `<Script>` tags — significantly more invasive.
