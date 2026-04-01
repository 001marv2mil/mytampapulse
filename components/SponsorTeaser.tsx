"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const PACKAGES = [
  {
    name: "Shoutout",
    price: "$299",
    desc: "Editorial mention woven into the issue. Reads like a recommendation.",
  },
  {
    name: "Featured Spot",
    price: "$599",
    desc: "Your business gets the full Hidden Gem treatment — written in our voice.",
    badge: "Most Booked",
  },
  {
    name: "Full Sponsor",
    price: "$999",
    desc: "Own the issue. Newsletter + Instagram post + 2 stories.",
  },
];

const STATS = [
  { value: "1,000+", label: "Subscribers" },
  { value: "47%", label: "Open Rate" },
  { value: "Tampa Bay", label: "Hyper-local" },
  { value: "Every Thursday", label: "Consistent" },
];

export default function SponsorTeaser() {
  return (
    <section className="py-24 px-6 bg-gray-900 overflow-hidden">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 bg-pulse-orange/10 border border-pulse-orange/30 rounded-full px-4 py-2 mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-pulse-orange text-xs font-bold tracking-wider uppercase">Accepting Sponsors · Limited Spots</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
              Get your business in front of<br />
              <span className="text-pulse-orange">Tampa&apos;s most engaged locals.</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              1,000+ Tampa Bay locals who actively seek out the best restaurants, bars, and experiences. They read every issue and actually go out.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-4">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <p className="font-heading font-black text-2xl text-white">{s.value}</p>
                <p className="text-gray-500 text-xs mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Package cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {PACKAGES.map((pkg, i) => (
            <motion.div key={pkg.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative bg-white/5 border border-white/10 hover:border-pulse-orange/40 rounded-2xl p-6 transition-all duration-200">
              {pkg.badge && (
                <span className="absolute -top-3 left-5 bg-pulse-orange text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full">
                  {pkg.badge}
                </span>
              )}
              <p className="font-heading font-black text-white text-lg mt-1">{pkg.name}</p>
              <p className="font-heading font-black text-pulse-orange text-3xl mb-2">{pkg.price}<span className="text-gray-500 text-sm font-normal">/issue</span></p>
              <p className="text-gray-400 text-sm leading-relaxed">{pkg.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center">
          <Link href="/advertise"
            className="inline-flex items-center gap-2 bg-pulse-orange hover:bg-pulse-orange-hover text-white font-black px-10 py-4 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-orange-900/30">
            See All Packages & Book a Spot
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-gray-600 text-xs mt-4">Multi-issue discounts available · We respond within 24 hours</p>
        </motion.div>

      </div>
    </section>
  );
}
