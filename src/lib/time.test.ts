/**
 * src/lib/time.test.ts
 *
 * Unit tests for formatAbsoluteTime.
 *
 * Covers:
 *   - Formats an ISO timestamp into a readable absolute date and time
 *   - Renders it as a local-time string, not the raw ISO/UTC text
 */

import { describe, it, expect } from "vitest";
import { formatAbsoluteTime } from "./time";

describe("formatAbsoluteTime", () => {
  it("formats an ISO timestamp into a readable date and time", () => {
    const result = formatAbsoluteTime("2026-01-05T15:45:12.000Z");
    // Exact wording depends on the runtime's locale data, but it must carry
    // the date, and the reconciliation use case this exists for needs a time.
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("renders a formatted local-time string rather than echoing the raw ISO timestamp", () => {
    const iso = "2026-01-05T15:45:12.000Z";
    expect(formatAbsoluteTime(iso)).not.toBe(iso);
  });
});
