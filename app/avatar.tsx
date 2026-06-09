import ContentfulImage from "@/lib/contentful-image";
import Link from "next/link";
import type { ReactNode } from "react";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Avatar({
  name,
  picture,
  slug,
  meta,
}: {
  name: string;
  picture?: { url?: string };
  slug?: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-center">
      <div className="mr-4 w-12 h-12 shrink-0">
        {picture?.url ? (
          <ContentfulImage
            alt=""
            className="object-cover h-full w-full rounded-full"
            height={48}
            width={48}
            src={picture.url}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600"
          >
            {initials(name)}
          </div>
        )}
      </div>
      <div className="leading-tight">
        <div className="text-xl font-bold">
          {slug ? (
            <Link href={`/authors/${slug}`} className="hover:text-brand-crimson transition-colors duration-200">
              {name}
            </Link>
          ) : (
            name
          )}
        </div>
        {meta && (
          <div className="mt-1 text-sm font-normal text-gray-600">{meta}</div>
        )}
      </div>
    </div>
  );
}
