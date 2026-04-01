"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
const TARGET = "MYTAMPAPULSE";

function scramble(target: string, progress: number): string {
  return target.split("").map((char, i) => {
    if (i < Math.floor(progress * target.length)) return char;
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }).join("");
}

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState(scramble(TARGET, 0));
  const [done, setDone] = useState(false);

  useEffect(() => {
    let start: number | null = null;
    const duration = 1600;
    let frame: number;
    function tick(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setText(scramble(TARGET, progress));
      if (progress < 1) { frame = requestAnimationFrame(tick); }
      else { setText(TARGET); setTimeout(() => { setDone(true); setTimeout(onDone, 600); }, 300); }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div key="loader" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(160deg, #FFF0E8 0%, #FFFBF7 50%, #F0F8FF 100%)" }}>
          {/* Sun glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,90,54,0.15), transparent 70%)" }} />
          <div className="text-4xl mb-6 animate-bounce">🌴</div>
          <div className="font-heading text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.15em] select-none">
            {text.split("").map((ch, i) => (
              <span key={i} className={ch === TARGET[i] ? "text-gray-900" : "text-pulse-orange/50"}>{ch}</span>
            ))}
          </div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.6, ease: "easeInOut" }}
            className="mt-6 h-0.5 w-40 bg-gradient-to-r from-transparent via-pulse-orange to-transparent origin-left" />
          <p className="mt-4 text-gray-400 text-xs tracking-widest uppercase">Tampa Bay, FL ☀️</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
