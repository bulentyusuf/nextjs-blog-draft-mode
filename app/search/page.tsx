import Container from "../container";
import SearchClient from "./search-client";

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
        <h1 className="mb-8 text-4xl leading-tight md:text-5xl lg:text-6xl">
          Search
        </h1>
        <SearchClient />
      </section>
    </Container>
  );
}
