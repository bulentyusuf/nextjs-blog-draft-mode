import { createHash, timingSafeEqual } from "crypto";

// Hash both sides to a fixed 32-byte digest before comparing. Keeps the
// comparison constant-time, avoids the RangeError timingSafeEqual throws when
// two buffers differ in byte length (e.g. a same-character-length secret with a
// multibyte character), and removes the input-length leak.
const digest = (value: string) => createHash("sha256").update(value).digest();

export function safeCompare(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  return timingSafeEqual(digest(provided), digest(expected));
}
