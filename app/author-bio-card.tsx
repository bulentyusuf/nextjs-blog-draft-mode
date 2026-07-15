import Link from "next/link";
import ContentfulImage from "@/lib/contentful-image";
import { RichText } from "@/lib/rich-text";
import type { Author } from "@/lib/types";

// A compact author card for the foot of a post: avatar, name, bio, and a link
// to the author's landing page. Renders nothing when the author has no bio —
// the caller must also gate its border/spacing on the same condition so an
// author without a bio leaves no empty shell.
export default function AuthorBioCard({ author }: { author: Author }) {
  if (!author.bio) return null;

  return (
    <aside className="flex gap-5">
      {author.picture?.url && (
        <ContentfulImage
          alt=""
          className="rounded-full object-cover h-18 w-18 shrink-0"
          width={72}
          height={72}
          src={author.picture.url}
        />
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">
          Written by
        </p>
        {/* Not a heading element — the base-layer h1–h3 rule intentionally
            doesn't reach it, so the display face is applied directly. */}
        <p className="mt-1 font-display text-xl font-semibold text-brand-dark">
          {author.name}
        </p>
        <div className="mt-2 text-sm text-brand-muted">
          <RichText content={author.bio} headings={[]} />
        </div>
        {author.slug && (
          <Link
            href={`/authors/${author.slug}`}
            className="mt-3 inline-block text-sm text-brand-crimson hover:underline"
          >
            More posts by {author.name} →
          </Link>
        )}
      </div>
    </aside>
  );
}
