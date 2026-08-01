import Link from "next/link";
import type { Tag } from "@/lib/types";

// One pill, two sizes. Extracted from the post page so the border, muted text
// and crimson hover are defined once: cards and the post page drifting apart
// here would be invisible until you saw both in one session.
type Size = "default" | "compact";

// Both sizes are text-sm. `compact` is not smaller type — it is the same type
// with tighter padding. Cards previously used text-xs, which put the tags below
// the date in the visual hierarchy while being the more useful of the two: the
// date is the least informative thing on a card and the tags are what a reader
// scans for. Matching the date's size makes them siblings rather than a
// footnote. Do not shrink it back.
//
// Horizontal padding is deliberately generous for the height. On a rounded-full
// pill the corner radius is half the height, so padding that looks right on a
// rectangle puts the text inside the curve and the label looks wedged in.
// `default` is 28px tall, so 16px clears its 14px radius. `compact` is 24px
// tall, so it needs more than 12px — hence 14px, not the 12px that px-3 would
// give. Do not trim either to match the other.
const SIZES: Record<Size, string> = {
  default: "px-4 py-1 text-sm",
  compact: "px-3.5 py-0.5 text-sm",
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
