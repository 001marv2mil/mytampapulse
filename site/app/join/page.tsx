"use client";

import { useState, useEffect } from "react";

export default function JoinPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ref, setRef] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    const eventParam = params.get("event");
    if (refParam) setRef(refParam);
    if (eventParam) setEventName(eventParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");

    const eventId = crypto.randomUUID();
    const fbp = document.cookie.match(/_fbp=([^;]+)/)?.[1];
    const fbc = document.cookie.match(/_fbc=([^;]+)/)?.[1];

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ref, source: eventName ?? "join", event_id: eventId, fbp, fbc }),
      });
      if (!res.ok) throw new Error();
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead", {}, { eventID: eventId });
        (window as any).fbq("track", "CompleteRegistration", {}, { eventID: eventId });
      }
      const result = await res.json();
      const shareRef = result?.ref;
      // Only show the share page for direct signups (no referral).
      // Friends arriving via a referral link go to /thank-you — they don't have context yet.
      if (shareRef && !ref) {
        window.location.href = `/share?ref=${shareRef}&event=${encodeURIComponent(eventName ?? "Black Mask Social")}`;
      } else {
        window.location.href = "/thank-you";
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        nav, footer, header { display: none !important; }
        body { background: #000 !important; }
      `}</style>

      {/* Full-screen background */}
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 py-14 relative"
        style={{
          backgroundImage: "url('/black-mask-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.90) 100%)" }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">

          {/* Logo */}
          <p className="font-heading text-lg font-black text-white tracking-tight mb-8">
            Tampa <span className="text-[#FF5A36]">Pulse</span>
          </p>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
            Want in on<br />
            <span className="text-[#FF5A36]">the next one?</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-white/60 text-base leading-relaxed mb-6 max-w-sm">
            Drop your email — we&apos;ll hit you when {eventName ?? "the next event"} drops.
          </p>

          {/* Social proof */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex -space-x-2">
              {[
                "https://images.pexels.com/photos/7383149/pexels-photo-7383149.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1&fit=crop",
                "https://randomuser.me/api/portraits/women/29.jpg",
                "https://images.pexels.com/photos/7346623/pexels-photo-7346623.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1&fit=crop",
                "https://randomuser.me/api/portraits/men/22.jpg",
                "https://randomuser.me/api/portraits/men/54.jpg",
              ].map((src, i) => (
                <img key={i} src={src} alt="" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-black object-cover" />
              ))}
            </div>
            <p className="text-white/50 text-xs">1,000+ locals already in ⭐⭐⭐⭐⭐</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="w-full bg-white/10 border border-white/20 rounded-full px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5A36]/60 transition-all text-sm backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF5A36] hover:bg-[#e5502f] disabled:opacity-60 text-white font-black py-4 rounded-full transition-all text-sm tracking-wide"
            >
              {loading ? "One sec…" : "I'm In — It's Free"}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}

          {/* Trust */}
          <p className="text-white/20 text-xs mt-5">
            No spam. Unsubscribe anytime.
          </p>

        </div>
      </div>
    </>
  );
}
