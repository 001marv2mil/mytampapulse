"use client";

import { useEffect } from "react";

const GROUP_CHAT_URL = "https://ig.me/j/Aba2w1bw2-8hDHrK/";

// A server-side redirect never runs JS, so the Meta Pixel would never fire for
// ad clicks landing here. This renders briefly, fires the Lead event, then redirects.
export default function LobbyRedirectPage() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("track", "Lead", { content_name: "All White Party Lobby Chat" });
    }
    const timer = setTimeout(() => {
      window.location.replace(GROUP_CHAT_URL);
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
      Walking you into the Lobby…
    </div>
  );
}
