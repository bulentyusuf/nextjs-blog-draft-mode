import "./globals.css";
import { Inter, Fraunces } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, SITE_REPO_URL, SITE_FOOTER_BLURB, BRAND_HEADER_COLOR, BRAND_HEADER_COLOR_DARK, DEFAULT_LOCALE, DEFAULT_OG_LOCALE } from "@/lib/constants";
import { getAllCategories } from "@/lib/api";
import type { Category } from "@/lib/types";
import BackToTop from "./back-to-top";
import Link from "next/link";
import { draftMode } from "next/headers";
import { ExitPreviewButton } from "./exit-preview-button";
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    images: [
      {
        url: "/be_useful.jpg",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
    type: "website",
    locale: DEFAULT_OG_LOCALE,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/be_useful.jpg"],
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};
export const viewport = {
  // Scheme-aware so the mobile address bar matches the header band in both
  // modes. colorScheme lets the UA theme native controls and scrollbars.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_HEADER_COLOR },
    { media: "(prefers-color-scheme: dark)", color: BRAND_HEADER_COLOR_DARK },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});
function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-brand-header shadow-xs">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="font-display text-lg font-semibold text-white">
            {SITE_TITLE}
          </Link>
          <p className="hidden lg:block text-sm text-white/90">{SITE_DESCRIPTION}</p>
        </div>
        <nav aria-label="Primary" className="flex items-center gap-4 md:gap-6">
          <Link
            href="/categories"
            className="text-sm font-bold text-white hover:opacity-80 transition-opacity duration-200"
          >
            Categories
          </Link>
          <Link
            href="/about"
            className="text-sm font-bold text-white hover:opacity-80 transition-opacity duration-200"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
// Shared link treatment for the footer: quiet by default, visible focus ring
// matching the skip-link convention above.
const footerLink =
  "text-white/80 hover:text-white transition-colors duration-200 rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white";

async function Footer() {
  // A Contentful outage must not break the layout shell. On any error (or an
  // empty result) we fall back to a single "All categories" link.
  let categories: Category[] = [];
  let categoriesFailed = false;
  try {
    categories = await getAllCategories();
  } catch {
    categoriesFailed = true;
  }
  const showCategoryList = !categoriesFailed && categories.length > 0;

  return (
    <footer className="bg-footer-bg text-white">
      <div className="max-w-5xl mx-auto px-5 py-16">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr] md:gap-12">
          {/* Column 1 — masthead + blurb */}
          <div>
            <p className="font-display text-2xl font-semibold text-white">
              {SITE_TITLE}
            </p>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              {SITE_FOOTER_BLURB}
            </p>
          </div>

          {/* Column 2 — browse: dynamic categories, then static section links.
              The static links never disappear, even when the fetch fails. */}
          <nav aria-label="Browse">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">
              Browse
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {showCategoryList ? (
                categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/categories/${category.slug}`} className={footerLink}>
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/categories" className={footerLink}>
                    All categories
                  </Link>
                </li>
              )}
              <li>
                <Link href="/authors" className={footerLink}>
                  Authors
                </Link>
              </li>
              <li>
                <Link href="/about" className={footerLink}>
                  About
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 3 — colophon */}
          <nav aria-label="Colophon">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">
              Colophon
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={SITE_REPO_URL}
                  className={footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Fork this blog on GitHub
                </a>
              </li>
              <li>
                <a href="/feed.xml" className={footerLink}>
                  RSS feed
                </a>
              </li>
              <li>
                <Link href="/privacy" className={footerLink}>
                  Privacy
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Bulent Yusuf · Built with Next.js &
            Contentful · Type set in Fraunces and Inter
          </p>
        </div>
      </div>
    </footer>
  );
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled } = await draftMode();
  return (
    <html lang={DEFAULT_LOCALE} className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col bg-brand-bg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand-header focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
        >
          Skip to content
        </a>
        <link rel="preconnect" href="https://images.ctfassets.net" />
        <Header />
        <main id="main" className="grow">{children}</main>
        <Footer />
        {isEnabled && <ExitPreviewButton />}
        <BackToTop />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
