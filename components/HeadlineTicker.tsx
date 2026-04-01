"use client";

import { useState, useEffect } from "react";

export interface Headline {
  id: string;
  category: string;
  text: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  "NOW": { bg: "bg-pulse-orange/25", text: "text-pulse-orange", border: "border-pulse-orange/20", glow: "text-pulse-orange/80" },
  "TRAFFIC": { bg: "bg-amber-500/25", text: "text-amber-400", border: "border-amber-500/20", glow: "text-amber-300/80" },
  "NEW OPENING": { bg: "bg-emerald-500/25", text: "text-emerald-400", border: "border-emerald-500/20", glow: "text-emerald-300/80" },
  "THIS WEEKEND": { bg: "bg-blue-500/25", text: "text-blue-400", border: "border-blue-500/20", glow: "text-blue-300/80" },
  "REAL ESTATE": { bg: "bg-purple-500/25", text: "text-purple-400", border: "border-purple-500/20", glow: "text-purple-300/80" },
  "HEADS UP": { bg: "bg-rose-500/25", text: "text-rose-400", border: "border-rose-500/20", glow: "text-rose-300/80" },
  "FYI": { bg: "bg-cyan-500/25", text: "text-cyan-400", border: "border-cyan-500/20", glow: "text-cyan-300/80" },
  "TRENDING": { bg: "bg-pink-500/25", text: "text-pink-400", border: "border-pink-500/20", glow: "text-pink-300/80" },
};

export default function HeadlineTicker({ headlines }: { headlines: Headline[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (headlines.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % headlines.length);
        setIsAnimating(false);
      }, 300);
    }, 7000);

    return () => clearInterval(interval);
  }, [headlines.length]);

  if (headlines.length === 0) return null;

  const current = headlines[currentIndex];
  const style = CATEGORY_STYLES[current.category] || CATEGORY_STYLES["NOW"];

  return (
    <div className={`w-full border-b backdrop-blur-sm transition-colors duration-500 ${style.border} bg-gradient-to-r from-white/[0.03] via-white/[0.05] to-white/[0.03]`}>
      <div className="max-w-2xl mx-auto px-6 py-3 flex items-start gap-3">
        {/* Pulsing dot */}
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${style.bg} shadow-sm`} style={{ boxShadow: '0 0 6px currentColor' }} />

        {/* Category badge */}
        <span className={`shrink-0 text-[9px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
          {current.category}
        </span>

        {/* Headline text with fade animation */}
        <p
          className={`text-xs sm:text-sm leading-relaxed transition-all duration-300 ${style.glow} ${
            isAnimating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          }`}
        >
          {current.text}
        </p>

        {/* Dot indicators */}
        {headlines.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-auto">
            {headlines.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? `${style.bg} w-3` : "bg-white/10 w-1"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
