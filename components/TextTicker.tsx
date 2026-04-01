"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const ITEMS = [
  "EVENTS", "RESTAURANTS", "NIGHTLIFE", "DATE NIGHTS",
  "HIDDEN GEMS", "ROOFTOPS", "HAPPY HOURS", "BRUNCH SPOTS",
  "LIVE MUSIC", "WEEKEND MOVES", "LOCAL FAVORITES", "THINGS TO DO",
];

function TickerRow({ reverse = false, speed = 35 }: { reverse?: boolean; speed?: number }) {
  const [hovered, setHovered] = useState(false);
  const items = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="flex overflow-hidden" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <motion.div
        animate={{ x: reverse ? ["0%", "33.33%"] : ["0%", "-33.33%"] }}
        transition={{ repeat: Infinity, duration: hovered ? speed * 2 : speed, ease: "linear" }}
        className="flex shrink-0"
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-4 px-4 font-heading font-black text-sm sm:text-base tracking-widest uppercase whitespace-nowrap">
            <span className="text-pulse-orange">{item}</span>
            <span className="text-gray-300 text-lg">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function TextTicker() {
  return (
    <div className="py-5 bg-orange-50 border-y border-orange-100 overflow-hidden">
      <TickerRow speed={30} />
      <div className="mt-3">
        <TickerRow reverse speed={40} />
      </div>
    </div>
  );
}
