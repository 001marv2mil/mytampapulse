"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "This Week", href: "/newsletter" },
  { label: "Pulse+", href: "/pulse-plus" },
  { label: "Advertise", href: "/advertise", highlight: true },
];

export default function FloatingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
    >
      <div className={`rounded-full px-5 py-3 flex items-center justify-between gap-4 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg shadow-gray-200/60"
          : "bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm"
      }`}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="w-6 h-6 rounded-full bg-pulse-orange flex items-center justify-center text-white text-xs font-black">T</span>
          <span className="font-heading font-bold text-gray-900 text-sm hidden sm:block">mytampapulse</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-5">
          {links.map((l) => (
            <Link key={l.label} href={l.href}
              className={l.highlight
                ? "flex items-center gap-1 text-pulse-orange hover:text-pulse-orange-hover text-xs font-bold transition-colors duration-200"
                : "text-gray-500 hover:text-gray-900 text-xs font-medium transition-colors duration-200"
              }>
              {l.highlight && <span className="w-1.5 h-1.5 bg-pulse-orange rounded-full animate-pulse" />}
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <a href="https://instagram.com/mytampapulse" target="_blank" rel="noopener noreferrer"
          className="shrink-0 bg-pulse-orange hover:bg-pulse-orange-hover text-white text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:scale-105">
          Follow Us
        </a>

        {/* Mobile burger */}
        <button className="md:hidden text-gray-600 hover:text-gray-900" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl px-4 py-4 space-y-3 shadow-xl">
            {links.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)}
                className="block text-gray-600 hover:text-gray-900 text-sm font-medium py-1 transition-colors">
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
