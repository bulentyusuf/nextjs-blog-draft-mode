import { draftMode } from "next/headers";
import { safeCompare } from "@/lib/secret";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expected = process.env.CONTENTFUL_PREVIEW_SECRET;

  const valid = safeCompare(secret, expected);

  if (!valid) {
    return new Response("Invalid token", { status: 401 });
  }

  (await draftMode()).disable();
  return new Response("Draft mode is disabled");
}
