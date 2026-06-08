import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { safeCompare } from "@/lib/secret";

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const secret = requestHeaders.get("x-vercel-reval-key");
  const expected = process.env.CONTENTFUL_REVALIDATE_SECRET;

  if (!safeCompare(secret, expected)) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("posts", { expire: 0 });

  // /feed.xml and /sitemap.xml are ISR route handlers. revalidateTag covers
  // the data they read, and these path revalidations are the instant
  // on-demand refresh so neither waits for its 24h time-based fallback.
  revalidatePath("/feed.xml");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
