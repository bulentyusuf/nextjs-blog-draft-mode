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
        // with white ink, so the button flips to dark ink on a light wash fill
        // (white/10 keeps the ink at 5.8:1, 6.5:1 on hover). The dark edge is
        // raised to surface-dark/70 so the boundary clears 3:1 vs the crimson
        // bar; the fill lightens on hover so the control gains prominence.
        "border border-white/40 bg-white/10 text-white hover:bg-white/20 dark:border-surface-dark/70 dark:bg-white/10 dark:text-surface-dark dark:hover:bg-white/20"
      : // On the code filename bar / floating over code. Light chrome glares on a
        // dark page, so give it a dark-surface treatment in dark mode. The edge
        // is white/40 (3.8:1 vs the bar, clears the 3:1 control-boundary target)
        // and hover BRIGHTENS it — lighter border and fill — so interacting adds
        // prominence. dark:hover:text-brand-dark pins the ink light on hover,
        // overriding the light-mode hover:text-gray-900 that would otherwise
        // darken it and make the control recede.
        "border border-gray-300 bg-white text-gray-600 hover:text-gray-900 dark:border-white/40 dark:bg-white/10 dark:text-brand-dark dark:hover:border-white/60 dark:hover:bg-white/20 dark:hover:text-brand-dark";

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
