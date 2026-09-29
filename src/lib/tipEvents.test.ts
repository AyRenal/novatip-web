/**
 * src/lib/tipEvents.test.ts
 *
 * Unit tests for the tip lifecycle event bus.
 *
 * Covers:
 *   - A subscribed listener receives an emitted payload
 *   - Multiple listeners all receive the same emitted payload (fan-out)
 *   - Unsubscribing stops further delivery to that listener
 *   - Emitting with no listeners does not throw
 *   - Unsubscribing twice is a no-op
 */

import { describe, it, expect, vi } from "vitest";
import { tipEvents, type TipSuccessPayload } from "./tipEvents";

function makePayload(overrides: Partial<TipSuccessPayload> = {}): TipSuccessPayload {
  return {
    fromAddress: "GABCDEF",
    amount: "2",
    message: "nice work",
    slug: "creator-1",
    ...overrides,
  };
}

describe("tipEvents", () => {
  it("delivers an emitted payload to a subscribed listener", () => {
    const listener = vi.fn();
    const unsubscribe = tipEvents.subscribe(listener);

    const payload = makePayload();
    tipEvents.emit(payload);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(payload);

    unsubscribe();
  });

  it("fans out an emitted payload to all subscribed listeners", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const unsubscribeA = tipEvents.subscribe(listenerA);
    const unsubscribeB = tipEvents.subscribe(listenerB);

    const payload = makePayload({ slug: "creator-2" });
    tipEvents.emit(payload);

    expect(listenerA).toHaveBeenCalledWith(payload);
    expect(listenerB).toHaveBeenCalledWith(payload);

    unsubscribeA();
    unsubscribeB();
  });

  it("stops delivering to a listener after it unsubscribes", () => {
    const listener = vi.fn();
    const unsubscribe = tipEvents.subscribe(listener);

    unsubscribe();
    tipEvents.emit(makePayload());

    expect(listener).not.toHaveBeenCalled();
  });

  it("does not throw when emitting with no listeners", () => {
    expect(() => tipEvents.emit(makePayload())).not.toThrow();
  });

  it("is safe to unsubscribe the same listener twice", () => {
    const listener = vi.fn();
    const unsubscribe = tipEvents.subscribe(listener);

    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();

    tipEvents.emit(makePayload());
    expect(listener).not.toHaveBeenCalled();
  });
});
