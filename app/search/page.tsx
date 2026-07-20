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
            globals.css). Inline SVG so currentColor picks up the brand token;
            the dark value is lifted off the page ink so the artwork does not
            sink into the near-black background. */}
        <figure className="search-empty mx-auto mt-10 max-w-[16rem] text-brand-crimson dark:text-[#C13A52]">
          <SearchEmblem />
        </figure>
      </section>
    </Container>
  );
}
