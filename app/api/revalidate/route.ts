import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const secret = requestHeaders.get("x-vercel-reval-key");
  const expected = process.env.CONTENTFUL_REVALIDATE_SECRET;

  if (!secret || !expected || !safeCompare(secret, expected)) {
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
