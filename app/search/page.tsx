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
            shows through the ink, which only reads on a light ground, so in
            dark mode it sits on a cream plate. BOTH dark: colours are literal
            hex, never brand tokens: --color-brand-bg flips to near-black (a
            black plate), and --color-brand-crimson is lifted to #E0667A for
            link legibility on dark, which looks washed out on cream — so the
            ink is forced back to the light crimson #A4243B, the same colour on
            cream in both schemes. Light mode carries no plate; the dark:
            variants simply do not apply on the already-cream page. */}
        <figure className="search-empty mx-auto mt-10 max-w-[16rem] text-brand-crimson dark:rounded-3xl dark:bg-[#FAF5F1] dark:p-8 dark:text-[#A4243B]">
          <SearchEmblem />
        </figure>
      </section>
    </Container>
  );
}
