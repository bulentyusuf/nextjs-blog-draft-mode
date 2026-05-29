"use client";

import { useState } from "react";

export default function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context or denied permission). Fail quietly.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-2 top-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-500 transition-colors hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Code copied to clipboard" : ""}
      </span>
    </>
  );
}
