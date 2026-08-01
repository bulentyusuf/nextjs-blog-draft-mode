import Link from "next/link";
import type { Tag } from "@/lib/types";

// One pill, two sizes. Extracted from the post page so the border, muted text
// and crimson hover are defined once: cards and the post page drifting apart
// here would be invisible until you saw both in one session.
type Size = "default" | "compact";

// Horizontal padding is deliberately generous for the size. On a rounded-full
// pill the corner radius is half the height, so padding that looks right on a
// rectangle puts the text inside the curve and the label looks wedged in.
// `default` needs 16px to clear it at text-sm; `compact` is shorter, so its
// radius is smaller and 12px is enough. Do not trim either to match the other.
const SIZES: Record<Size, string> = {
  default: "px-4 py-1 text-sm",
  compact: "px-3 py-0.5 text-xs",
};

export default function TagPill({
  tag,
  size = "default",
}: {
  tag: Tag;
  size?: Size;
}) {
  return (
    <Link
      href={`/tags#${tag.slug}`}
      className={`inline-block rounded-full border border-hairline ${SIZES[size]} text-brand-muted transition-colors duration-200 hover:border-brand-crimson hover:text-brand-crimson`}
    >
      {tag.name}
    </Link>
  );
}
