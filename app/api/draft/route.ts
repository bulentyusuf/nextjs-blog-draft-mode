import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");

  const expected = process.env.CONTENTFUL_PREVIEW_SECRET;
  const valid =
    secret &&
    expected &&
    secret.length === expected.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expected));

  if (!valid) {
    return new Response("Invalid token", { status: 401 });
  }

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  (await draftMode()).enable();
  redirect(`/posts/${slug}`);
}
