import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import BackToTop from "./back-to-top";
import Link from "next/link";

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
        url: "/kompaktkeeb.jpg",
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
    images: ["/kompaktkeeb.jpg"],
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export const viewport = {
  themeColor: "#ffffff",
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
    <header className="w-full bg-[#8B0000]">
      <div className="container mx-auto px-5 py-3">
        <Link
          href="/"
          className="text-base font-bold text-white hover:opacity-80 transition-opacity duration-200"
        >
          {SITE_TITLE}
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-accent-1 border-t border-accent-2">
      <div className="container mx-auto px-5">
        <div className="py-16 flex flex-col lg:flex-row items-center justify-between">
          <p className="text-sm text-center lg:text-left mb-4 lg:mb-0">
            © {new Date().getFullYear()} Bulent Yusuf · Built with Next.js & Contentful
          </p>
          <a
            href="https://github.com/bulentyusuf/nextjs-blog-draft-mode"
            className="text-sm font-bold hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <section className="min-h-screen">
          <Header />
          <main>{children}</main>
          <Footer />
          <BackToTop />
          <Analytics />
          <SpeedInsights />
        </section>
      </body>
    </html>
  );
}
