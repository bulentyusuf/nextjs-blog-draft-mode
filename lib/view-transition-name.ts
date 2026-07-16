// Assigns a cover view-transition-name at most once per post per render pass.
// The View Transitions spec requires names to be unique on a page; a post that
// appears twice (e.g. hero + list) must be named only on its first occurrence,
// otherwise the duplicate invalidates the entire transition. Reset per request.
export function createCoverNamer() {
  const used = new Set<string>();
  return function coverName(slug: string): string | undefined {
    const name = `cover-${slug}`;
    if (used.has(name)) return undefined;
    used.add(name);
    return name;
  };
}
