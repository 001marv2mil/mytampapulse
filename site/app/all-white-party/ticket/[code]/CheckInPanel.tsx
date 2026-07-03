"use client";

import { useEffect, useState } from "react";

const PIN_STORAGE_KEY = "awp-door-pin";

// Green VALID / red USED card with a PIN-gated check-in button. The PIN is
// remembered on the device after the first successful check-in, so door staff
// only type it once all night.
export default function CheckInPanel({
  code,
  tierName,
  initialStatus,
  initialUsedAt,
  buyerEmail,
  eventDate,
}: {
  code: string;
  tierName: string;
  initialStatus: "valid" | "used";
  initialUsedAt: string | null;
  buyerEmail: string | null;
  eventDate: string;
}) {
  const [status, setStatus] = useState<"valid" | "used">(initialStatus);
  const [usedAt, setUsedAt] = useState<string | null>(initialUsedAt);
  const [pin, setPin] = useState("");
  const [askPin, setAskPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PIN_STORAGE_KEY);
    if (saved) setPin(saved);
  }, []);

  const checkIn = async (pinToUse: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/all-white-party/ticket/${code}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToUse }),
      });
      const data = await res.json();
      if (res.status === 401) {
        localStorage.removeItem(PIN_STORAGE_KEY);
        setAskPin(true);
        setError("Wrong PIN — try again.");
        return;
      }
      if (res.status === 409) {
        setStatus("used");
        setUsedAt(data.used_at ?? null);
        setError(null);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      localStorage.setItem(PIN_STORAGE_KEY, pinToUse);
      setStatus("used");
      setUsedAt(data.used_at ?? new Date().toISOString());
      setAskPin(false);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCheckInTap = () => {
    const saved = localStorage.getItem(PIN_STORAGE_KEY);
    if (saved) {
      void checkIn(saved);
    } else {
      setAskPin(true);
    }
  };

  const usedTime = usedAt
    ? new Date(usedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div
      className={`rounded-3xl p-8 text-center border-2 ${
        status === "valid"
          ? "bg-emerald-500/10 border-emerald-400/70"
          : "bg-red-500/10 border-red-500/60"
      }`}
    >
      {status === "valid" ? (
        <>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-400 flex items-center justify-center text-3xl text-[#0c0a08] font-black">
            ✓
          </div>
          <h2 className="text-3xl font-black text-emerald-300 mb-1">VALID</h2>
        </>
      ) : (
        <>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500 flex items-center justify-center text-3xl text-white font-black">
            ✕
          </div>
          <h2 className="text-3xl font-black text-red-300 mb-1">ALREADY USED</h2>
          {usedTime && <p className="text-red-200/80 text-sm mb-1">Checked in at {usedTime}</p>}
        </>
      )}

      <p className="text-[#f7dfa0] font-bold text-lg mt-3">{tierName}</p>
      <p className="text-white/50 text-xs mt-1">{eventDate}</p>
      <p className="text-white/70 font-mono text-sm tracking-[0.25em] mt-4">{code}</p>
      {buyerEmail && <p className="text-white/40 text-xs mt-1">{buyerEmail}</p>}

      {status === "valid" && (
        <div className="mt-7">
          {!askPin ? (
            <button
              type="button"
              onClick={handleCheckInTap}
              disabled={busy}
              className="w-full bg-emerald-400 disabled:opacity-50 text-[#0c0a08] font-black py-4 rounded-xl text-base"
            >
              {busy ? "Checking in…" : "Check In (staff)"}
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Door PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] text-white placeholder:text-white/30 placeholder:tracking-normal"
              />
              <button
                type="button"
                onClick={() => void checkIn(pin)}
                disabled={busy || pin.length === 0}
                className="w-full bg-emerald-400 disabled:opacity-50 text-[#0c0a08] font-black py-4 rounded-xl text-base"
              >
                {busy ? "Checking in…" : "Confirm Check-In"}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 text-red-300 bg-red-500/10 border border-red-500/30 text-xs rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
