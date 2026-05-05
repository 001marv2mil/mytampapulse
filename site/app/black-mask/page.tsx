"use client";

import { useState, useEffect } from "react";

export default function BlackMaskPage() {
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
          <p className="text-white/60 text-base leading-relaxed mb-8 max-w-sm">
            Drop your email and we&apos;ll hit you when the next Black Mask Social drops. Plus Tampa&apos;s best weekly roundup, free.
          </p>

          {/* Social proof */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[
                  "https://i.pravatar.cc/150?img=47",
                  "https://i.pravatar.cc/150?img=12",
                  "https://i.pravatar.cc/150?img=32",
                  "https://i.pravatar.cc/150?img=5",
                  "https://i.pravatar.cc/150?img=23",
                ].map((src, i) => (
                  <img key={i} src={src} alt="" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                ))}
              </div>
              <p className="text-white/50 text-xs">1,000+ locals already in</p>
            </div>
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
              {loading ? "Sending details…" : "Send Me the Details — It's Free"}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}

          {/* Trust */}
          <p className="text-white/20 text-xs mt-5">
            No spam. Unsubscribe anytime. You&apos;ll get Tampa Pulse every Thursday.
          </p>

        </div>
      </div>
    </>
  );
}
