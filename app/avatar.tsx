import ContentfulImage from "@/lib/contentful-image";
import type { ReactNode } from "react";

export default function Avatar({
  name,
  picture,
  meta,
}: {
  name: string;
  picture: any;
  meta?: ReactNode;
}) {
  return (
    <div className="flex items-center">
      <div className="mr-4 w-12 h-12 shrink-0">
        <ContentfulImage
          alt={name}
          className="object-cover h-full w-full rounded-full"
          height={48}
          width={48}
          src={picture.url}
        />
      </div>
      <div className="leading-tight">
        <div className="text-xl font-bold">{name}</div>
        {meta && (
          <div className="mt-1 text-sm font-normal text-gray-500">{meta}</div>
        )}
      </div>
    </div>
  );
}
