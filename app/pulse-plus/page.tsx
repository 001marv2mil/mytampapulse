"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const freeFeatures = [
  "Weekly curated newsletter",
  "Top event picks",
  "Hidden gems & food spots",
  "Weekly digest & highlights",
];

const plusFeatures = [
  "Everything in Free",
  "Early access (get it Tuesday, not Thursday)",
  "VIP venue perks (skip lines, free drinks)",
  "Exclusive invite-only events",
  "Members-only group chat",
  "Merch drops & early access to collabs",
];

const faqs = [
  {
    question: "What's included in Pulse+?",
    answer: "Everything in the free newsletter plus early access to each issue, VIP perks at partner venues across Tampa, exclusive invite-only events, a members-only group chat, and first dibs on merch and collabs.",
  },
  {
    question: "When does Pulse+ launch?",
    answer: "We're targeting a launch once we hit 3,000+ subscribers. Join the waitlist to be the first to know and lock in early-bird pricing.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. No contracts, no commitments. Cancel anytime with one click. But once you're in, you won't want to leave.",
  },
  {
    question: "How do VIP venue perks work?",
    answer: "We partner with the best bars, restaurants, and venues in Tampa. Pulse+ members get exclusive perks like skip-the-line access, complimentary drinks, reserved seating, and more. New perks added weekly.",
  },
];

export default function PulsePlusPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubmitted(true); setEmail(""); }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7]">

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center" style={{ background: "linear-gradient(170deg, #FFF0E8 0%, #FFFBF7 60%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-6 shadow-sm">
            <span className="w-2 h-2 bg-pulse-orange rounded-full animate-pulse" />
            <span className="text-pulse-orange text-xs font-bold tracking-wider uppercase">Coming Soon</span>
          </div>
          <h1 className="font-heading text-7xl sm:text-8xl md:text-9xl font-black text-gray-900 leading-[0.9] mb-6">
            Pulse<span className="text-pulse-orange">+</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-lg mx-auto mb-3 leading-relaxed">
            The insider tier. Early access. VIP perks. Members only.
          </p>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            For the ones who don&apos;t just go out. They go first.
          </p>
        </motion.div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-3">Choose Your Level</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-gray-900">Free vs. Pulse+</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 border border-gray-200 rounded-3xl p-8">
              <h3 className="font-heading text-2xl font-black text-gray-900 mb-1">Pulse</h3>
              <p className="font-heading text-4xl font-black text-gray-900 mb-1">Free</p>
              <p className="text-gray-500 text-sm mb-8">Everything you need to stay in the loop.</p>
              <ul className="space-y-3 mb-8">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/#subscribe"
                className="block w-full text-center bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3.5 rounded-xl transition-all duration-200 text-sm">
                Subscribe Free
              </Link>
            </motion.div>

            {/* Pulse+ */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative bg-gray-900 border border-gray-800 rounded-3xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                style={{ background: "radial-gradient(circle at top right, rgba(255,90,54,0.15), transparent 70%)" }} />
              <div className="absolute -top-3 left-8">
                <span className="bg-pulse-orange text-white text-xs font-black tracking-wider uppercase px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-heading text-2xl font-black text-white mb-1">
                  Pulse<span className="text-pulse-orange">+</span>
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-heading text-4xl font-black text-white">$6.99</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-8">The full Tampa insider experience.</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plusFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-pulse-orange mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-200 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <button disabled
                className="block w-full text-center bg-pulse-orange/20 text-pulse-orange/60 font-bold py-3.5 rounded-xl text-sm cursor-not-allowed border border-pulse-orange/20">
                Coming Soon
              </button>
              <p className="text-gray-500 text-xs text-center mt-3">Join the waitlist below to lock in early-bird pricing</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="py-20 px-6 bg-pulse-orange">
        <div className="max-w-xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-4xl mb-5">⚡</div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">Be the First In</h2>
            <p className="text-white/80 text-base mb-10 max-w-md mx-auto">
              Join the waitlist and we&apos;ll let you know the second Pulse+ goes live. Early birds lock in a special rate.
            </p>
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 bg-white/20 border border-white/30 rounded-2xl px-8 py-5">
                <span className="text-2xl">🎉</span>
                <div className="text-left">
                  <p className="text-white font-bold">You&apos;re on the list!</p>
                  <p className="text-white/70 text-sm">We&apos;ll email you when Pulse+ launches.</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className="flex-1 bg-white border-0 rounded-xl px-5 py-4 text-gray-800 placeholder:text-gray-400 focus:outline-none text-sm shadow-lg" />
                <button type="submit"
                  className="bg-gray-900 hover:bg-black text-white font-black px-7 py-4 rounded-xl text-sm whitespace-nowrap transition-all duration-200 hover:scale-[1.02]">
                  Join Waitlist →
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-3">FAQ</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-gray-900">Questions? We got you.</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <span className="font-heading font-bold text-gray-900 text-sm md:text-base pr-4">{faq.question}</span>
                  <svg className={`w-5 h-5 text-pulse-orange shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                      <p className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="py-10 px-6 bg-[#FFFBF7] border-t border-gray-100 text-center">
        <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">← Back to home</Link>
      </div>

    </div>
  );
}
