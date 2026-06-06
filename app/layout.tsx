import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, SITE_REPO_URL } from "@/lib/constants";
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
    locale: "en_US",
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
  themeColor: "#A4243B",
  width: "device-width",
  initialScale: 1,
};
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-brand-crimson shadow-xs">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="text-base font-bold text-white">
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
function Footer() {
  return (
    <footer className="bg-brand-dark">
      <div className="max-w-5xl mx-auto px-5">
        <div className="py-16 flex flex-col lg:flex-row items-center justify-between">
          <p className="text-sm text-center text-white/90 lg:text-left mb-4 lg:mb-0">
            © {new Date().getFullYear()} Bulent Yusuf · Built with Next.js & Contentful
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/authors"
              className="text-sm font-bold text-white hover:opacity-80 transition-opacity duration-200"
            >
              Authors
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-bold text-white hover:opacity-80 transition-opacity duration-200"
            >
              Privacy
            </Link>
            <a
              href={SITE_REPO_URL}
              className="text-sm font-bold text-white hover:opacity-80 transition-opacity duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="/feed.xml"
              className="text-sm font-bold text-white hover:opacity-80 transition-opacity duration-200"
            >
              RSS
            </a>
          </div>
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-brand-bg">
        <Header />
        <main className="grow">{children}</main>
        <Footer />
        {isEnabled && <ExitPreviewButton />}
        <BackToTop />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
