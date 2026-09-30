/**
 * src/hooks/useAuth.test.ts
 *
 * Unit tests for useAuth.
 *
 * Covers:
 *   - requireAuth returns true and does not redirect when connected
 *   - requireAuth redirects to the connect flow and returns false when not connected
 *   - requireAuth keeps a stable identity across renders when its inputs are unchanged
 *   - requireAuth gets a new identity once isConnected actually changes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "./useAuth";

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  return {
    push,
    router: { push },
    wallet: {
      publicKey:    null as string | null,
      jwt:          null as string | null,
      isConnected:  false,
      isConnecting: false,
      error:        null as string | null,
      connect:      vi.fn(),
      disconnect:   vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter:   () => mocks.router,
  usePathname: () => "/dashboard",
}));

vi.mock("@/contexts/WalletContext", () => ({
  useWallet: () => mocks.wallet,
}));

beforeEach(() => {
  mocks.push.mockClear();
  mocks.wallet.isConnected = false;
});

describe("useAuth", () => {
  it("returns true and does not redirect when connected", () => {
    mocks.wallet.isConnected = true;
    const { result } = renderHook(() => useAuth());

    expect(result.current.requireAuth()).toBe(true);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("redirects to the connect flow and returns false when not connected", () => {
    mocks.wallet.isConnected = false;
    const { result } = renderHook(() => useAuth());

    expect(result.current.requireAuth()).toBe(false);
    expect(mocks.push).toHaveBeenCalledWith("/?connect=true&redirect=%2Fdashboard");
  });

  it("keeps a stable requireAuth identity across renders when inputs are unchanged", () => {
    mocks.wallet.isConnected = true;
    const { result, rerender } = renderHook(() => useAuth());
    const first = result.current.requireAuth;

    rerender();

    expect(result.current.requireAuth).toBe(first);
  });

  it("gives requireAuth a new identity once isConnected changes", () => {
    mocks.wallet.isConnected = false;
    const { result, rerender } = renderHook(() => useAuth());
    const first = result.current.requireAuth;

    mocks.wallet.isConnected = true;
    rerender();

    expect(result.current.requireAuth).not.toBe(first);
  });
});
