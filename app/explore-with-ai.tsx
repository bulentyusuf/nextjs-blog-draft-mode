import { SITE_URL } from "@/lib/constants";

// A small reading-assistance block: hands the current post's URL off to a
// chat tool with a pre-filled, open-ended prompt. No server call, no key —
// these are plain outbound links carrying the post URL as a query param.
//
// The ?q= handoff params are product affordances, not contractual APIs;
// if a provider changes theirs, the corresponding href here needs updating.
export default function ExploreWithAI({ slug }: { slug: string }) {
  const postUrl = `${SITE_URL}/posts/${slug}`;
  const prompt = `Read ${postUrl} and answer my questions about it.`;
  const q = encodeURIComponent(prompt);

  const targets = [
    { label: "Open in ChatGPT", href: `https://chatgpt.com/?q=${q}` },
    { label: "Open in Claude", href: `https://claude.ai/new?q=${q}` },
  ];

  return (
    <nav aria-label="Explore this post with AI" className="text-sm">
      <p className="mb-3 font-bold uppercase tracking-wide text-brand-muted">
        Explore with AI
      </p>
      <ul className="space-y-2">
        {targets.map((t) => (
          <li key={t.href}>
            <a
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block leading-snug text-brand-muted transition-colors duration-200 hover:text-brand-crimson"
            >
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
