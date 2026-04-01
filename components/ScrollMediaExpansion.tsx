"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ScrollMediaExpansion() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.55, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.5], [32, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.3, 0.7], [40, -20]);
  const textOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.85, 1], [0, 1, 1, 0]);

  return (
    <div ref={ref} className="relative h-[160vh] bg-[#0A0A0A]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <motion.div
          style={{ scale, borderRadius, opacity }}
          className="relative w-full h-full overflow-hidden"
        >
          {/* Tampa nightlife image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=1600&q=85)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Centered text */}
          <motion.div
            style={{ y: textY, opacity: textOpacity }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          >
            <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-4">Tampa Bay</p>
            <h2 className="font-heading text-5xl sm:text-7xl md:text-8xl font-black text-white leading-none tracking-tight">
              This Is Your
              <br />
              <span className="text-pulse-orange">City.</span>
            </h2>
            <p className="text-white/60 text-lg mt-6 max-w-md">
              Stop finding out about the best nights on Monday. Get tapped in before the weekend.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
