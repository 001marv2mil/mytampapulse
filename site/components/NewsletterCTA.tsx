"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) setRef(refParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ref }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setSubmitted(false);
    }
  };

  return (
    <section id="subscribe" className="py-20 px-6 bg-pulse-orange">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}>

          <div className="text-4xl mb-5">📬</div>

          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4">
            Get tapped in.<br />It&apos;s free.
          </h2>

          <p className="text-white/75 text-base mb-10 max-w-md mx-auto">
            1,000+ Tampa locals get the best picks every Thursday. Join them — it takes 10 seconds.
          </p>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 bg-white/20 backdrop-blur border border-white/30 rounded-2xl px-8 py-5">
              <span className="text-2xl">🎉</span>
              <div className="text-left">
                <p className="text-white font-bold">You&apos;re in!</p>
                <p className="text-white/70 text-sm">Check your inbox this Thursday.</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" required autoComplete="email"
                className="flex-1 bg-white border-0 rounded-xl px-5 py-4 text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm shadow-lg" />
              <button type="submit"
                className="bg-gray-900 hover:bg-black text-white font-black px-8 py-4 rounded-xl text-sm whitespace-nowrap transition-all duration-200 hover:scale-[1.03] shadow-lg">
                Subscribe Free →
              </button>
            </form>
          )}

          <p className="text-white/50 text-xs mt-5">No spam. No politics. Unsubscribe anytime. 🌴</p>
        </motion.div>
      </div>
    </section>
  );
}
