"use client";

import { useState, useEffect } from "react";

interface EmailSignupProps {
  variant?: "hero" | "section";
  buttonText?: string;
}

export default function EmailSignup({
  variant = "hero",
  buttonText = "Get Tapped In",
}: EmailSignupProps) {
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
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Something went wrong. Try again.");
    }
  };

  if (submitted) {
    return (
      <div
        className={`flex items-center justify-center gap-2 py-4 ${
          variant === "hero" ? "text-lg" : "text-base"
        }`}
      >
        <span className="text-pulse-orange font-semibold">You&apos;re in.</span>
        <span className="text-white/60">We&apos;ll be in touch.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div
        className={`flex gap-2 ${
          variant === "hero"
            ? "flex-col sm:flex-row"
            : "flex-col sm:flex-row"
        }`}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-pulse-orange/50 focus:bg-white/8 transition-all duration-300 text-sm"
        />
        <button
          type="submit"
          className="bg-pulse-orange hover:bg-pulse-orange-hover text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pulse-orange/20 text-sm whitespace-nowrap"
        >
          {buttonText}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      <p className="text-white/25 text-xs mt-3 text-center sm:text-left">
        No spam. No politics. Just the good stuff.
      </p>
    </form>
  );
}
