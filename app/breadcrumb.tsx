import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { jsonLdHtml } from "@/lib/json-ld";

export type Crumb = { label: string; href?: string };

/**
 * `tone` is the surface the trail sits on, not a colour scheme: "light" is the
 * cream page, "dark" is the navy masthead band (app/page-band.tsx). Both tones
 * invert with prefers-color-scheme as usual — brand-band simply does not, so
 * the dark tone's whites are constant.
 *
 * The hover swap is not cosmetic. brand-crimson on the band computes to 1.35:1,
 * so the crimson hover every other link on the site uses would be invisible
 * here; `hover:opacity-80` is what the header nav links already do on navy.
 *
 * Only the dark tone carries focus-visible utilities, and that asymmetry is the
 * rule rather than an oversight. The site has ONE focus indicator, set on
 * :focus-visible in @layer base, and components do not override it — the light
 * tone therefore names nothing and inherits the crimson outline, which clears
 * 3:1 on cream. The band is the documented exception, the same one the header
 * and footer bands take: crimson on this navy does not clear contrast, so the
 * white ring is required, and `outline-hidden` with it is load-bearing rather
 * than decorative because the base outline would otherwise still paint.
 */
type Tone = "light" | "dark";

const TONES: Record<
  Tone,
  {
    nav: string;
    list: string;
    link: string;
    current: string;
    separator: string;
  }
> = {
  light: {
    // Unchanged from every unbanded page: post, about, privacy, search.
    nav: "mb-4",
    list: "text-brand-muted",
    link: "hover:text-brand-crimson transition-colors duration-200",
    current: "font-medium text-brand-dark",
    separator: "text-brand-muted",
  },
  dark: {
    // One step tighter than the light tone, and the only spacing the band
    // changes. The value is the same 16px on both surfaces, but on navy the
    // gap is a slab of colour rather than page background and reads larger,
    // so the trail looks detached from the heading it labels.
    nav: "mb-2",
    list: "text-white",
    link: "hover:opacity-80 transition-opacity duration-200 rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white",
    current: "font-medium text-white",
    // The one translucent white in the band, and it is allowed: the separator
    // is aria-hidden and purely decorative, so 1.4.3 does not reach it. Every
    // text node in here is solid — see app/page-band.tsx.
    separator: "text-white/50",
  },
};

export default function Breadcrumb({
  items,
  tone = "light",
}: {
  items: Crumb[];
  tone?: Tone;
}) {
  // Tone-independent: the structured data describes the trail, not its paint.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  const styles = TONES[tone];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className={styles.nav}>
        <ol
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${styles.list}`}
        >
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={i} className="flex items-center gap-x-2">
                {item.href && !isLast ? (
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? styles.current : undefined}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <span aria-hidden="true" className={styles.separator}>
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
