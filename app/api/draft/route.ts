import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { safeCompare } from "@/lib/secret";
import { getPostAndMorePosts } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");

  const expected = process.env.CONTENTFUL_PREVIEW_SECRET;
  const valid = safeCompare(secret, expected);

  if (!valid) {
    return new Response("Invalid token", { status: 401 });
  }

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response("Invalid slug", { status: 400 });
  }

  // Resolve the post in preview mode before flipping any state. This keeps the
  // redirect from landing on a 404 with draft mode already enabled, and means
  // we only enable draft mode for a slug that actually exists in the CMS.
  const { post } = await getPostAndMorePosts(slug, true);
  if (!post) {
    return new Response("Unknown slug", { status: 404 });
  }

  (await draftMode()).enable();
  redirect(`/posts/${slug}`);
}
