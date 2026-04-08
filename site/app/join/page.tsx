"use client";

import { useState, useEffect } from "react";

export default function JoinPage() {
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
    } catch {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <>
      <style jsx global>{`
        nav, footer, header { display: none !important; }
        body { background: #1a1a1a !important; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-10">
            <h1 className="font-heading text-3xl font-black text-white tracking-tight">
              Tampa <span className="text-[#FF5A36]">Pulse</span>
            </h1>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="font-heading text-2xl font-bold text-white">
                You&apos;re in.
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Check your inbox for a welcome email. Your first issue drops Thursday.
              </p>
              <p className="text-[#FF5A36] text-sm font-semibold mt-4">
                You&apos;re entered to win the $100 gift card.
              </p>
            </div>
          ) : (
            <>
              {/* Headline */}
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
                Tampa&apos;s best-kept secrets.
                <br />
                <span className="text-[#FF5A36]">Every Thursday. Free.</span>
              </h2>

              {/* Value props */}
              <ul className="text-white/60 text-sm space-y-2 mb-8 text-left max-w-xs mx-auto">
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5A36] mt-0.5">→</span>
                  New restaurants and hidden gems
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5A36] mt-0.5">→</span>
                  Weekend events worth going to
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5A36] mt-0.5">→</span>
                  Development and openings you should know
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF5A36] mt-0.5">→</span>
                  Written for locals, not tourists
                </li>
              </ul>

              {/* Giveaway hook */}
              <div className="bg-white/5 border border-[#FF5A36]/30 rounded-xl px-5 py-4 mb-8">
                <p className="text-white text-sm font-semibold">
                  Sign up this week →{" "}
                  <span className="text-[#FF5A36]">
                    enter to win a $100 Tampa restaurant gift card
                  </span>
                </p>
              </div>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5A36]/50 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-[#FF5A36] hover:bg-[#e5502f] text-white font-bold py-4 rounded-full transition-all text-sm tracking-wide"
                >
                  Get Tapped In — It&apos;s Free
                </button>
              </form>

              {error && (
                <p className="text-red-400 text-xs mt-2">{error}</p>
              )}

              {/* Trust */}
              <p className="text-white/20 text-xs mt-4">
                No spam. Unsubscribe anytime. Takes 10 seconds.
              </p>

              {/* Social proof */}
              <p className="text-white/30 text-xs mt-6">
                Joined by 1,000+ Tampa locals
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
