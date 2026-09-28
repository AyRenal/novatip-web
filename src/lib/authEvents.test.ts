/**
 * src/lib/authEvents.test.ts
 *
 * Unit tests for the authEvents pub/sub bus.
 *
 * Covers:
 *   - A subscribed listener is called on emit
 *   - Multiple listeners are all called on emit
 *   - onUnauthorized's return value stops a listener from being called
 *   - A throwing listener does not stop later listeners from running
 *   - A throwing listener's error is reported, not silently dropped
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { onUnauthorized, emitUnauthorized } from "./authEvents";

describe("authEvents", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls a subscribed listener on emit", () => {
    const listener = vi.fn();
    const unsub = onUnauthorized(listener);

    emitUnauthorized();

    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it("calls every subscribed listener on emit", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onUnauthorized(a);
    const unsubB = onUnauthorized(b);

    emitUnauthorized();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    unsubA();
    unsubB();
  });

  it("stops notifying a listener once it has unsubscribed", () => {
    const listener = vi.fn();
    const unsub = onUnauthorized(listener);
    unsub();

    emitUnauthorized();

    expect(listener).not.toHaveBeenCalled();
  });

  it("still calls later listeners when an earlier one throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const throwing = vi.fn(() => {
      throw new Error("boom");
    });
    const after = vi.fn();
    const unsubThrowing = onUnauthorized(throwing);
    const unsubAfter = onUnauthorized(after);

    expect(() => emitUnauthorized()).not.toThrow();

    expect(throwing).toHaveBeenCalledTimes(1);
    expect(after).toHaveBeenCalledTimes(1);
    unsubThrowing();
    unsubAfter();
  });

  it("reports a throwing listener's error instead of dropping it silently", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    const throwing = vi.fn(() => {
      throw err;
    });
    const unsub = onUnauthorized(throwing);

    emitUnauthorized();

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("authEvents"), err);
    unsub();
  });
});
