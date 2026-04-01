"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const FEATURES = [
  {
    number: "01",
    title: "Curated Events",
    desc: "We filter out the boring stuff so you don't have to. Every pick in the Pulse is actually worth leaving the house for.",
    tag: "Every Thursday",
    icon: "🎉",
    accent: "#FF5A36",
  },
  {
    number: "02",
    title: "Hidden Gems",
    desc: "The spots locals know but tourists never find. Neighborhood dives, underground dinners, secret rooftops — we got 'em.",
    tag: "Weekly Drop",
    icon: "💎",
    accent: "#FF7A00",
  },
  {
    number: "03",
    title: "Date Night Picks",
    desc: "Impress anyone, every time. We do the research so you can show up looking like you knew all along.",
    tag: "Romantic Finds",
    icon: "🔥",
    accent: "#FF5A36",
  },
  {
    number: "04",
    title: "Weekend Moves",
    desc: "Your entire Friday–Sunday planned in 60 seconds. Morning market, afternoon beach, evening rooftop — done.",
    tag: "Plan Your Weekend",
    icon: "🌴",
    accent: "#FF7A00",
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div ref={ref} style={{ y, opacity }}>
      <div className="group relative rounded-3xl bg-white border border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-xl hover:shadow-orange-100/60 transition-all duration-500 overflow-hidden">
        {/* Left accent bar */}
        <div className="absolute left-0 top-8 bottom-8 w-1 rounded-full" style={{ background: feature.accent }} />

        <div className="p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-start">
          {/* Number + Icon */}
          <div className="shrink-0 text-center">
            <div className="text-5xl mb-2">{feature.icon}</div>
            <span className="text-gray-200 font-heading font-black text-3xl">{feature.number}</span>
          </div>
          {/* Text */}
          <div className="flex-1">
            <div className="inline-block bg-orange-50 border border-orange-100 text-pulse-orange text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wider uppercase">
              {feature.tag}
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-black text-gray-900 mb-3 group-hover:text-pulse-orange transition-colors duration-300">
              {feature.title}
            </h3>
            <p className="text-gray-500 text-base leading-relaxed max-w-lg">{feature.desc}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeatureStacks() {
  return (
    <section className="py-24 px-6 bg-[#FFFBF7]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="text-center mb-16">
          <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-4">Why the Pulse</p>
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight">
            Everything Tampa,
            <br />
            <span className="text-pulse-orange">filtered for you.</span>
          </h2>
        </motion.div>

        <div className="space-y-5">
          {FEATURES.map((f, i) => <FeatureCard key={f.number} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}
