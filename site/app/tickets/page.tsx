"use client";

import { useEffect } from "react";

const CHECKOUT_URL = "/all-white-party";

// A server-side redirect never runs JS, so the Meta Pixel would never fire for
// ad clicks landing here. This renders briefly, fires its own Lead event
// (distinct content_name = separate tracking for this ad set), then redirects.
export default function TicketsRedirectPage() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("track", "Lead", { content_name: "All White Party Direct Checkout" });
    }
    const timer = setTimeout(() => {
      window.location.replace(CHECKOUT_URL);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      Taking you to tickets…
    </div>
  );
}
