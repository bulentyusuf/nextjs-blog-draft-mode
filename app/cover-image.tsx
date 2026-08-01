import ContentfulImage from "../lib/contentful-image";
import Link from "next/link";
import { clsx as cn } from "clsx";
import { getBlurDataURL } from "@/lib/blur";

// No `title` prop. It existed solely to name the cover link via aria-label,
// which is exactly the duplicate announcement removed below — the image is
// decorative (alt="") and the link is hidden from assistive tech, so there is
// nothing left for a title to name. Callers pass their heading text to their
// own heading link instead.
export default async function CoverImage({
  url,
  slug,
  href,
  sizes,
  wide,
  priority = false,
  hover = false,
  transitionName,
}: {
  url: string;
  slug?: string;
  // Link destination override. When omitted, a `slug` links to /posts/${slug}
  // (the default for post covers and cards). Pass `href` to point the cover
  // elsewhere — e.g. the categories thumbnails link to /categories/${slug}.
  href?: string;
  sizes?: string;
  // When true, the image is 3:2 on mobile and 16:9 on desktop (md+).
  // Used only by the post hero. Omitted everywhere else (cards stay 3:2).
  wide?: boolean;
  // Set on the above-the-fold hero image only (index + post page) so the
  // LCP element is fetched eagerly. Leave false for cards and grids.
  priority?: boolean;
  // Opt-in gentle zoom on hover/keyboard-focus, for interactive listing-card
  // previews only. Off for the homepage hero and post cover (not previews).
  // Reduced-motion users get no movement (motion-safe: prefix), no JS.
  hover?: boolean;
  // Cross-document view-transition name for the cover morph. Set by callers
  // that want this cover to morph into its counterpart on the next page (a
  // card into the post hero). Must be unique per rendered page and match the
  // name on the destination cover. Lives on the outer shadow wrapper — never
  // on the scaling/transform-gpu inner wrapper, which would fight the morph.
  transitionName?: string;
}) {
  // Cold-cache LQIP: a tiny blurred preview underlays the frame so covers show a
  // full colour wash from first paint rather than a stark void. Undefined when
  // the fetch fails — the bg-brand-dark/5 tint on the wrapper is the fallback.
  const blurDataURL = await getBlurDataURL(url);
  // Prefer an explicit href; otherwise fall back to the post route for a slug.
  // The frame is a link (with pointer cursor) whenever either is present.
  const linkHref = href ?? (slug ? `/posts/${slug}` : undefined);
  const image = (
    <ContentfulImage
      alt=""
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      fill
      sizes={
        sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      }
      className={cn("object-cover", {
        // Hover only, no group-focus-within: the link below is removed from
        // the tab order (see there), so keyboard focus never lands inside this
        // group and the focus variant would be a dead rule claiming otherwise.
        // The card title carries the keyboard affordance instead.
        "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.02] pointer-fine:motion-safe:will-change-transform":
          hover,
      })}
      src={url}
    />
  );
  return (
    <div
      className="shadow-lg sm:mx-0"
      style={
        transitionName ? { viewTransitionName: transitionName } : undefined
      }
    >
      <div
        className={cn(
          "relative overflow-hidden bg-brand-dark/5 dark:border dark:border-brand-dark/12",
          wide ? "aspect-3/2 md:aspect-video" : "aspect-3/2",
          {
            "cursor-pointer": linkHref,
            group: hover,
            "motion-safe:transform-gpu": hover,
          },
        )}
      >
        {blurDataURL && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${blurDataURL})` }}
          />
        )}
        {linkHref ? (
          // Mouse affordance only, hidden from assistive tech and the tab
          // order. Every call site that passes a slug or href also renders a
          // heading link to the SAME destination immediately beside this one —
          // the card title in more-stories, the h1 on the home hero, the h2 on
          // the categories index. Named (it used aria-label={title}) that was
          // two adjacent links per card with identical accessible names: twice
          // the tab stops on every listing, and every title appearing twice in
          // a screen reader's link list with nothing to tell the pair apart.
          //
          // aria-hidden and tabIndex must move together. aria-hidden alone on a
          // focusable element is its own violation — a control reachable by
          // keyboard but absent from the accessibility tree.
          //
          // The post-page cover passes neither slug nor href, so it renders no
          // link at all and none of this applies.
          <Link
            href={linkHref}
            aria-hidden="true"
            tabIndex={-1}
            className="block h-full"
          >
            {image}
          </Link>
        ) : (
          image
        )}
      </div>
    </div>
  );
}
