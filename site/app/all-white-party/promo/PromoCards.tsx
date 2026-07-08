"use client";

import { useEffect, useState } from "react";

interface RecentSale {
  name: string;
  tier: string;
  at: string;
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

// Full-screen, screenshot-ready story cards of real anonymized purchases.
export default function PromoCards() {
  const [sales, setSales] = useState<RecentSale[] | null>(null);
  const [totalSold, setTotalSold] = useState(0);

  useEffect(() => {
    fetch("/all-white-party/social")
      .then((r) => r.json())
      .then((d) => {
        setSales(d.recent ?? []);
        setTotalSold(d.totalSold ?? 0);
      })
      .catch(() => setSales([]));
  }, []);

  if (sales === null) {
    return (
      <div className="min-h-screen bg-[#0a0705] text-white/60 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-[#0a0705]" style={{ scrollSnapType: "y mandatory", overflowY: "auto", height: "100vh" }}>
      {/* helper bar — crops out of a screenshot easily */}
      <div className="fixed top-0 inset-x-0 z-10 bg-black/80 text-white/60 text-[11px] text-center py-2 px-4">
        📸 Screenshot any card below → post to your IG story · {sales.length} cards
      </div>

      {sales.length === 0 && (
        <div className="min-h-screen flex items-center justify-center text-white/50 px-8 text-center">
          No sales yet — cards appear here automatically as tickets sell.
        </div>
      )}

      {sales.map((s, i) => (
        <section
          key={i}
          className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
          style={{
            scrollSnapAlign: "start",
            background:
              "radial-gradient(110% 70% at 50% 10%, #2a2016 0%, #140f0a 55%, #0a0705 100%)",
          }}
        >
          <p className="text-[#e0b256] text-[11px] font-bold tracking-[0.4em] uppercase mb-2">
            Tampa Pulse Presents
          </p>
          <h2
            className="text-white font-black text-3xl text-center leading-tight mb-10"
            style={{ fontFamily: "Georgia, serif" }}
          >
            ALL WHITE{" "}
            <span className="italic bg-gradient-to-r from-[#f7dfa0] via-[#e0b256] to-[#b5822c] bg-clip-text text-transparent">
              R&amp;B
            </span>{" "}
            ROOFTOP
          </h2>

          {/* notification-style card */}
          <div className="w-full max-w-sm bg-white/[0.98] rounded-3xl px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f7dfa0] to-[#b5822c] flex items-center justify-center text-2xl shrink-0">
              🎟
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[#1a1208] font-bold text-sm">Tampa Pulse Tickets</p>
                <p className="text-black/40 text-xs shrink-0">{timeAgo(s.at)}</p>
              </div>
              <p className="text-[#1a1208] text-[15px] leading-snug mt-0.5">
                <span className="font-black">{s.name}</span> just grabbed{" "}
                {/^[aeiou]/i.test(s.tier) ? "an" : "a"}{" "}
                <span className="font-black">{s.tier}</span> ticket 🤍
              </p>
            </div>
          </div>

          <p className="text-[#f7dfa0] font-bold text-sm mt-10">
            🔥 {totalSold} claimed — only 35 tickets left in total
          </p>
          <p className="text-white/55 text-xs mt-2">Sat July 25 · 5–9 PM · Hyatt Place Downtown Tampa</p>
          <p className="text-white font-bold text-sm mt-6 tracking-wide">
            mytampapulse.com/all-white-party
          </p>
        </section>
      ))}
    </div>
  );
}
