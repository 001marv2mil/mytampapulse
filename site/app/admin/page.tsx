"use client";

import { useEffect, useState } from "react";

interface Stats {
  subscribers: { active: number; new7d: number; new30d: number; unsubscribed: number };
  referrals: { total: number; top: { email: string; count: number }[] };
  shares: {
    total: number;
    byMethod: Record<string, number>;
    byCta: Record<string, number>;
    byIssue: Record<string, number>;
    recent: { share_method: string; share_cta: string; issue_number: number; created_at: string }[];
  };
  generatedAt: string;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: "#111",
      border: "1px solid #222",
      borderRadius: 14,
      padding: "24px 28px",
      flex: 1,
      minWidth: 140,
    }}>
      <p style={{ color: "#555", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>{label}</p>
      <p style={{ color: "#fff", fontSize: 36, fontWeight: 900, margin: "0 0 4px", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState("");
  const [inputSecret, setInputSecret] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("secret");
    if (s) { setSecret(s); fetchStats(s); }
  }, []);

  async function fetchStats(s: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/stats?secret=${s}`);
      if (!res.ok) { setError("Wrong password."); setLoading(false); return; }
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Failed to load.");
    }
    setLoading(false);
  }

  if (!secret) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 360, padding: "0 20px" }}>
          <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Tampa <span style={{ color: "#FF5A36" }}>Pulse</span></p>
          <p style={{ color: "#555", fontSize: 13, marginBottom: 28 }}>Admin Dashboard</p>
          <input
            type="password"
            placeholder="Enter password"
            value={inputSecret}
            onChange={e => setInputSecret(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && inputSecret) { setSecret(inputSecret); fetchStats(inputSecret); }}}
            style={{ width: "100%", background: "#111", border: "1px solid #222", borderRadius: 10, padding: "14px 16px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }}
          />
          <button
            onClick={() => { if (inputSecret) { setSecret(inputSecret); fetchStats(inputSecret); }}}
            style={{ width: "100%", background: "#FF5A36", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
          >
            Enter
          </button>
          {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 10, textAlign: "center" }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#555", fontFamily: "system-ui, sans-serif" }}>Loading...</p>
      </div>
    );
  }

  if (!stats) return null;

  const generatedAt = new Date(stats.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "system-ui, -apple-system, sans-serif", color: "#fff", padding: "40px 24px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>Tampa <span style={{ color: "#FF5A36" }}>Pulse</span></p>
          <p style={{ fontSize: 12, color: "#444", margin: 0 }}>Updated {generatedAt}</p>
        </div>

        {/* Subscriber cards */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Subscribers</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
          <StatCard label="Total Active" value={stats.subscribers.active} />
          <StatCard label="New (7 days)" value={stats.subscribers.new7d} />
          <StatCard label="New (30 days)" value={stats.subscribers.new30d} />
          <StatCard label="Unsubscribed" value={stats.subscribers.unsubscribed} />
        </div>

        {/* Referral cards */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Referrals</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: stats.referrals.top.length > 0 ? 16 : 28 }}>
          <StatCard label="Total Referrals" value={stats.referrals.total} sub="via share links" />
        </div>

        {stats.referrals.top.length > 0 && (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>Top Referrers</p>
            {stats.referrals.top.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < stats.referrals.top.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>{r.email}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#FF5A36", margin: 0 }}>{r.count} refs</p>
              </div>
            ))}
          </div>
        )}

        {/* Shares */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Shares</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <StatCard label="Total Shares" value={stats.shares.total} />
          {Object.entries(stats.shares.byMethod).map(([method, count]) => (
            <StatCard key={method} label={method} value={count} sub="clicks" />
          ))}
        </div>

        {stats.shares.recent.length > 0 && (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>Recent Shares</p>
            {stats.shares.recent.slice(0, 10).map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < Math.min(stats.shares.recent.length, 10) - 1 ? "1px solid #1a1a1a" : "none" }}>
                <div>
                  <p style={{ fontSize: 13, color: "#fff", fontWeight: 600, margin: "0 0 2px" }}>{s.share_method}</p>
                  <p style={{ fontSize: 11, color: "#555", margin: 0 }}>{s.share_cta || "—"}</p>
                </div>
                <p style={{ fontSize: 11, color: "#444", margin: 0 }}>{new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              </div>
            ))}
          </div>
        )}

        {stats.shares.total === 0 && (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 14, padding: "28px 24px", textAlign: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 28, margin: "0 0 8px" }}>🕶️</p>
            <p style={{ fontSize: 14, color: "#555", margin: 0 }}>No shares yet. Check back soon.</p>
          </div>
        )}

        <p style={{ fontSize: 11, color: "#333", textAlign: "center" }}>Tampa Pulse Admin · {generatedAt}</p>
      </div>
    </div>
  );
}
