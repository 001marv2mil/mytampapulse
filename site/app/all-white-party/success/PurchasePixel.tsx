"use client";

import { useEffect } from "react";

// Fires the Meta Pixel Purchase event once per checkout session (guarded via
// sessionStorage so refreshing the confirmation page doesn't double-count).
export default function PurchasePixel({
  sessionId,
  amountCents,
}: {
  sessionId: string;
  amountCents: number | null;
}) {
  useEffect(() => {
    const key = `awp-purchase-tracked-${sessionId}`;
    if (sessionStorage.getItem(key)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq;
    if (typeof fbq !== "function") return;
    fbq("track", "Purchase", {
      value: amountCents !== null ? (amountCents / 100).toFixed(2) : undefined,
      currency: "USD",
      content_name: "All White R&B Rooftop tickets",
    });
    sessionStorage.setItem(key, "1");
  }, [sessionId, amountCents]);

  return null;
}
