import type { Metadata } from "next";
import { SITE_TITLE, SITE_AUTHOR, AUTHOR_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${SITE_TITLE} handles data.`,
};

const LAST_UPDATED = "21 May 2026";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-5">
      <article className="mx-auto max-w-2xl pt-12 pb-24">
        <h1 className="mb-6 text-4xl font-bold tracking-tighter md:text-5xl">
          Privacy
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose">
          <p>
            This is a personal blog. It has no accounts, no comment system, no
            newsletter, and no forms. The site collects as little data as it can
            while still functioning, and what follows is a plain account of what
            that means.
          </p>

          <h2>Who is responsible</h2>
          <p>
            {SITE_AUTHOR} runs this site and decides how the limited data
            described below is handled. You can get in touch at{" "}
            <a href={`mailto:${AUTHOR_EMAIL}`}>{AUTHOR_EMAIL}</a>.
          </p>

          <h2>Analytics</h2>
          <p>
            The site uses Vercel Web Analytics and Vercel Speed Insights to
            understand which pages are read and how quickly they load. These
            tools are privacy-preserving by design: they set no cookies, store
            no persistent identifier on your device, and do not track you across
            other websites. Data is collected in aggregate for statistics only,
            and visitor sessions are discarded automatically after 24 hours.
          </p>

          <h2>Hosting and server logs</h2>
          <p>
            The site is hosted on Vercel, which processes technical request data
            — including IP addresses — on the operator&apos;s behalf in order to
            serve pages and keep the service secure and reliable. This is a
            standard part of how any website is delivered. Vercel acts as a data
            processor for this purpose under its own data processing terms.
          </p>

          <h2>What is not collected</h2>
          <p>
            There are no sign-ups, no tracking cookies, no advertising networks,
            and no third-party social or marketing pixels. Nothing on the site
            asks you to submit personal information.
          </p>

          <h2>Legal basis</h2>
          <p>
            Where the General Data Protection Regulation (GDPR) applies, the
            limited processing described above rests on legitimate interest:
            running a functioning, secure website and understanding its
            readership in aggregate. Because no tracking cookies or persistent
            identifiers are used, the site does not ask for consent through a
            cookie banner.
          </p>

          <h2>Your rights</h2>
          <p>
            If the GDPR or a comparable law applies to you, you have rights over
            your personal data, including the right to ask what is held about
            you, to request correction or deletion, and to object to processing.
            Given how little data this site handles, there is usually nothing
            individual to retrieve — but you are welcome to raise any request at
            the contact address above and it will be handled in good faith.
          </p>

          <h2>Changes</h2>
          <p>
            If this policy changes, the date at the top of the page will be
            updated to reflect it.
          </p>
        </div>
      </article>
    </div>
  );
}
