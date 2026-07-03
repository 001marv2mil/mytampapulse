"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PIN_STORAGE_KEY = "awp-door-pin";

interface TicketRow {
  code: string;
  tier: string;
  tierName: string;
  status: "valid" | "used";
  guestName: string | null;
}

interface Guest {
  name: string | null;
  email: string | null;
  phone: string | null;
  tickets: TicketRow[];
}

interface FlatRow {
  name: string;
  tierName: string;
  code: string;
  buyer: string;
  email: string;
  phone: string;
  used: boolean;
}

export default function PrintList() {
  const [rows, setRows] = useState<FlatRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pin = localStorage.getItem(PIN_STORAGE_KEY);
    if (!pin) {
      setError("no-pin");
      return;
    }
    fetch("/all-white-party/door/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, status: res.status, data })))
      .then(({ ok, status, data }) => {
        if (status === 401) {
          localStorage.removeItem(PIN_STORAGE_KEY);
          setError("no-pin");
          return;
        }
        if (!ok) {
          setError(data.error || "Could not load the list.");
          return;
        }
        const flat: FlatRow[] = [];
        (data.guests as Guest[]).forEach((g) => {
          g.tickets.forEach((t) => {
            flat.push({
              name: t.guestName || g.name || g.email?.split("@")[0] || "—",
              tierName: t.tierName,
              code: t.code,
              buyer: g.name || g.email?.split("@")[0] || "—",
              email: g.email ?? "—",
              phone: g.phone ?? "—",
              used: t.status === "used",
            });
          });
        });
        flat.sort((a, b) => a.name.localeCompare(b.name));
        setRows(flat);
      })
      .catch(() => setError("Network error — reload the page."));
  }, []);

  if (error === "no-pin") {
    return (
      <div style={{ background: "#fff", color: "#111", minHeight: "100vh", padding: 40, fontFamily: "sans-serif" }}>
        <p>
          This device isn&apos;t signed in as door staff. Open the{" "}
          <Link href="/all-white-party/door" style={{ textDecoration: "underline" }}>
            door list
          </Link>{" "}
          first, enter the PIN, then come back here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", color: "#111", minHeight: "100vh", padding: "28px 32px", fontFamily: "Georgia, serif" }}>
      <style>{`
        @media print { .no-print { display: none !important; } body { background: #fff; } }
        table.guest-sheet { width: 100%; border-collapse: collapse; font-size: 13px; font-family: sans-serif; }
        table.guest-sheet th, table.guest-sheet td { border: 1px solid #999; padding: 7px 9px; text-align: left; }
        table.guest-sheet th { background: #eee; text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em; }
        table.guest-sheet tr { page-break-inside: avoid; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>All White R&amp;B Rooftop — Guest List</h1>
        <button
          type="button"
          className="no-print"
          onClick={() => window.print()}
          style={{ padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "#111", color: "#fff", border: "none", borderRadius: 8 }}
        >
          🖨 Print
        </button>
      </div>
      <p style={{ margin: "0 0 18px", color: "#555", fontSize: 13 }}>
        Saturday, July 25, 2026 · 5–9 PM · Hyatt Place Downtown Tampa
        {rows && (
          <>
            {" "}· <strong>{rows.length}</strong> tickets sold · printed {new Date().toLocaleDateString("en-US")}
          </>
        )}
      </p>

      {!rows && !error && <p style={{ fontFamily: "sans-serif" }}>Loading…</p>}
      {error && error !== "no-pin" && <p style={{ fontFamily: "sans-serif", color: "#b00" }}>{error}</p>}

      {rows && rows.length === 0 && <p style={{ fontFamily: "sans-serif" }}>No tickets sold yet.</p>}

      {rows && rows.length > 0 && (
        <table className="guest-sheet">
          <thead>
            <tr>
              <th style={{ width: 28 }}>✓</th>
              <th>Name</th>
              <th>Tier</th>
              <th>Code</th>
              <th>Buyer</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.code} style={i % 2 ? { background: "#f7f7f7" } : undefined}>
                <td style={{ textAlign: "center", fontSize: 15 }}>{r.used ? "✔" : "☐"}</td>
                <td style={{ fontWeight: 700 }}>{r.name}</td>
                <td>{r.tierName}</td>
                <td style={{ fontFamily: "monospace" }}>{r.code}</td>
                <td>{r.buyer}</td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
