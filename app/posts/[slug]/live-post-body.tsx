"use client";

import { useContentfulLiveUpdates } from "@contentful/live-preview/react";
import { RichText } from "@/lib/rich-text";
import type { Post } from "@/lib/types";

// Subscribes to postMessage updates from the Contentful editor (gated by the
// provider — outside draft mode the hook just returns the original data).
export default function LivePostBody({ post }: { post: Post }) {
  const updated = useContentfulLiveUpdates(post);
  return <RichText content={updated.content} />;
}
