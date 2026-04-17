"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ParallaxText() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const x1 = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={ref} className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #FF5A36 0%, #FF7A00 50%, #FFB703 100%)" }}>
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      <motion.div style={{ opacity }} className="select-none">
        <motion.div style={{ x: x1 }} className="flex whitespace-nowrap mb-1">
          {["STOP SCROLLING.", "STOP SCROLLING.", "STOP SCROLLING."].map((t, i) => (
            <span key={i} className="font-heading font-black uppercase text-white/25 leading-none px-4"
              style={{ fontSize: "clamp(4rem, 14vw, 12rem)", letterSpacing: "-0.04em" }}>{t}&nbsp;</span>
          ))}
        </motion.div>
        <motion.div style={{ x: x2 }} className="flex whitespace-nowrap">
          {["START LIVING.", "START LIVING.", "START LIVING."].map((t, i) => (
            <span key={i} className="font-heading font-black uppercase text-white leading-none px-4"
              style={{ fontSize: "clamp(4rem, 14vw, 12rem)", letterSpacing: "-0.04em" }}>{t}&nbsp;</span>
          ))}
        </motion.div>
      </motion.div>

      {/* Center text overlay */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <p className="text-white/80 text-lg sm:text-xl font-semibold max-w-md leading-relaxed drop-shadow-lg">
          Tampa has too much going on<br />for you to miss it every weekend.
        </p>
        <a href="https://instagram.com/mytampapulse" target="_blank" rel="noopener noreferrer"
          className="mt-6 bg-white text-pulse-orange font-bold px-8 py-3.5 rounded-full hover:bg-orange-50 transition-all duration-200 hover:scale-105 shadow-xl text-sm">
          Follow @mytampapulse →
        </a>
      </motion.div>
    </div>
  );
}
