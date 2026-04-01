"use client";

import { motion } from "framer-motion";

const ITEMS = [
  {
    icon: "🎉",
    title: "Curated Events",
    desc: "16+ hand-picked events every week. We cut the noise so you only see what's actually worth going to.",
    examples: ["Festivals", "Live music", "Art shows", "Pop-ups"],
    bg: "bg-orange-50 border-orange-200",
    pill: "bg-white text-pulse-orange border-orange-200",
  },
  {
    icon: "💎",
    title: "Hidden Gems",
    desc: "One spot every issue that locals know but tourists don't. The stuff you'll be the first to tell your friends about.",
    examples: ["New openings", "Secret spots", "Under-the-radar bars", "Local kitchens"],
    bg: "bg-amber-50 border-amber-200",
    pill: "bg-white text-amber-600 border-amber-200",
  },
  {
    icon: "🔥",
    title: "Date Night Picks",
    desc: "Ready-made plans that make you look like you've lived in Tampa your whole life. No research required.",
    examples: ["Rooftop dinners", "Speakeasies", "Sunset spots", "Unique experiences"],
    bg: "bg-rose-50 border-rose-200",
    pill: "bg-white text-rose-500 border-rose-200",
  },
  {
    icon: "🌴",
    title: "Weekend Moves",
    desc: "Friday morning to Sunday night, planned in 60 seconds. Morning, afternoon, evening — we map it all.",
    examples: ["Saturday plans", "Sunday markets", "Beach days", "Nightlife route"],
    bg: "bg-teal-50 border-teal-200",
    pill: "bg-white text-teal-600 border-teal-200",
  },
];

export default function WhatYouGet() {
  return (
    <section className="py-20 px-6 bg-white border-t border-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5 }} className="mb-12">
          <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-3">Every Thursday</p>
          <h2 className="font-heading text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            What&apos;s inside<br />every issue
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {ITEMS.map((item, i) => (
            <motion.div key={item.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`rounded-2xl border p-6 ${item.bg} hover:scale-[1.01] transition-transform duration-200`}>
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-heading font-black text-gray-900 text-xl mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{item.desc}</p>
              <div className="flex flex-wrap gap-2">
                {item.examples.map(ex => (
                  <span key={ex} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${item.pill}`}>{ex}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
