"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ScrollGate({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gated, setGated] = useState(false);
  const [fadeAmount, setFadeAmount] = useState(0); // 0 = clear, 1 = fully blurred/faded

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerTop = window.scrollY + rect.top;
      const containerHeight = container.offsetHeight;
      const scrolled = window.scrollY - containerTop;
      const progress = scrolled / containerHeight;

      // Start fading at 40% scroll, fully gated at 60%
      if (progress < 0.4) {
        setFadeAmount(0);
        setGated(false);
      } else if (progress < 0.6) {
        const fade = (progress - 0.4) / 0.2;
        setFadeAmount(fade);
        setGated(false);
      } else {
        setFadeAmount(1);
        setGated(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Content */}
      <div
        style={{
          filter: fadeAmount > 0 ? `blur(${fadeAmount * 6}px)` : undefined,
          opacity: 1 - fadeAmount * 0.3,
          transition: "filter 0.1s, opacity 0.1s",
          pointerEvents: gated ? "none" : undefined,
          userSelect: gated ? "none" : undefined,
        }}
      >
        {children}
      </div>

      {/* Fade overlay — appears as content blurs */}
      {fadeAmount > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "300px",
            background: "linear-gradient(to bottom, transparent, #FFFBF7)",
            opacity: fadeAmount,
          }}
        />
      )}

      {/* Subscribe gate — snaps into place once fully gated */}
      {gated && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
          <div className="text-center bg-white rounded-3xl p-10 border border-orange-100 shadow-xl max-w-md w-full mx-4">
            <div className="bg-pulse-orange/10 border border-pulse-orange/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-pulse-orange">
                <path fillRule="evenodd" d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Enjoying the Pulse?
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-2 max-w-sm mx-auto">
              Subscribe free to get the full issue — plus every future issue — delivered to your inbox every Thursday.
            </p>
            <p className="text-gray-400 text-xs mb-8">
              Takes 10 seconds. No spam, ever.
            </p>
            <Link
              href="/"
              className="block w-full bg-pulse-orange hover:bg-pulse-orange/90 text-white font-semibold px-10 py-3.5 rounded-xl transition-colors text-center"
            >
              Subscribe Free →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
