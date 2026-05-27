import { draftMode } from "next/headers";
import { timingSafeEqual } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expected = process.env.CONTENTFUL_PREVIEW_SECRET;

  const valid =
    secret &&
    expected &&
    secret.length === expected.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expected));

  if (!valid) {
    return new Response("Invalid token", { status: 401 });
  }

  (await draftMode()).disable();
  return new Response("Draft mode is disabled");
}
