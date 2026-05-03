"use client";

import { useState, useEffect } from "react";

export default function EventsGuidePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ref }),
      });
      if (!res.ok) throw new Error();
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead");
        (window as any).fbq("track", "CompleteRegistration");
      }
      window.location.href = "/thank-you";
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        nav, footer, header { display: none !important; }
        body { background: #111111 !important; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Logo */}
          <div className="text-center mb-10">
            <p className="font-heading text-xl font-black text-white tracking-tight">
              Tampa <span className="text-[#FF5A36]">Pulse</span>
            </p>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-white leading-tight mb-4 text-center">
            Just moved to Tampa?<br />
            <span className="text-[#FF5A36]">Or lived here forever?</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-white/60 text-base text-center mb-8 leading-relaxed">
            Get the free <strong className="text-white">60-Day Tampa Events Guide</strong> — locals&apos; picks, not tourist traps. Sent straight to your inbox.
          </p>

          {/* Guide preview */}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5 mb-8">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">What&apos;s inside</p>
            <ul className="space-y-3">
              {[
                { icon: "🎵", text: "60 days of concerts, festivals & live music" },
                { icon: "🍽️", text: "New restaurant openings locals are actually excited about" },
                { icon: "🌅", text: "Hidden gems and weekend spots you won't find on Yelp" },
                { icon: "🎨", text: "Art walks, rooftop events & date night ideas" },
                { icon: "🏖️", text: "Free things to do every single weekend" },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="text-base shrink-0">{icon}</span>
                  <span className="text-white/70 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-[#FF5A36] text-xs font-semibold">
                Free PDF · Instant download · Updated for May–July 2026
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5A36]/50 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF5A36] hover:bg-[#e5502f] disabled:opacity-60 text-white font-black py-4 rounded-full transition-all text-sm tracking-wide"
            >
              {loading ? "Sending your guide…" : "Get the guide free →"}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
          )}

          {/* Trust signals */}
          <p className="text-white/20 text-xs mt-5 text-center">
            Free. No spam. Unsubscribe anytime. You&apos;ll also get Tampa Pulse every Thursday.
          </p>

          {/* Social proof */}
          <p className="text-white/25 text-xs mt-3 text-center">
            1,000+ Tampa locals already subscribed
          </p>
        </div>
      </div>
    </>
  );
}
