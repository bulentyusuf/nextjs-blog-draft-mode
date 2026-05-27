"use client";

import { ContentfulLivePreviewProvider } from "@contentful/live-preview/react";
import type { ReactNode } from "react";

// Only initialises postMessage listeners when draft mode is on, so production
// visitors don't pay for runtime that only matters in the Contentful editor.
export function Providers({
  children,
  draftEnabled,
}: {
  children: ReactNode;
  draftEnabled: boolean;
}) {
  if (!draftEnabled) return <>{children}</>;

  return (
    <ContentfulLivePreviewProvider
      locale="en-US"
      enableInspectorMode
      enableLiveUpdates
    >
      {children}
    </ContentfulLivePreviewProvider>
  );
}
