import type { ReactNode } from "react";
import Container from "./container";
import PageBand from "./page-band";
import { type Crumb } from "./breadcrumb";

/**
 * The shell every browsing page shares — the four section fronts and all six
 * taxonomy listings.
 *
 * It exists because those ten pages were two implementations of one design.
 * TaxonomyListing owned six of them; the four fronts each hand-rolled the same
 * `<><PageBand/><Container/></>` pair. Every tuning pass then had to be applied
 * twice and the halves drifted every time one was missed — the raised h1 ramp
 * reached the fronts and not the listings, and the standfirst colour was fixed
 * on the fronts while the listings still painted body ink on navy. Neither was
 * a typo; both were the second copy nobody edited.
 *
 * So the vertical rhythm of a browse page is defined once, here:
 *
 *   band      py-8 md:py-10   symmetric, because the band is a block and an
 *                             uneven inset reads as a mistake rather than a
 *                             hierarchy
 *   gap       pt-6 md:pt-8    cream, band edge to first content. Deliberately
 *                             SMALLER than the band's own inset: the band has
 *                             already drawn the boundary, so this space only
 *                             has to stop the content touching it. It used to
 *                             be Container's pt-8 on top of a pb-14 band, and
 *                             the two summed to 96px, which read as a hole.
 *   close     pb-12           Container's own, unchanged, down to the footer
 *
 * The band's bottom inset and this gap are different colours, so they cannot
 * collapse into a single number — one is navy and belongs to the band, the
 * other is cream and belongs to the page. They do add up in the eye, which is
 * why they are set here together rather than in two files.
 *
 * `header` is the band's contents and `children` is everything on cream. The
 * split is by SURFACE, not by importance: anything that cannot render on navy
 * belongs in children, which is why an author's RichText bio is passed down
 * there rather than into the band beside the portrait.
 */
export default function BrowsePage({
  crumbs,
  header,
  children,
}: {
  crumbs: Crumb[];
  /** Band contents — the h1, a standfirst, whatever sits beside them. */
  header: ReactNode;
  /** Everything below the band, on cream. */
  children: ReactNode;
}) {
  return (
    <>
      <PageBand crumbs={crumbs}>{header}</PageBand>
      <Container topPad="tight">{children}</Container>
    </>
  );
}
