"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const CATEGORIES = ["Events", "Food", "Nightlife", "Hidden Gems", "Rooftops", "Brunch", "Live Music", "Date Nights"];

export default function HeroSection({ latestIssue }: { latestIssue?: { number: number; date: string } }) {
  const issueNum = latestIssue?.number ?? 13;
  const issueDate = latestIssue?.date ?? "Mar 27, 2026";
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) setRef(refParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ref }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setEmail("");
    } catch {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6 pt-28 pb-20"
      style={{ background: "linear-gradient(170deg, #FFF5F0 0%, #FFFBF7 45%, #FFF8F0 100%)" }}>

      {/* Subtle grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(#FF5A36 1px, transparent 1px), linear-gradient(90deg, #FF5A36 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Orange glow top-right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right, rgba(255,90,54,0.12), transparent 65%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT — Copy + CTA */}
          <div>
            {/* Live badge */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-7 shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600 text-xs font-semibold">{`Issue #${issueNum} is live · ${issueDate}`}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
              className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.0] tracking-tight mb-5">
              Tampa&apos;s<br />
              <span className="text-pulse-orange">Insider</span><br />
              Guide.
            </motion.h1>

            {/* Sub */}
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
              className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
              Every Thursday we send Tampa&apos;s best events, food drops, hidden gems, and weekend plans — free, direct to your inbox.
            </motion.p>

            {/* Email form — PRIMARY CTA */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.26 }}>
              {submitted ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-green-700 font-bold text-sm">You&apos;re in!</p>
                    <p className="text-green-600 text-xs">Check your inbox this Thursday.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" required autoComplete="email"
                    className="flex-1 bg-white border border-gray-200 focus:border-pulse-orange rounded-xl px-5 py-4 text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm shadow-sm transition-colors" />
                  <button type="submit"
                    className="bg-pulse-orange hover:bg-pulse-orange-hover text-white font-black px-7 py-4 rounded-xl text-sm whitespace-nowrap transition-all duration-200 hover:scale-[1.03] shadow-lg shadow-orange-200">
                    Get it Free →
                  </button>
                </form>
              )}
              <p className="text-gray-400 text-xs mt-3 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                No spam. Unsubscribe anytime. 100% free.
              </p>
            </motion.div>

            {/* Social proof avatars */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex items-center gap-3 mt-7">
              <div className="flex -space-x-2.5">
                {["1494790108377-be9c29b29330","1507003211169-0a1dd7228f2d","1438761681033-6461ffad8d80","1472099645785-5658abf4ff4e","1544005313-94ddf0286df2"].map((id, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-cover bg-center shadow-sm"
                    style={{ backgroundImage: `url(https://images.unsplash.com/photo-${id}?w=64&q=80)` }} />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-0.5"><span className="text-gray-700 font-semibold">1,000+</span> Tampa locals already in</p>
              </div>
            </motion.div>

            {/* Secondary — Instagram */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="mt-5">
              <a href="https://instagram.com/mytampapulse" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-pulse-orange text-sm font-medium transition-colors group">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Also follow on Instagram
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </a>
            </motion.div>
          </div>

          {/* RIGHT — Preview card */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block">
            <div className="relative">
              {/* Floating cards behind */}
              <div className="absolute -top-4 -left-4 w-full h-full bg-orange-100 rounded-3xl" />
              <div className="absolute -top-2 -left-2 w-full h-full bg-orange-200/40 rounded-3xl" />

              {/* Main preview card */}
              <div className="relative bg-white rounded-3xl border border-orange-100 shadow-2xl shadow-orange-100/40 overflow-hidden">
                {/* Card header */}
                <div className="bg-pulse-orange px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-xs font-semibold tracking-wider uppercase">mytampapulse</p>
                    <p className="text-white font-black text-sm mt-0.5">{`Issue #${issueNum} · ${issueDate}`}</p>
                  </div>
                  <span className="text-2xl">🌴</span>
                </div>

                {/* Card content */}
                <div className="p-6 space-y-4">
                  <p className="text-gray-800 font-bold text-sm leading-snug">This week in Tampa:</p>

                  {[
                    { icon: "🥪", text: "Cuban Sandwich Festival — 370-ft world record attempt", tag: "FREE" },
                    { icon: "🎨", text: "Mainsail Art Festival at Vinoy Park, 250+ artists", tag: "FREE" },
                    { icon: "💎", text: "Trailer Daddy — the bar everyone's talking about on Central Ave", tag: "NEW" },
                    { icon: "🎵", text: "Katt Williams at Benchmark Arena Friday night", tag: "PAID" },
                    { icon: "🌅", text: "ZooBrews adults night — unlimited drinks, live music", tag: "PICK" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                      <p className="text-gray-600 text-xs leading-relaxed flex-1">{item.text}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        item.tag === "FREE" ? "bg-green-50 text-green-600" :
                        item.tag === "NEW" ? "bg-orange-50 text-pulse-orange" :
                        item.tag === "PICK" ? "bg-blue-50 text-blue-600" :
                        "bg-gray-50 text-gray-500"
                      }`}>{item.tag}</span>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-gray-50">
                    <p className="text-gray-400 text-xs">+ 9 more picks, hidden gems & weekend moves →</p>
                  </div>
                </div>

                {/* Categories */}
                <div className="px-6 pb-5 flex flex-wrap gap-2">
                  {CATEGORIES.slice(0,5).map(c => (
                    <span key={c} className="bg-orange-50 border border-orange-100 text-pulse-orange text-[10px] font-semibold px-2.5 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>

              {/* Floating "new issue" badge */}
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -top-5 -right-5 bg-white border border-orange-200 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-gray-700 text-xs font-bold">New issue live</span>
              </motion.div>
            </div>
          </motion.div>

        </div>

        {/* Bottom proof strip */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="mt-16 pt-8 border-t border-orange-100 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { stat: "1,000+", label: "Subscribers" },
            { stat: "13", label: "Issues Published" },
            { stat: "16+", label: "Picks Per Issue" },
            { stat: "Free", label: "Always" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading font-black text-2xl text-gray-900">{s.stat}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FFFBF7] to-transparent pointer-events-none" />
    </section>
  );
}
