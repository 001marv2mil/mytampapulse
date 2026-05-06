"use client";

import { useState } from "react";

export default function NewsletterAccessPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await fetch("/api/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success — don't reveal whether email exists
      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center px-5 py-20">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/newsletter" className="font-heading text-2xl font-black text-gray-900 tracking-tight">
            Tampa <span className="text-[#FF5A36]">Pulse</span>
          </a>
        </div>

        {sent ? (
          /* Success state */
          <div className="bg-white rounded-3xl border border-orange-100 shadow-lg p-10 text-center">
            <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your email.</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              If that email is on our list, we just sent you a one-click access link. Open it on whatever device you want full access on.
            </p>
            <p className="text-gray-400 text-xs">
              No email? Check spam, or make sure you used the same email you subscribed with.
            </p>
          </div>
        ) : (
          /* Form state */
          <div className="bg-white rounded-3xl border border-orange-100 shadow-lg p-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Get full access</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Already subscribed? Enter your email and we&apos;ll send you a one-click link that unlocks the full archive on any device — phone, iPad, laptop, anywhere.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#FF5A36]/60 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF5A36] hover:bg-[#e5502f] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
              >
                {loading ? "Sending…" : "Send Me the Link"}
              </button>
            </form>

            {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

            <p className="text-gray-400 text-xs mt-6 text-center">
              Not subscribed yet?{" "}
              <a href="/" className="text-[#FF5A36] hover:underline">Subscribe free →</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
