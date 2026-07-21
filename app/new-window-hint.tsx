// Announced by screen readers immediately after the link text, so a user knows
// the context is about to change. Visually hidden because sighted users get the
// same information from the browser opening a new tab. Kept as a component
// rather than a repeated span so the wording stays identical everywhere and can
// be localised in one place.
export default function NewWindowHint() {
  return <span className="sr-only"> (opens in a new window)</span>;
}
