import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { safeCompare } from "@/lib/secret";

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

  (await draftMode()).enable();
  redirect(`/posts/${slug}`);
}
