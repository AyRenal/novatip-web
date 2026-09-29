/**
 * src/app/dashboard/history/page.test.tsx
 *
 * Accessibility tests for the history page's "Load more" control.
 *
 * Covers:
 *   - The number of newly appended rows is announced politely (aria-live)
 *   - The in-flight state is conveyed on the button, not just as a spinner
 *   - Focus is not stolen from the button when a page lands
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HistoryPage from "./page";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const recent = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  analyticsApi: { recent },
  RECENT_TIPS_MAX_LIMIT: 100,
}));

vi.mock("@/contexts/WalletContext", () => ({
  useWallet: () => ({ jwt: "jwt" }),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function makeTips(count: number, startId = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: `tip-${startId + i}`,
    fromAddress: "GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQR",
    amount: "50000000",
    message: "great work",
    ledgerAt: "2024-01-01T00:00:00Z",
  }));
}

/** First page is full (so "Load more" shows); the second page is short. */
function twoPages(secondPageSize: number) {
  recent
    .mockResolvedValueOnce({ tips: makeTips(PAGE_SIZE, 0) })
    .mockResolvedValueOnce({ tips: makeTips(secondPageSize, PAGE_SIZE) });
}

// ── Announcement ──────────────────────────────────────────────────────────────

describe("HistoryPage – load more announcement", () => {
  it("politely announces the number of newly added rows", async () => {
    twoPages(3);
    const user = userEvent.setup();

    render(<HistoryPage />);

    const button = await screen.findByRole("button", { name: "Load more" });
    await user.click(button);

    const status = await screen.findByRole("status");
    await waitFor(() =>
      expect(status).toHaveTextContent("3 more tips loaded."),
    );
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("uses the singular form when exactly one row is added", async () => {
    twoPages(1);
    const user = userEvent.setup();

    render(<HistoryPage />);

    const button = await screen.findByRole("button", { name: "Load more" });
    await user.click(button);

    const status = await screen.findByRole("status");
    await waitFor(() =>
      expect(status).toHaveTextContent("1 more tip loaded."),
    );
  });

  it("does not announce anything for the initial page load", async () => {
    twoPages(3);

    render(<HistoryPage />);

    await screen.findByRole("button", { name: "Load more" });
    expect(screen.getByRole("status")).toHaveTextContent("");
  });
});

// ── In-flight state ───────────────────────────────────────────────────────────

describe("HistoryPage – in-flight state", () => {
  it("conveys the in-flight state on the button while the request is pending", async () => {
    let resolveSecond: (value: { tips: ReturnType<typeof makeTips> }) => void;
    recent
      .mockResolvedValueOnce({ tips: makeTips(PAGE_SIZE, 0) })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const user = userEvent.setup();
    render(<HistoryPage />);

    const button = await screen.findByRole("button", { name: "Load more" });
    await user.click(button);

    // The label changes and aria-busy is set, so the state is conveyed to AT
    // rather than only shown as a spinner.
    const busy = await screen.findByRole("button", { name: "Loading more…" });
    expect(busy).toHaveAttribute("aria-busy", "true");

    resolveSecond!({ tips: makeTips(3, PAGE_SIZE) });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Load more" }),
      ).not.toHaveAttribute("aria-busy"),
    );
  });
});

// ── Focus ─────────────────────────────────────────────────────────────────────

describe("HistoryPage – focus", () => {
  it("keeps focus on the button after a page lands", async () => {
    twoPages(3);
    const user = userEvent.setup();

    render(<HistoryPage />);

    const button = await screen.findByRole("button", { name: "Load more" });
    await user.click(button);

    await screen.findByRole("status");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("3 more tips loaded."),
    );

    expect(button).toHaveFocus();
  });
});
