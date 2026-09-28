/**
 * src/lib/authEvents.test.ts
 *
 * Unit tests for the 401 pub/sub bus that WalletContext uses to
 * tear down a session when the API client sees an unauthorized response.
 *
 * Covers:
 *   - A subscribed listener is notified on emitUnauthorized
 *   - Multiple listeners all receive the notification (fan-out)
 *   - Unsubscribing stops further notifications to that listener
 *   - Emitting with no listeners does not throw
 *   - Unsubscribing twice is a no-op
 */

import { describe, it, expect, vi } from "vitest";
import { onUnauthorized, emitUnauthorized } from "./authEvents";

describe("authEvents", () => {
  it("notifies a subscribed listener on emitUnauthorized", () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    emitUnauthorized();

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("fans out a notification to all subscribed listeners", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const unsubscribeA = onUnauthorized(listenerA);
    const unsubscribeB = onUnauthorized(listenerB);

    emitUnauthorized();

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);

    unsubscribeA();
    unsubscribeB();
  });

  it("stops notifying a listener after it unsubscribes", () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    unsubscribe();
    emitUnauthorized();

    expect(listener).not.toHaveBeenCalled();
  });

  it("does not throw when emitting with no listeners", () => {
    expect(() => emitUnauthorized()).not.toThrow();
  });

  it("is safe to unsubscribe the same listener twice", () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();

    emitUnauthorized();
    expect(listener).not.toHaveBeenCalled();
  });
});
