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

  // /feed.xml is an ordinary ISR route handler. revalidateTag("posts") busts it
  // along with the home and listing pages, since they all render with the posts
  // tag. The path revalidation is the instant on-demand refresh for feed. The
  // sitemap is served from /sitemap-xml and is busted by revalidateTag above.
  revalidatePath("/feed.xml");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
