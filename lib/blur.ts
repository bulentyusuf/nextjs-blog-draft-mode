import "server-only";
import { CONTENTFUL_IMAGE_HOST } from "./contentful-host";

// Fetches a ~10px version of a Contentful image and returns it as a base64
// data URL for next/image's blurDataURL. Asset URLs are immutable per upload,
// so the default fetch cache makes this a one-time cost per image.
export async function getBlurDataURL(src: string): Promise<string | undefined> {
  try {
    const url = new URL(src.startsWith("//") ? `https:${src}` : src);

    // Host-checked for the same reason lib/contentful-image.tsx checks before
    // appending transform params: `src` is whatever the CMS holds. This one
    // matters more, because it runs on the server and base64s the response body
    // straight into the page, so an off-host URL would make the build fetch an
    // arbitrary address and publish what came back.
    if (url.hostname !== CONTENTFUL_IMAGE_HOST) return undefined;
    url.searchParams.set("w", "10");
    url.searchParams.set("q", "30");
    url.searchParams.set("fm", "webp");
    const res = await fetch(url.toString(), { cache: "force-cache" });
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/webp;base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}
