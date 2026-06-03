import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "./container";

export const metadata: Metadata = {
  title: "Page not found",
};

// The root layout already supplies the header, footer and back-to-top, so this
// renders only the inner block.
//
// Asset: drop an optimised image at public/404-gremlin.webp (generated in the
// house Midjourney style, exported to webp). The wobble is disabled for anyone
// who prefers reduced motion, who then sees the still image.
//
// Copy is yours to tweak.
export default function NotFound() {
  return (
    <Container>
      <style>{`
        @keyframes gremlin-wobble {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .gremlin-img { animation: gremlin-wobble 2.4s ease-in-out infinite; transform-origin: center bottom; }
        @media (prefers-reduced-motion: reduce) {
          .gremlin-img { animation: none; }
        }
      `}</style>

      <section className="mx-auto max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/404-gremlin.webp"
            alt="A gremlin yanking a power plug out of the wall"
            width={720}
            height={480}
            priority
            className="gremlin-img w-full max-w-md h-auto rounded-lg"
          />
        </div>

        <p className="text-sm font-bold uppercase tracking-wide text-brand-crimson">
          404
        </p>
        <h1 className="mt-4 text-4xl lg:text-6xl leading-tight font-bold">
          A gremlin pulled the plug on this one.
        </h1>
        <p className="mt-6 text-lg leading-relaxed">
          The page you wanted is unplugged, moved, or never existed. Here are a
          few ways back.
        </p>

        <nav
          aria-label="Helpful links"
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
        >
          <Link
            href="/"
            className="text-base font-bold text-brand-crimson hover:opacity-80 transition-opacity duration-200"
          >
            Home
          </Link>
          <Link
            href="/categories"
            className="text-base font-bold text-brand-crimson hover:opacity-80 transition-opacity duration-200"
          >
            Categories
          </Link>
          <Link
            href="/authors"
            className="text-base font-bold text-brand-crimson hover:opacity-80 transition-opacity duration-200"
          >
            Authors
          </Link>
        </nav>
      </section>
    </Container>
  );
}
