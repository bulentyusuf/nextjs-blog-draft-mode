"use client";

import { useEffect, useState } from "react";

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
  // Gated on mount for the same reason lib/lightbox-image.tsx is: copying needs
  // navigator.clipboard, so with scripts off this button was still rendered,
  // still took focus, still announced "Copy code", and did nothing — a control
  // that lies. The code itself is selectable text either way, so withholding
  // the button costs a scripts-off visitor nothing. It gates the affordance,
  // not the content.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      ? // On the crimson prompt header. In light mode the white edge is raised to
        // white/60 (3.5:1 vs the crimson bar, clears the 3:1 control-boundary
        // target) and strengthens to white/80 on hover. In dark mode the lifted
        // crimson fails AA with white ink, so the button flips to dark ink on a
        // light wash fill (white/10 keeps the ink at 5.8:1, 6.5:1 on hover) with
        // a surface-dark/70 edge (3.2:1 vs the bar); the dark hover edge is pinned
        // so the light hover:border-white/80 does not leak into dark mode.
        "border border-white/60 bg-white/10 text-white hover:border-white/80 hover:bg-white/20 dark:border-surface-dark/70 dark:bg-white/10 dark:text-surface-dark dark:hover:border-surface-dark/70 dark:hover:bg-white/20"
      : // On the code filename bar / floating over code. In light mode the edge is
        // gray-500 (4.6:1 vs the gray-50 bar, 3.4:1 vs the dark code when floating,
        // both clear the 3:1 control-boundary target) and darkens to gray-600 on
        // hover. In dark mode it gets a dark-surface treatment: a white/40 edge
        // (3.8:1 vs the bar) that BRIGHTENS to white/60 on hover so interacting
        // adds prominence. dark:hover:text-brand-dark pins the ink light on hover,
        // overriding the light-mode hover:text-gray-900 that would otherwise
        // darken it and make the control recede.
        "border border-gray-500 bg-white text-gray-600 hover:border-gray-600 hover:text-gray-900 dark:border-white/40 dark:bg-white/10 dark:text-brand-dark dark:hover:border-white/60 dark:hover:bg-white/20 dark:hover:text-brand-dark";

  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className={`rounded-md px-2 py-1 font-mono text-xs transition-colors ${variantStyles}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? `${noun} copied to clipboard` : ""}
      </span>
    </>
  );
}
