import { clsx } from "clsx";

/**
 * `className` appends, it does not merge — clsx concatenates and knows nothing
 * about Tailwind, so an override lands beside the default rather than replacing
 * it and the winner is decided by source order in the generated stylesheet.
 *
 * Tailwind emits utilities in ascending value order, so a spacing override only
 * works in one direction: a larger value beats the default because it is
 * emitted after it, and a smaller one silently loses. Nothing overrides the
 * padding today — the banded pages briefly passed `pt-10` and it worked, but
 * the gap it made was too large and the band now owns that space instead.
 * Anything needing to REDUCE this padding wants a real prop, not a class.
 */
export default function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("max-w-5xl mx-auto px-5 pt-8 pb-12", className)}>
      {children}
    </div>
  );
}
