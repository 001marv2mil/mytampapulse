"use client";

import { motion } from "framer-motion";

export default function ShaderDivider() {
  return (
    <div className="relative py-20 overflow-hidden bg-[#FFFBF7]">
      {/* Decorative sun graphic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,90,54,0.08) 0%, transparent 70%)" }} />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Big pill */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 bg-white border border-orange-200 rounded-full px-6 py-3 shadow-sm shadow-orange-100 mb-8">
          <span className="text-xl">☀️</span>
          <span className="text-gray-700 text-sm font-semibold">Delivered every Thursday morning</span>
          <span className="text-xl">🌴</span>
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
          Tampa&apos;s best,<br />
          <span className="text-pulse-orange">delivered weekly.</span>
        </motion.h2>

        {/* Tampa icons row */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          {[
            { icon: "🌮", label: "Food" },
            { icon: "🍹", label: "Bars" },
            { icon: "🎶", label: "Music" },
            { icon: "🌅", label: "Sunsets" },
            { icon: "🏖️", label: "Beach" },
            { icon: "🎉", label: "Events" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-gray-500 text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
