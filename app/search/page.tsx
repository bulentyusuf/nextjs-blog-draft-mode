import Container from "../container";
import SearchClient from "./search-client";
import SearchEmblem from "./search-emblem";

// noindex: a search page is thin content by definition and search engines
// should discover posts directly, not via this page.
export const metadata = {
  title: "Search",
  description: "Search every post on the site.",
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <Container>
      <section className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-4xl md:text-5xl">
          Search
        </h1>
        <SearchClient />
        {/* Empty state. Hidden by CSS as soon as the input has text (see
            globals.css). Inline SVG so currentColor picks up the ink colour.
            Knockout artwork: the hat, face and eye are gaps where the ground
            shows through the ink, which only reads on a light ground. In dark
            mode the cream ground is the glass's own silhouette, drawn inside the
            SVG (see search-emblem.tsx), so the whole magnifying glass is lit and
            there is no floating plate. The ink is forced to the light crimson
            #A4243B in dark mode (never the token, which is lifted to #E0667A for
            link legibility and looks washed out on cream): the emblem is on
            cream in both schemes, so it should be the same colour in both. p-8,
            shared by both schemes, sets a single emblem size across light and
            dark. */}
        <figure className="search-empty mx-auto mt-10 max-w-[16rem] p-8 text-brand-crimson dark:text-[#A4243B]">
          <SearchEmblem />
        </figure>
      </section>
    </Container>
  );
}
