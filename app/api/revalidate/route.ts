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

  revalidateTag("posts", {});

  // /feed.xml and /sitemap.xml are ISR routes. revalidateTag covers the data
  // they read, and these path revalidations are the instant on-demand refresh
  // so neither waits for its time-based fallback after a publish.
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
