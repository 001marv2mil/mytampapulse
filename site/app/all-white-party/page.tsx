"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import TampaPulseLogo from "@/components/TampaPulseLogo";
import {
  EVENT,
  TIERS,
  FEES,
  FAQ,
  MAX_PER_TIER,
  LOW_STOCK_THRESHOLD,
  computeFeeCents,
  tierRemaining,
  isSoldOut,
  formatPrice,
  type TierId,
} from "@/lib/all-white-party";

const SCRIPT = { fontFamily: "var(--font-script)" } as const;
const DISPLAY = { fontFamily: "var(--font-display)" } as const;

// Self-hosted Leaflet + Esri satellite tiles (public/venue-map.html).
// Same-origin iframe — no API key, no CSP friction, real aerial imagery.
const MAP_SRC = "/venue-map.html";

// Correct EXTERIOR Street View via the Street View Static API. `source=outdoor`
// forces the street-level photo (not the indoor business 360). Needs a free
// Google Maps key in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; falls back to map-only.
const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const STREETVIEW_IMG = GMAPS_KEY
  ? `https://maps.googleapis.com/maps/api/streetview?size=800x450&location=${EVENT.lat},${EVENT.lng}&fov=80&pitch=5&source=outdoor&key=${GMAPS_KEY}`
  : null;

export default function AllWhitePartyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0c0a08]" />}>
      <AllWhitePartyCheckout />
    </Suspense>
  );
}

function AllWhitePartyCheckout() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";

  const [qty, setQty] = useState<Record<TierId, number>>({ earlybird: 0, ga: 0, vip: 0, founder: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Lock background scroll while the ticket modal is open
  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  const setTierQty = (id: TierId, next: number) => {
    const tier = TIERS.find((t) => t.id === id)!;
    const remaining = tierRemaining(tier);
    const cap = remaining === null ? MAX_PER_TIER : Math.min(MAX_PER_TIER, remaining);
    const clamped = Math.max(0, Math.min(cap, next));
    setQty((q) => ({ ...q, [id]: clamped }));
  };

  const selected = useMemo(
    () => TIERS.map((t) => ({ tier: t, count: qty[t.id] })).filter((row) => row.count > 0),
    [qty]
  );

  const totalTickets = selected.reduce((sum, r) => sum + r.count, 0);
  const subtotalCents = selected.reduce((sum, r) => sum + r.tier.priceCents * r.count, 0);
  const feeCents = computeFeeCents(subtotalCents, totalTickets);
  const grandTotalCents = subtotalCents + feeCents;
  const fromPrice = Math.min(...TIERS.filter((t) => !isSoldOut(t)).map((t) => t.priceCents));

  const handleCheckout = async () => {
    if (totalTickets === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/all-white-party/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selected.map((r) => ({ id: r.tier.id, qty: r.count })) }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout. Please try again.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a08] text-white">
      {/* ===== HERO / COVER ===== */}
      <section
        className="relative overflow-hidden px-6 pt-28 pb-20 text-center"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, #4a3826 0%, #2a2016 38%, #140f0a 72%, #0c0a08 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 0%, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0) 70%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto">
          {/* mytampapulse logo — shows a clean "T" by default, auto-swaps to the real
              logo image the moment /tampa-pulse-logo.png exists (no broken-image flash) */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
            {/* hidden probe: fires onLoad only if the file is actually there */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tampa-pulse-logo.png" alt="" aria-hidden="true" className="hidden" onLoad={() => setLogoLoaded(true)} />
            {logoLoaded ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/tampa-pulse-logo.png"
                alt="Tampa Pulse"
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <TampaPulseLogo className="w-11 h-11 drop-shadow-[0_0_10px_rgba(255,90,54,0.45)]" />
            )}
            <span className="font-heading font-bold text-white text-base">mytampapulse</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Optional flyer cover image (set EVENT.flyerImage to enable) */}
            {EVENT.flyerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={EVENT.flyerImage}
                alt={`${EVENT.name} flyer`}
                className="mx-auto mb-10 w-full max-w-sm rounded-2xl shadow-2xl shadow-black/60 border border-[#D4AF37]/20"
              />
            ) : null}

            <p className="text-[#F0D488] text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase mb-6">
              Good People <span className="text-[#D4AF37]">•</span> Good Vibes{" "}
              <span className="text-[#D4AF37]">•</span> Good Times
            </p>

            <h1 className="leading-none">
              <span style={DISPLAY} className="block text-white font-black uppercase tracking-tight text-6xl sm:text-7xl md:text-8xl">
                All White
              </span>
              <span style={SCRIPT} className="block -mt-3 sm:-mt-4 mb-1 text-6xl sm:text-7xl md:text-8xl bg-gradient-to-b from-[#F6E3A8] via-[#D4AF37] to-[#A97B1E] bg-clip-text text-transparent">
                R&amp;B
              </span>
            </h1>

            <div className="flex items-center justify-center gap-4 mb-7">
              <span className="h-px w-10 sm:w-16 bg-[#D4AF37]/60" />
              <span className="font-heading text-sm sm:text-lg font-bold tracking-[0.55em] text-white/90 uppercase pl-[0.55em]">
                Night
              </span>
              <span className="h-px w-10 sm:w-16 bg-[#D4AF37]/60" />
            </div>

            <div className="inline-flex items-center gap-2 border border-[#D4AF37]/40 rounded-full px-4 py-1.5 mb-6">
              <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8 4.8 17.2l1-5.8L1.5 7.2l5.9-.9L10 1z" />
              </svg>
              <span className="text-[#F0D488] text-[10px] font-bold tracking-[0.25em] uppercase">
                Tampa&apos;s Premier R&amp;B Experience
              </span>
            </div>

            <p className="text-white/85 text-sm sm:text-base font-semibold tracking-wide mb-1">
              Music by <span className="text-[#F0D488]">Tampa&apos;s Top R&amp;B DJ</span>
            </p>
            <p className="text-white/45 text-[11px] tracking-[0.2em] uppercase mb-6">
              Classics <span className="text-[#D4AF37]">•</span> Slow Jams{" "}
              <span className="text-[#D4AF37]">•</span> New Flavor
            </p>

            {/* Press-play vibe — AUDIO ONLY, autoplays the mix from 1:39 (no video) */}
            <div className="mb-9">
              {playing ? (
                <div className="inline-flex items-center gap-3 bg-white/[0.06] border border-[#D4AF37]/40 rounded-full pl-2 pr-2.5 py-2">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-r from-[#F0D488] to-[#D4AF37] flex items-center justify-center">
                    <span className="flex items-end gap-[3px] h-4">
                      <span className="awp-eq-bar" style={{ animationDelay: "0ms" }} />
                      <span className="awp-eq-bar" style={{ animationDelay: "150ms" }} />
                      <span className="awp-eq-bar" style={{ animationDelay: "300ms" }} />
                      <span className="awp-eq-bar" style={{ animationDelay: "450ms" }} />
                    </span>
                  </span>
                  <span className="text-white/85 text-sm font-semibold tracking-wide">Now playing</span>
                  <button
                    type="button"
                    onClick={() => setPlaying(false)}
                    aria-label="Stop the music"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="group inline-flex items-center gap-3 bg-white/[0.06] hover:bg-white/[0.1] border border-[#D4AF37]/40 rounded-full pl-2 pr-5 py-2 transition-colors"
                >
                  <span className="w-9 h-9 rounded-full bg-gradient-to-r from-[#F0D488] to-[#D4AF37] flex items-center justify-center text-[#1a1208] transition-transform group-hover:scale-105">
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span className="text-white/85 text-sm font-semibold tracking-wide">
                    Press play to set the mood
                  </span>
                </button>
              )}
            </div>

            {/* facts */}
            <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-3">
              {[
                { label: "Date", value: EVENT.dateLabel },
                { label: "Time", value: EVENT.timeLabel },
                { label: "Where", value: EVENT.venue },
              ].map((f) => (
                <div key={f.label} className="bg-black/25 border border-[#D4AF37]/20 rounded-2xl px-5 py-4">
                  <p className="text-[#D4AF37] text-[10px] font-bold tracking-[0.25em] uppercase mb-1">{f.label}</p>
                  <p className="text-white text-sm font-semibold">{f.value}</p>
                </div>
              ))}
            </div>
            <a
              href="#location"
              className="inline-flex items-center gap-1.5 mb-9 text-white/55 hover:text-[#F0D488] text-xs transition-colors"
            >
              <span>📍</span>
              <span>{EVENT.address}</span>
            </a>

            {/* PRIMARY CTA -> opens modal */}
            <div>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#F0D488] to-[#D4AF37] text-[#1a1208] font-black px-10 py-4 rounded-xl text-base tracking-wide transition-transform duration-200 hover:scale-[1.03] shadow-lg shadow-black/40"
              >
                Get Tickets
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M21 12H3" />
                </svg>
              </button>
              <p className="text-white/50 text-xs mt-3">
                Starting at {formatPrice(fromPrice)} · Instant e-tickets · Apple&nbsp;/&nbsp;Google&nbsp;Pay
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {canceled && (
        <div className="max-w-3xl mx-auto px-6 pt-6">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm rounded-xl px-4 py-3">
            Checkout canceled. No charge was made. Tap “Get Tickets” whenever you&apos;re ready.
          </div>
        </div>
      )}

      {/* ===== LOCATION + MAP ===== */}
      <section id="location" className="py-16 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] uppercase mb-3">Location</p>
            <h2 style={DISPLAY} className="text-3xl sm:text-4xl font-black">{EVENT.venue}</h2>
            <p className="text-white/55 text-sm mt-2">{EVENT.address}</p>
            <a
              href={EVENT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[#F0D488] hover:underline text-sm font-semibold"
            >
              Open in Google Maps
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M21 12H3" />
              </svg>
            </a>
          </div>

          <div className={STREETVIEW_IMG ? "grid md:grid-cols-2 gap-4" : ""}>
            {STREETVIEW_IMG && (
              <div>
                <p className="text-white/40 text-[10px] font-bold tracking-[0.25em] uppercase mb-2 text-center">
                  Street View
                </p>
                <a
                  href={EVENT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden border border-[#D4AF37]/25 shadow-xl shadow-black/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={STREETVIEW_IMG}
                    alt={`Street view of ${EVENT.venue}`}
                    className="w-full h-72 object-cover block"
                  />
                </a>
              </div>
            )}
            <div>
              {STREETVIEW_IMG && (
                <p className="text-white/40 text-[10px] font-bold tracking-[0.25em] uppercase mb-2 text-center">
                  Aerial
                </p>
              )}
              <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/25 shadow-xl shadow-black/40">
                <iframe
                  title={`Map to ${EVENT.venue}`}
                  src={MAP_SRC}
                  className={`w-full block ${STREETVIEW_IMG ? "h-72" : "h-80"}`}
                  style={{ border: 0, filter: "saturate(1.1)" }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 px-6 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] uppercase mb-3">Good to know</p>
            <h2 style={DISPLAY} className="text-3xl sm:text-4xl font-black">Questions, answered</h2>
          </div>

          <div className="space-y-3">
            {FAQ.map((item, idx) => {
              const open = faqOpen === idx;
              return (
                <div key={item.q} className="bg-[#15100b]/80 border border-[#D4AF37]/15 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? null : idx)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-white text-sm sm:text-base">{item.q}</span>
                    <svg className={`w-4 h-4 shrink-0 text-[#D4AF37] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {open && <p className="px-5 pb-5 -mt-1 text-white/55 text-sm leading-relaxed">{item.a}</p>}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#F0D488] to-[#D4AF37] text-[#1a1208] font-black px-8 py-4 rounded-xl text-sm tracking-wide transition-transform duration-200 hover:scale-[1.03]"
            >
              Get Tickets
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div className="py-10 pb-28 lg:pb-10 px-6 border-t border-white/10 text-center">
        <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">
          ← Back to mytampapulse
        </Link>
      </div>

      {/* Hidden audio-only player — kept off-screen at full size so YouTube keeps
          playing the sound; the visible UI is the "Now playing" bar in the hero. */}
      {playing && (
        <div aria-hidden="true" className="fixed top-0 -left-[9999px] w-80 h-44 opacity-0 pointer-events-none">
          <iframe
            src="https://www.youtube.com/embed/LDY_XyxBu8A?autoplay=1&rel=0"
            title="SZA - Snooze (audio)"
            allow="autoplay; encrypted-media"
            className="w-full h-full"
          />
        </div>
      )}

      {/* ===== STICKY GET-TICKETS BAR (mobile) ===== */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c0a08]/95 backdrop-blur border-t border-[#D4AF37]/20 px-4 py-3">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="w-full bg-gradient-to-r from-[#F0D488] to-[#D4AF37] text-[#1a1208] font-black py-3.5 rounded-xl text-sm"
        >
          Get Tickets · From {formatPrice(fromPrice)}
        </button>
      </div>

      {/* ===== TICKET MODAL ===== */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
          onClick={() => setCartOpen(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[#120d09] border border-[#D4AF37]/25 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"
          >
            {/* modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#120d09]/95 backdrop-blur border-b border-white/10">
              <div>
                <h3 style={DISPLAY} className="text-xl font-black leading-tight">Get Tickets</h3>
                <p className="text-white/45 text-xs">{EVENT.name} · {EVENT.dateLabel}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {TIERS.map((tier) => {
                const count = qty[tier.id];
                const remaining = tierRemaining(tier);
                const soldOut = isSoldOut(tier);
                const lowStock = remaining !== null && remaining > 0 && remaining <= LOW_STOCK_THRESHOLD;
                const effectiveMax = remaining === null ? MAX_PER_TIER : Math.min(MAX_PER_TIER, remaining);
                const pctClaimed = tier.capacity
                  ? Math.min(100, Math.round(((tier.capacity - (remaining ?? 0)) / tier.capacity) * 100))
                  : 0;
                return (
                  <div
                    key={tier.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      soldOut
                        ? "border-white/10 bg-white/[0.02] opacity-60"
                        : count > 0
                        ? "border-[#D4AF37] bg-[#D4AF37]/[0.06]"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            style={DISPLAY}
                            className={`font-black text-base ${tier.id === "vip" ? "gold-reflector" : "text-white"}`}
                          >
                            {tier.name}
                          </h4>
                          {tier.badge && (
                            <span className="bg-gradient-to-r from-[#F0D488] to-[#D4AF37] text-[#1a1208] text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full">
                              {tier.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[#F0D488] font-bold mt-0.5">{formatPrice(tier.priceCents)}</p>
                        <p className="text-white/45 text-xs mt-1">{tier.blurb}</p>
                        {remaining !== null && !soldOut && (
                          <p className={`text-[11px] font-bold mt-1.5 ${lowStock ? "text-[#ff7a7a]" : "text-white/40"}`}>
                            {lowStock ? `🔥 Only ${remaining} left` : `${pctClaimed}% claimed`}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {soldOut ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 border border-white/10 rounded-lg px-3 py-2">
                            Sold Out
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-white/[0.06] rounded-xl p-1">
                            <button
                              type="button"
                              aria-label={`Remove one ${tier.name} ticket`}
                              onClick={() => setTierQty(tier.id, count - 1)}
                              disabled={count === 0}
                              className="w-9 h-9 rounded-lg font-black text-xl flex items-center justify-center bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
                            >
                              −
                            </button>
                            <span style={DISPLAY} className="w-6 text-center font-black tabular-nums text-white">{count}</span>
                            <button
                              type="button"
                              aria-label={`Add one ${tier.name} ticket`}
                              onClick={() => setTierQty(tier.id, count + 1)}
                              disabled={count >= effectiveMax}
                              className="w-9 h-9 rounded-lg font-black text-xl flex items-center justify-center bg-gradient-to-r from-[#F0D488] to-[#D4AF37] text-[#1a1208] disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* summary + checkout */}
            <div className="px-6 pb-6">
              {totalTickets > 0 && (
                <div className="space-y-2 mb-4 text-sm border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <span className="text-white/50">Subtotal</span>
                    <span className="text-white/80 tabular-nums">{formatPrice(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">{FEES.label}</span>
                    <span className="text-white/80 tabular-nums">{formatPrice(feeCents)}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-white/10 pt-3 mt-1">
                    <span className="text-white/60">Total ({totalTickets})</span>
                    <span style={DISPLAY} className="font-black text-2xl text-[#F0D488] tabular-nums">
                      {formatPrice(grandTotalCents)}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-300 bg-red-500/10 border border-red-500/30 text-xs rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={totalTickets === 0 || loading}
                className="w-full bg-gradient-to-r from-[#F0D488] to-[#D4AF37] disabled:opacity-40 text-[#1a1208] font-black py-4 rounded-xl text-sm transition-all duration-200 hover:scale-[1.01] disabled:hover:scale-100"
              >
                {loading ? "Redirecting to secure checkout…" : totalTickets === 0 ? "Select tickets" : "Checkout →"}
              </button>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[
                  { icon: "⚡", label: "Instant e-tickets" },
                  { icon: "💳", label: "Apple / Google Pay" },
                  { icon: "🔒", label: "Secure checkout" },
                ].map((t) => (
                  <div key={t.label} className="bg-white/[0.04] border border-white/10 rounded-lg py-2 px-1">
                    <div className="text-base leading-none mb-1">{t.icon}</div>
                    <p className="text-white/55 text-[10px] font-semibold leading-tight">{t.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#D4AF37] text-xs text-center mt-3 font-semibold">{EVENT.dressCode}</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
