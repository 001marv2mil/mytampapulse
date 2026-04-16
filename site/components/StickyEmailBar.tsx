"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StickyEmailBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    if (refParam) setRef(refParam);

    const onScroll = () => {
      if (!dismissed && window.scrollY > window.innerHeight * 0.4) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ref }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "CompleteRegistration");
      }
      setTimeout(() => setDismissed(true), 2500);
    } catch {
      // silent fail — sticky bar is supplementary
    }
  };

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
          <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-2xl shadow-orange-100/80">
            {submitted ? (
              <p className="text-center text-sm font-semibold">
                <span className="text-pulse-orange">You&apos;re in! 🎉 </span>
                <span className="text-gray-500">See you Thursday.</span>
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-800 text-sm font-bold">Get Tampa&apos;s best picks, free 👇</p>
                  <button onClick={() => setDismissed(true)} className="text-gray-300 hover:text-gray-500 text-lg leading-none ml-2">×</button>
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" required
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder:text-gray-400 text-sm focus:outline-none focus:border-pulse-orange/50" />
                  <button type="submit"
                    className="bg-pulse-orange hover:bg-pulse-orange-hover text-white font-bold px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors">
                    Join Free
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
