"use client";

/**
 * app/dashboard/qr/page.tsx
 *
 * Dashboard page showing the creator's QR code + share link.
 */

import { useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { authApi } from "@/lib/api";
import { useAbortableRequest } from "@/hooks/useAbortableRequest";
import { QRDownload } from "@/components/QRDownload";
import { getQrPngUrl } from "@/lib/tipUrl";

export default function QRPage() {
  const { jwt }  = useWallet();
  const { data: slug, loading, run } = useAbortableRequest<string | null>(null);

  useEffect(() => {
    if (!jwt) return;
    // A failed lookup just leaves slug at null — same as never having one —
    // so the error itself isn't surfaced here.
    run((signal) => authApi.me(jwt, { signal }).then((r) => r.user.slug));
  }, [jwt, run]);

  const pngUrl = slug ? getQrPngUrl(slug) : "";

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-md">
      <div>
        <h1 className="text-2xl font-bold text-fg">QR Code & Link</h1>
        <p className="text-sm text-fg-subtle mt-1">
          Share or print your QR code so anyone can tap to tip you instantly.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-52 w-52 rounded-2xl bg-hairline" />
          <div className="h-10 w-64 rounded-xl bg-hairline" />
        </div>
      )}

      {!loading && slug && (
        <QRDownload slug={slug} pngUrl={pngUrl} />
      )}

      {!loading && !slug && (
        <p className="text-sm text-fg-faint">
          Complete onboarding to generate your QR code.
        </p>
      )}
    </div>
  );
}
