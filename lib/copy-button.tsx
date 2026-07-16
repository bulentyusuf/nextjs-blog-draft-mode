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
      ? // On the crimson prompt header. In dark mode the lifted crimson fails AA
        // with white ink, so the button flips to dark ink. Its fill stays a
        // LIGHT wash (not a dark tint): darkening the fill would drop the dark
        // ink below 4.5:1, whereas white/10 lifts the local bg so the ink reads
        // at 5.8:1 (6.5:1 on hover), well past AA.
        "border border-white/40 bg-white/10 text-white hover:bg-white/20 dark:border-surface-dark/40 dark:bg-white/10 dark:text-surface-dark dark:hover:bg-white/20"
      : // On the code filename bar / floating over code. Light chrome glares on a
        // dark page, so give it a dark-surface treatment in dark mode.
        "border border-gray-300 bg-white text-gray-600 hover:text-gray-900 dark:border-white/20 dark:bg-white/10 dark:text-brand-dark dark:hover:bg-white/20";

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
