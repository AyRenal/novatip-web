/**
 * src/lib/tipUrl.test.ts
 *
 * Unit tests for getTipUrl.
 *
 * Covers:
 *   - Client-side branch uses window.location.origin
 *   - Server-side branch (window undefined) uses config.siteUrl
 *   - No hardcoded domain appears in the server-side output
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Re-import getTipUrl with a patched config so each test controls the
 * siteUrl value without mutating the real module.
 */
async function importWithSiteUrl(siteUrl: string) {
  vi.doMock("./config", () => ({
    config: { siteUrl },
  }));
  const mod = await import("./tipUrl?t=" + siteUrl);
  return mod.getTipUrl;
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

// ── Client-side branch ────────────────────────────────────────────────────────

describe("getTipUrl – client side (window defined)", () => {
  it("uses window.location.origin when window is available", () => {
    // jsdom provides window, so we are already on the client-side path
    // getTipUrl should not use config.siteUrl here
    const { getTipUrl } = require("./tipUrl");
    expect(getTipUrl("alice")).toBe(`${window.location.origin}/alice`);
  });

  it("appends the slug correctly", () => {
    const { getTipUrl } = require("./tipUrl");
    expect(getTipUrl("bob")).toBe(`${window.location.origin}/bob`);
  });

  it("percent-encodes a slug containing characters that need encoding", () => {
    const { getTipUrl } = require("./tipUrl");
    expect(getTipUrl("john doe")).toBe(`${window.location.origin}/john%20doe`);
  });
});

// ── Server-side branch ────────────────────────────────────────────────────────

describe("getTipUrl – server side (window undefined)", () => {
  it("uses config.siteUrl when window is not defined", async () => {
    // Temporarily remove window to simulate the SSR / Node context
    const windowBackup = globalThis.window;
    // @ts-expect-error — intentionally removing window to simulate SSR
    delete globalThis.window;

    try {
      vi.resetModules();
      vi.doMock("./config", () => ({
        config: { siteUrl: "https://example.com/" },
      }));
      const { getTipUrl } = await import("./tipUrl");
      expect(getTipUrl("alice")).toBe("https://example.com/alice");
    } finally {
      globalThis.window = windowBackup;
      vi.resetModules();
    }
  });

  it("strips a trailing slash from siteUrl before appending the slug", async () => {
    const windowBackup = globalThis.window;
    // @ts-expect-error — intentionally removing window to simulate SSR
    delete globalThis.window;

    try {
      vi.resetModules();
      vi.doMock("./config", () => ({
        config: { siteUrl: "https://example.com/" },
      }));
      const { getTipUrl } = await import("./tipUrl");
      // Should be example.com/slug, not example.com//slug
      expect(getTipUrl("charlie")).toBe("https://example.com/charlie");
    } finally {
      globalThis.window = windowBackup;
      vi.resetModules();
    }
  });

  it("reflects a custom deployment domain, not a hardcoded one", async () => {
    const windowBackup = globalThis.window;
    // @ts-expect-error — intentionally removing window to simulate SSR
    delete globalThis.window;

    try {
      vi.resetModules();
      vi.doMock("./config", () => ({
        config: { siteUrl: "https://myapp.example.io/" },
      }));
      const { getTipUrl } = await import("./tipUrl");
      const url = getTipUrl("dana");
      expect(url).toBe("https://myapp.example.io/dana");
      expect(url).not.toContain("novatip.xyz");
    } finally {
      globalThis.window = windowBackup;
      vi.resetModules();
    }
  });

  it("percent-encodes a slug containing characters that need encoding", async () => {
    const windowBackup = globalThis.window;
    // @ts-expect-error — intentionally removing window to simulate SSR
    delete globalThis.window;

    try {
      vi.resetModules();
      vi.doMock("./config", () => ({
        config: { siteUrl: "https://example.com/" },
      }));
      const { getTipUrl } = await import("./tipUrl");
      expect(getTipUrl("john doe")).toBe("https://example.com/john%20doe");
    } finally {
      globalThis.window = windowBackup;
      vi.resetModules();
    }
  });
});

// ── getQrPngUrl ─────────────────────────────────────────────────────────────

describe("getQrPngUrl", () => {
  it("builds the QR PNG URL by appending /qr/<slug>/png to config.apiUrl", async () => {
    const { getQrPngUrl } = await import("./tipUrl");
    const { config } = await import("./config");
    expect(getQrPngUrl("alice")).toBe(`${config.apiUrl}/qr/alice/png`);
  });

  it("handles trailing slashes in config.apiUrl", async () => {
    vi.resetModules();
    vi.doMock("./config", () => ({
      config: { apiUrl: "http://localhost:3001/api/v1/" },
    }));
    const { getQrPngUrl } = await import("./tipUrl");
    expect(getQrPngUrl("bob")).toBe("http://localhost:3001/api/v1/qr/bob/png");
  });

  it("percent-encodes the slug in the QR PNG URL", async () => {
    const { getQrPngUrl } = await import("./tipUrl");
    const { config } = await import("./config");
    expect(getQrPngUrl("john doe")).toBe(`${config.apiUrl}/qr/john%20doe/png`);
  });
});
