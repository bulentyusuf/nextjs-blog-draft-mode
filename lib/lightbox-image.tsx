"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ContentfulImage from "@/lib/contentful-image";

// A single inline body image that opens into a modal lightbox on click.
// Server-rendered as a plain image — the button appears only after mount, so
// with scripts off readers get the image rather than a dead control. The
// overlay is portaled to document.body only while open. Full a11y:
// role=dialog/aria-modal, Esc + backdrop close, focus trap, focus return to the
// trigger, body scroll-lock, reduced-motion.
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

  // A visible caption describes the image already, and it sits immediately
  // after it in the DOM. Repeating the same string as alt — and again in the
  // trigger's label — made one figure announce its description three times:
  // "Enlarge image: <desc>, button", then the img, then the figcaption. So
  // when a caption is present the image goes decorative and the trigger keeps
  // a bare name. With no caption there is nothing else naming the image, and
  // alt carries it as before.
  const describedByCaption = Boolean(caption);
  const imageAlt = describedByCaption ? "" : alt;

  const image = (
    <ContentfulImage
      src={src}
      alt={imageAlt}
      width={1200}
      height={800}
      sizes="(max-width: 768px) 100vw, 672px"
      className="w-full h-auto border-2 border-gray-300 dark:border-brand-dark/15"
    />
  );

  return (
    <>
      {/* The trigger only exists once the script that powers it is running.
          Rendered unconditionally it was a control that lies with JavaScript
          off: focusable, announced as "Enlarge image", cursor-zoom-in, and
          inert on click. The image itself never depended on JS, so degrading
          to a plain image loses nothing — mounted gates the affordance, not
          the content. Same flag the portal already waits on, so this costs no
          extra state and flips immediately after hydration. */}
      {mounted ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={
            describedByCaption || !alt
              ? "Enlarge image"
              : `Enlarge image: ${alt}`
          }
          className="block w-full cursor-zoom-in focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-crimson focus-visible:ring-offset-2"
        >
          {image}
        </button>
      ) : (
        image
      )}

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
              className="flex max-h-full max-w-4xl flex-col"
            >
              <ContentfulImage
                src={src}
                alt={imageAlt}
                width={2000}
                height={1333}
                sizes="100vw"
                // Framed like the inline figure, but the scrim is always black,
                // so a light gray-300 edge would glare — a soft white hairline
                // reads as the same intentional frame here.
                className="max-h-[85vh] w-auto h-auto max-w-full object-contain border-2 border-white/15"
              />
              {caption && (
                <figcaption
                  id={titleId}
                  className="mt-1.5 text-center text-sm italic text-white/80"
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
