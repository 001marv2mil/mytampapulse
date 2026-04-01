"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Found my new favorite restaurant through mytampapulse. This page is a cheat code.",
    name: "Kayla J.",
    location: "South Tampa",
    initials: "KJ",
    color: "bg-orange-100 text-orange-600",
  },
  {
    quote: "I check this every Thursday before making weekend plans. Never missed a good event since.",
    name: "Marcus T.",
    location: "Hyde Park",
    initials: "MT",
    color: "bg-blue-100 text-blue-600",
  },
  {
    quote: "Finally a Tampa page that actually has taste. No filler, no ads. Just good picks.",
    name: "Sofia R.",
    location: "Ybor City",
    initials: "SR",
    color: "bg-rose-100 text-rose-600",
  },
  {
    quote: "Moved to Tampa 6 months ago. mytampapulse made me feel like a local in 2 weeks.",
    name: "Devontae M.",
    location: "Seminole Heights",
    initials: "DM",
    color: "bg-teal-100 text-teal-600",
  },
  {
    quote: "My entire friend group follows this. It's basically how we plan every weekend now.",
    name: "Nicole B.",
    location: "St. Pete",
    initials: "NB",
    color: "bg-purple-100 text-purple-600",
  },
  {
    quote: "The hidden gem picks alone are worth the follow. So many places I would've never found.",
    name: "Jermaine L.",
    location: "West Tampa",
    initials: "JL",
    color: "bg-amber-100 text-amber-600",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-orange-50 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase block mb-4">
            Real Tampa Subscribers
          </motion.span>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }} className="font-heading text-4xl md:text-5xl font-black text-gray-900">
            What the locals say 🗣️
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-white border border-orange-100 hover:border-orange-300 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-orange-100/50">

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg key={j} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-gray-800 text-sm font-bold">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.location} · Subscriber</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-400 text-xs mt-10">
          Names and neighborhoods shared with permission. Join 1,000+ Tampa locals →
        </motion.p>
      </div>
    </section>
  );
}
