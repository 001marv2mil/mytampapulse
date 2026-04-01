"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function FinalCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubmitted(true); setEmail(""); }
  };

  return (
    <section className="py-24 px-6 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-4">Don&apos;t miss out</p>
            <h2 className="font-heading text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-5">
              Stop finding out<br />about it on Monday.
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              Every week Tampa has incredible things happening. Most people find out after the fact. The Pulse subscribers don&apos;t.
            </p>

            {/* Quote */}
            <div className="border-l-2 border-pulse-orange pl-4">
              <p className="text-gray-300 text-sm leading-relaxed italic">
                &ldquo;Moved to Tampa 6 months ago. mytampapulse made me feel like a local in 2 weeks.&rdquo;
              </p>
              <p className="text-gray-500 text-xs mt-2">@devontae_moves</p>
            </div>
          </motion.div>

          {/* Right — final form */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.15 }}>
            <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/20">
              <div className="text-3xl mb-4">🌴</div>
              <h3 className="font-heading font-black text-gray-900 text-2xl mb-2">Join the Pulse.</h3>
              <p className="text-gray-500 text-sm mb-6">Free every Thursday. No spam. Cancel anytime.</p>

              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-gray-900 font-bold">You&apos;re officially in.</p>
                  <p className="text-gray-400 text-sm mt-1">First issue lands this Thursday.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" required autoComplete="email"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-pulse-orange rounded-xl px-5 py-4 text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm transition-colors" />
                  <button type="submit"
                    className="w-full bg-pulse-orange hover:bg-pulse-orange-hover text-white font-black py-4 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-orange-200">
                    Get Tampa&apos;s Best Picks Free →
                  </button>
                </form>
              )}

              <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                <p className="text-gray-300 text-xs">Or follow us</p>
                <a href="https://instagram.com/mytampapulse" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gray-500 hover:text-pulse-orange text-xs font-semibold transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @mytampapulse
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
