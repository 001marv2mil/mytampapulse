"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-dark-bg/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold tracking-[0.2em] uppercase text-white">
            mytampapulse
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/newsletter"
            className="text-sm text-white/60 hover:text-white transition-colors font-medium"
          >
            This Week
          </Link>
          <Link
            href="/archive"
            className="text-sm text-white/60 hover:text-white transition-colors font-medium"
          >
            Archive
          </Link>
          <Link
            href="/community"
            className="text-sm text-white/60 hover:text-white transition-colors font-medium"
          >
            Community
          </Link>
          <Link
            href="/pulse-plus"
            className="text-sm text-pulse-orange hover:text-pulse-orange-hover transition-colors font-semibold"
          >
            Pulse+
          </Link>
          <a
            href="#subscribe"
            className="bg-pulse-orange hover:bg-pulse-orange-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105"
          >
            Subscribe
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span
            className={`w-5 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`w-5 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`w-5 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ${
          menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-2 bg-dark-bg/95 backdrop-blur-xl border-t border-white/5 flex flex-col gap-4">
          <Link
            href="/newsletter"
            onClick={() => setMenuOpen(false)}
            className="text-white/70 hover:text-white transition-colors py-2"
          >
            This Week
          </Link>
          <Link
            href="/archive"
            onClick={() => setMenuOpen(false)}
            className="text-white/70 hover:text-white transition-colors py-2"
          >
            Archive
          </Link>
          <Link
            href="/community"
            onClick={() => setMenuOpen(false)}
            className="text-white/70 hover:text-white transition-colors py-2"
          >
            Community
          </Link>
          <Link
            href="/pulse-plus"
            onClick={() => setMenuOpen(false)}
            className="text-pulse-orange hover:text-pulse-orange-hover transition-colors py-2 font-semibold"
          >
            Pulse+
          </Link>
          <a
            href="#subscribe"
            onClick={() => setMenuOpen(false)}
            className="bg-pulse-orange text-white text-center font-semibold py-3 rounded-full"
          >
            Subscribe
          </a>
        </div>
      </div>
    </nav>
  );
}
