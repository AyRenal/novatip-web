/**
 * lib/time.ts
 *
 * Formats an ISO timestamp into an absolute, human-readable local time.
 *
 * Used as the hover title on relative labels like "3h ago": reconciling a
 * tip against a wallet or a block explorer needs the actual time, which a
 * relative label alone can never give.
 */

export function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}
