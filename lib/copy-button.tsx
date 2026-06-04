"use client";

import { useState } from "react";

export default function CopyButton({
  code,
  label = "code",
  variant = "light",
}: {
  code: string;
  label?: string;
  variant?: "light" | "dark";
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

  const variantStyles =
    variant === "dark"
      ? "border border-white/40 bg-white/10 text-white hover:bg-white/20"
      : "border border-gray-300 bg-white text-gray-600 hover:text-gray-900";

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className={`rounded-md px-2 py-1 font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variantStyles}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? `${noun} copied to clipboard` : ""}
      </span>
    </>
  );
}
