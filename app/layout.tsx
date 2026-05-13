import "./globals.css";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
export const metadata = {
  title: {
    default: "Fun with Gen AI",
    template: "%s | Fun with Gen AI",
  },
  description: "Words & Pictures made with Generative AI and a sprinkling of human thinkness.",
};
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
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
          <main>{children}</main>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </section>
      </body>
    </html>
  );
}
