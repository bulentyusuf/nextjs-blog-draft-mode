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
            Knockout artwork: the hat, face and eye are gaps where the page
            colour shows through the ink, which only reads on a light ground. In
            dark mode it therefore sits on a cream plate and the ink stays brand
            crimson in both schemes. The plate colour is the literal page hex,
            NOT the bg token — the token flips dark and would render a black
            plate. Light mode carries no plate: the page is already cream, so
            the dark: variants simply do not apply. */}
        <figure className="search-empty mx-auto mt-10 max-w-[16rem] text-brand-crimson dark:rounded-3xl dark:bg-[#FAF5F1] dark:p-8">
          <SearchEmblem />
        </figure>
      </section>
    </Container>
  );
}
