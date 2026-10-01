/**
 * src/components/RecentTips.test.ts
 *
 * Unit tests for the pure helpers exported from RecentTips.
 *
 * Covers:
 *   - isPendingConfirmed: returns true when the address is in the indexed list
 *   - isPendingConfirmed: returns false when the address is absent
 */

import { describe, it, expect } from "vitest";
import { isPendingConfirmed } from "./RecentTips";

// ── isPendingConfirmed ────────────────────────────────────────────────────────

describe("isPendingConfirmed", () => {
  const indexed = [
    { fromAddress: "GABC" },
    { fromAddress: "GXYZ" },
  ];

  it("returns true when the pending address appears in the indexed list", () => {
    expect(isPendingConfirmed({ fromAddress: "GABC" }, indexed)).toBe(true);
  });

  it("returns false when the pending address is absent", () => {
    expect(isPendingConfirmed({ fromAddress: "GZZZ" }, indexed)).toBe(false);
  });

  it("returns false for an empty indexed list", () => {
    expect(isPendingConfirmed({ fromAddress: "GABC" }, [])).toBe(false);
  });
});
