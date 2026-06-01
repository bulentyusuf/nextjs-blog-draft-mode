"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ContentfulImage from "@/lib/contentful-image";

// A single inline body image that opens into a modal lightbox on click.
// Server-rendered as a plain figure; the overlay is portaled to document.body
// only while open. Full a11y: role=dialog/aria-modal, Esc + backdrop close,
// focus trap, focus return to the trigger, body scroll-lock, reduced-motion.
export default function LightboxImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refs for focus management: where focus was before opening (to restore),
  // and the overlay container (to scope the focus trap).
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const titleId = useId();

  // Portals need document.body, which only exists after mount on the client.
  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  // While open: lock body scroll, handle Esc + Tab trapping, move focus in.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Scroll-lock: preserve the scrollbar gutter so layout doesn't jump.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Move focus into the dialog (the close button).
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      // Focus trap: keep Tab / Shift+Tab within the overlay's focusables.
      const root = overlayRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      // Return focus to the trigger (fall back to whatever held it before).
      (triggerRef.current ?? previouslyFocused)?.focus();
    };
  }, [open, close]);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt ? `Enlarge image: ${alt}` : "Enlarge image"}
        className="block w-full cursor-zoom-in focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-crimson focus-visible:ring-offset-2"
      >
        <ContentfulImage
          src={src}
          alt={alt}
          width={1200}
          height={800}
          sizes="(max-width: 768px) 100vw, 800px"
          className="w-full h-auto border-2 border-gray-300"
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={caption ? titleId : undefined}
            aria-label={caption ? undefined : alt || "Enlarged image"}
            onClick={close}
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 md:p-8 ${
              reduceMotion ? "" : "transition-opacity duration-200"
            }`}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close enlarged image"
              className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40 bg-black/40 text-white hover:bg-brand-crimson focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            {/* Stop propagation so clicking the image itself doesn't close. */}
            <figure
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-5xl overflow-auto"
            >
              <ContentfulImage
                src={src}
                alt={alt}
                width={2000}
                height={1333}
                sizes="100vw"
                className="h-auto w-full"
              />
              {caption && (
                <figcaption
                  id={titleId}
                  className="mt-2 text-center text-sm italic text-white/80"
                >
                  {caption}
                </figcaption>
              )}
            </figure>
          </div>,
          document.body,
        )}
    </>
  );
}
