"use client";

import { exitPreviewAction } from "./exit-preview-action";

export function ExitPreviewButton() {
  return (
    <form action={exitPreviewAction} className="fixed top-20 right-5 z-40">
      <button
        type="submit"
        className="bg-brand-crimson text-white px-3 py-1.5 rounded-md text-sm font-bold shadow-md hover:opacity-90 transition-opacity duration-200"
      >
        Exit preview
      </button>
    </form>
  );
}
