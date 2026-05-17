import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const secret = requestHeaders.get("x-vercel-reval-key");

  if (secret !== process.env.CONTENTFUL_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  // Immediate invalidation (expire: 0) instead of stale-while-revalidate.
  // For a CMS webhook we want the next request to fetch fresh data, not serve stale.
  revalidateTag("posts", { expire: 0 });

  // The RSS feed and sitemap use CDN-level cache headers that revalidateTag
  // does not touch, so we invalidate their paths explicitly.
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
