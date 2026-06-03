"use client";

import { useState } from "react";

export default function CopyButton({
  code,
  label = "code",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const noun = label.charAt(0).toUpperCase() + label.slice(1);

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
        aria-label={`Copy ${label}`}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 font-mono text-xs text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? `${noun} copied to clipboard` : ""}
      </span>
    </>
  );
}
