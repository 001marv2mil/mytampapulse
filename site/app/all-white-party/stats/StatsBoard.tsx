"use client";

import { useEffect, useState } from "react";

const PIN_STORAGE_KEY = "awp-door-pin"; // shared with door list + check-in

interface TierStat {
  id: string;
  name: string;
  priceCents: number;
  sold: number;
  capacity: number | null;
  faceRevenueCents: number;
}

interface Stats {
  totalCollectedCents: number;
  totalTickets: number;
  totalOrders: number;
  checkedIn: number;
  tiers: TierStat[];
  recent: { name: string | null; email: string | null; amountCents: number | null; at: string }[];
  abandoned: { name: string | null; email: string; at: string }[];
}

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function StatsBoard() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (pinToUse: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/all-white-party/stats/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToUse }),
      });
      const data = await res.json();
      if (res.status === 401) {
        localStorage.removeItem(PIN_STORAGE_KEY);
        setUnlocked(false);
        setError("Wrong PIN.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not load stats.");
        return;
      }
      localStorage.setItem(PIN_STORAGE_KEY, pinToUse);
      setStats(data);
      setUnlocked(true);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(PIN_STORAGE_KEY);
    if (saved) {
      setPin(saved);
      void load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the money fresh — refresh every 30s while unlocked.
  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => {
      const saved = localStorage.getItem(PIN_STORAGE_KEY);
      if (saved) void load(saved);
    }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div className="bg-white/[0.04] border border-[#e0b256]/40 rounded-2xl p-6 text-center">
        <p className="text-white/70 text-sm mb-4">Enter the door PIN to view sales.</p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] text-white placeholder:text-white/30 placeholder:tracking-normal mb-3"
        />
        <button
          type="button"
          onClick={() => void load(pin)}
          disabled={loading || pin.length === 0}
          className="w-full bg-gradient-to-r from-[#f7dfa0] to-[#b5822c] disabled:opacity-40 text-[#1a1208] font-black py-3.5 rounded-xl"
        >
          {loading ? "Opening…" : "View Sales"}
        </button>
        {error && <p className="mt-3 text-red-300 text-xs">{error}</p>}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Big money number */}
      <div className="bg-white/[0.04] border-2 border-[#e0b256]/60 rounded-2xl px-6 py-7 text-center shadow-[0_0_30px_rgba(224,178,86,0.15)]">
        <p className="text-white/50 text-[11px] uppercase tracking-[0.25em] mb-2">Total Collected</p>
        <p className="text-5xl font-black bg-gradient-to-r from-[#f7dfa0] via-[#e0b256] to-[#b5822c] bg-clip-text text-transparent tabular-nums">
          {money(stats.totalCollectedCents)}
        </p>
        <p className="text-white/40 text-[11px] mt-2">
          {stats.totalTickets} tickets · {stats.totalOrders} orders · before Stripe processing fees
        </p>
      </div>

      {/* Tickets + checked in */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-white tabular-nums">{stats.totalTickets}</p>
          <p className="text-white/50 text-[11px] uppercase tracking-wider">Tickets sold</p>
        </div>
        <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-[#f7dfa0] tabular-nums">{stats.checkedIn}</p>
          <p className="text-white/50 text-[11px] uppercase tracking-wider">Checked in</p>
        </div>
      </div>

      {/* Per-tier breakdown */}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3">
        {stats.tiers.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold">{t.name}</p>
              <p className="text-white/40 text-[11px]">
                {t.sold}
                {t.capacity !== null ? ` / ${t.capacity}` : ""} sold · {money(t.priceCents)} each
              </p>
            </div>
            <p className="text-[#f7dfa0] font-black tabular-nums">{money(t.faceRevenueCents)}</p>
          </div>
        ))}
      </div>

      {/* Recent purchases */}
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
        <p className="text-white/50 text-[11px] uppercase tracking-wider mb-3">Recent purchases</p>
        {stats.recent.length === 0 ? (
          <p className="text-white/40 text-sm">No purchases yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.recent.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 truncate">
                  <span className="text-white font-semibold">{r.name || r.email?.split("@")[0] || "—"}</span>
                  <span className="text-white/35 text-xs ml-2">
                    {new Date(r.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <span className="text-[#f7dfa0] font-bold tabular-nums shrink-0">
                  {r.amountCents !== null ? money(r.amountCents) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abandoned checkouts — follow-up leads */}
      {(stats.abandoned?.length ?? 0) > 0 && (
        <div className="bg-white/[0.04] border border-amber-500/25 rounded-2xl p-4">
          <p className="text-amber-300/80 text-[11px] uppercase tracking-wider mb-1">
            Almost bought — follow up 💬
          </p>
          <p className="text-white/35 text-[11px] mb-3">
            Tapped Pay but never finished. A friendly text or email can win them back.
          </p>
          <div className="space-y-2">
            {stats.abandoned.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 truncate">
                  <span className="text-white font-semibold">{a.name || "—"}</span>
                  <span className="text-white/45 text-xs ml-2">{a.email}</span>
                </div>
                <span className="text-white/35 text-xs shrink-0">
                  {new Date(a.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-white/30 text-[11px]">Updates automatically every 30 seconds</p>
    </div>
  );
}
