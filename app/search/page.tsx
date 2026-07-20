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
            globals.css). Inline SVG so currentColor picks up the brand token.
            Knockout artwork: the hat, face and eye are page colour showing
            through the ink, so in dark mode it needs a light ground or it turns
            to mud inside the red ring. The plate is knocked back from the page
            cream so it does not glare against the ink. */}
        <figure className="search-empty mx-auto mt-10 max-w-[14rem] text-brand-crimson dark:rounded-xl dark:bg-[#E9E2DA] dark:p-6">
          <SearchEmblem />
        </figure>
      </section>
    </Container>
  );
}
