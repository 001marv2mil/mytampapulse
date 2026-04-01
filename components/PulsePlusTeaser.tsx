"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const PERKS = [
  { icon: "⚡", text: "Early access every Tuesday — before the Thursday drop" },
  { icon: "🎟️", text: "VIP perks at partner venues — skip lines, free drinks" },
  { icon: "🔒", text: "Exclusive invite-only events, members only" },
  { icon: "💬", text: "Members-only group chat with the Pulse community" },
];

export default function PulsePlusTeaser() {
  return (
    <section className="py-20 px-6 bg-gray-900 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-pulse-orange/10 border border-pulse-orange/30 rounded-full px-4 py-2 mb-6">
              <span className="w-1.5 h-1.5 bg-pulse-orange rounded-full animate-pulse" />
              <span className="text-pulse-orange text-xs font-bold tracking-wider uppercase">Coming Soon</span>
            </div>

            <h2 className="font-heading text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Pulse<span className="text-pulse-orange">+</span><br />
              The insider tier.
            </h2>

            <p className="text-gray-400 text-base leading-relaxed mb-8">
              The free newsletter is just the beginning. Pulse+ is for people who want to be first — early access, VIP venue perks, exclusive events, and a community of Tampa insiders.
            </p>

            <div className="space-y-3 mb-8">
              {PERKS.map((perk) => (
                <div key={perk.text} className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{perk.icon}</span>
                  <p className="text-gray-300 text-sm leading-relaxed">{perk.text}</p>
                </div>
              ))}
            </div>

            <Link href="/pulse-plus">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 bg-pulse-orange hover:bg-pulse-orange-hover text-white font-black px-7 py-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-orange-900/30">
                Join the Waitlist
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.button>
            </Link>
            <p className="text-gray-600 text-xs mt-3">Launching at 3,000 subscribers · Early-bird pricing locked in at signup</p>
          </motion.div>

          {/* Right — comparison card */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.15 }}>
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-visible">
              {/* Header */}
              <div className="grid grid-cols-2 text-center rounded-t-3xl overflow-hidden">
                <div className="py-4 border-b border-r border-white/10">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Free</p>
                </div>
                <div className="py-4 border-b border-white/10 bg-pulse-orange/10 relative">
                  {/* Most Popular badge — inside the cell, not overflowing */}
                  <span className="block text-pulse-orange text-xs font-bold uppercase tracking-wider">Pulse+</span>
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pulse-orange text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                    Most Popular
                  </span>
                </div>
              </div>

              {/* Rows */}
              {[
                ["Weekly newsletter", true, true],
                ["Events & hidden gems", true, true],
                ["Early Tuesday access", false, true],
                ["VIP venue perks", false, true],
                ["Exclusive events", false, true],
                ["Members group chat", false, true],
              ].map(([label, free, plus]) => (
                <div key={label as string} className="grid grid-cols-2 text-center border-b border-white/5 last:border-0">
                  <div className="py-3.5 px-4 border-r border-white/5 flex items-center justify-between">
                    <span className="text-gray-400 text-xs text-left">{label as string}</span>
                    <span className="text-gray-500 text-sm">{free ? "✓" : "—"}</span>
                  </div>
                  <div className="py-3.5 px-4 bg-pulse-orange/5 flex items-center justify-end">
                    <span className={plus ? "text-pulse-orange font-bold text-sm" : "text-gray-600"}>
                      {plus ? "✓" : "—"}
                    </span>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-pulse-orange/10 rounded-b-3xl">
                <Link href="/pulse-plus">
                  <div className="text-center text-pulse-orange text-sm font-bold hover:underline cursor-pointer">
                    See full Pulse+ details →
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
