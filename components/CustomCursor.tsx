"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let raf: number;

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const addHover = () => {
      ringRef.current?.classList.add("cursor-expanded");
    };
    const removeHover = () => {
      ringRef.current?.classList.remove("cursor-expanded");
    };

    const bindHoverables = () => {
      document.querySelectorAll("a, button, [data-cursor]").forEach((el) => {
        el.addEventListener("mouseenter", addHover);
        el.addEventListener("mouseleave", removeHover);
      });
    };

    function loop() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("mousemove", move);
    bindHoverables();
    raf = requestAnimationFrame(loop);

    // Re-bind on DOM mutations
    const obs = new MutationObserver(bindHoverables);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-pulse-orange rounded-full pointer-events-none z-[99999] mix-blend-difference"
        style={{ willChange: "transform" }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 border border-pulse-orange/60 rounded-full pointer-events-none z-[99998] transition-[width,height,opacity] duration-200"
        style={{ willChange: "transform" }}
      />
      <style>{`
        .cursor-expanded { width: 48px; height: 48px; opacity: 0.5; }
        @media (hover: none) { .custom-cursor-dot, .custom-cursor-ring { display: none; } }
      `}</style>
    </>
  );
}
