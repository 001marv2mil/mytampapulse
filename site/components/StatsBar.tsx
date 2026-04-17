"use client";

import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const spring = useSpring(count, { duration: 2000, bounce: 0 });
  const display = useTransform(spring, (v) => `${Math.round(v).toLocaleString()}${suffix}`);
  useEffect(() => { if (inView) count.set(to); }, [inView, to, count]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

const stats = [
  { value: 1000, suffix: "+", label: "Subscribers", icon: "👥" },
  { value: 52, suffix: "", label: "Issues Sent", icon: "📬" },
  { value: 16, suffix: "+", label: "Events Per Issue", icon: "🎉" },
  { value: 52, suffix: "x/yr", label: "Every Thursday", icon: "📅" },
];

export default function StatsBar() {
  return (
    <section className="py-16 px-6 bg-pulse-orange">
      <div className="max-w-5xl mx-auto">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-center text-white/70 text-xs font-bold tracking-widest uppercase mb-8">
          By the numbers
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/15 hover:bg-white/20 border border-white/20 rounded-2xl p-6 text-center transition-all duration-300">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="font-heading text-3xl md:text-4xl font-black text-white mb-1">
                <CountUp to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-white/70 text-xs font-medium tracking-wider uppercase">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
