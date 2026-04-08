"use client";

import { useState, useEffect } from "react";

// Rotating giveaways — each prize runs for 2 weeks before switching.
// 5 prizes × 2 weeks = 10-week full cycle before it repeats.
// Add future prizes by pushing to this array.
const giveaways = [
  {
    prize: "AirPods Pro",
    emoji: "🎧",
    description: "1 winner. Share your link once to enter. We ship anywhere in the US.",
    urgencyLabel: "2 weeks only",
  },
  {
    prize: "AirPods Pro",
    emoji: "🎧",
    description: "1 winner. Share your link once to enter. We ship anywhere in the US.",
    urgencyLabel: "Last week to enter",
  },
  {
    prize: "$100 Tampa Restaurant Gift Card",
    emoji: "🍽️",
    description: "1 winner gets $100 to spend at any Tampa restaurant of their choice. Your call.",
    urgencyLabel: "2 weeks only",
  },
  {
    prize: "$100 Tampa Restaurant Gift Card",
    emoji: "🍽️",
    description: "1 winner gets $100 to spend at any Tampa restaurant of their choice. Your call.",
    urgencyLabel: "Last week to enter",
  },
  {
    prize: "$75 Ybor Bar Tab",
    emoji: "🍺",
    description: "1 winner gets a $75 bar tab at a Tampa Pulse partner spot in Ybor City. Walk in and order.",
    urgencyLabel: "2 weeks only",
  },
  {
    prize: "$75 Ybor Bar Tab",
    emoji: "🍺",
    description: "1 winner gets a $75 bar tab at a Tampa Pulse partner spot in Ybor City. Walk in and order.",
    urgencyLabel: "Last week to enter",
  },
  {
    prize: "2 Busch Gardens Tampa Day Passes",
    emoji: "🎢",
    description: "1 winner gets 2 day passes to Busch Gardens Tampa. Bring someone. No expiration.",
    urgencyLabel: "2 weeks only",
  },
  {
    prize: "2 Busch Gardens Tampa Day Passes",
    emoji: "🎢",
    description: "1 winner gets 2 day passes to Busch Gardens Tampa. Bring someone. No expiration.",
    urgencyLabel: "Last week to enter",
  },
  {
    prize: "Concert Tickets in Tampa — Your Pick",
    emoji: "🎶",
    description: "1 winner gets 2 tickets to any Tampa Bay concert of their choice. You pick the show.",
    urgencyLabel: "2 weeks only",
  },
  {
    prize: "Concert Tickets in Tampa — Your Pick",
    emoji: "🎶",
    description: "1 winner gets 2 tickets to any Tampa Bay concert of their choice. You pick the show.",
    urgencyLabel: "Last week to enter",
  },
];

function getActiveGiveaway() {
  // Each prize runs for 2 weeks. Flips every other Thursday.
  const now = new Date();
  const epoch = new Date("2026-01-02").getTime(); // Issue #1 Thursday
  const weeksSinceEpoch = Math.floor((now.getTime() - epoch) / (7 * 24 * 60 * 60 * 1000));
  // Integer divide by 1 gives week index; each giveaway entry = 1 week,
  // and we have pairs in the array so it naturally runs 2 weeks per prize.
  const index = ((weeksSinceEpoch % giveaways.length) + giveaways.length) % giveaways.length;
  return giveaways[index];
}

function getDeadline() {
  // Deadline = next Tuesday at 11:59pm (5 days after Thursday send)
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat
  // Days until next Tuesday
  const daysUntilTuesday = (2 - day + 7) % 7 || 7;
  const deadline = new Date(now);
  deadline.setDate(now.getDate() + daysUntilTuesday);
  deadline.setHours(23, 59, 0, 0);
  return deadline;
}

function getDaysLeft(deadline: Date) {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const giveaway = getActiveGiveaway();

  useEffect(() => {
    const deadline = getDeadline();
    setDaysLeft(getDaysLeft(deadline));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://mytampapulse.com?ref=YOURCODE");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="max-w-4xl mx-auto px-6 mb-20">
      <div className="bg-gray-900 rounded-2xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-pulse-orange/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-pulse-orange/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">

          {/* Live badge + timer */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-pulse-orange/15 border border-pulse-orange/30 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 bg-pulse-orange rounded-full animate-pulse" />
              <span className="text-pulse-orange text-xs font-semibold tracking-wider uppercase">
                Giveaway Active
              </span>
            </div>
            {daysLeft !== null && (
              <span className="text-white/30 text-xs">
                {daysLeft === 0 ? "Ends tonight" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              </span>
            )}
          </div>

          {/* Prize */}
          <div className="text-center mb-10">
            <div className="text-6xl mb-4">{giveaway.emoji}</div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
              Win: {giveaway.prize}
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto mb-2">
              {giveaway.description}
            </p>
            <p className="text-pulse-orange text-xs font-semibold tracking-wider uppercase">
              1 referral = 1 entry &nbsp;·&nbsp; {giveaway.urgencyLabel}
            </p>
          </div>

          {/* Instant digital reward */}
          <div className="bg-white/5 border border-pulse-orange/20 rounded-xl px-5 py-4 mb-8 flex items-start gap-4">
            <span className="text-2xl shrink-0">🗺️</span>
            <div>
              <p className="text-white text-sm font-semibold mb-0.5">Refer 1 friend → get this instantly</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                <span className="text-pulse-orange font-medium">Tampa&apos;s 50 Best Hidden Spots</span> — Marv&apos;s personal list. The spots locals know and tourists never find. Not published anywhere else. Delivered automatically when your referral subscribes.
              </p>
            </div>
          </div>

          {/* How it works — 3 steps */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { step: "1", text: "Copy your link below" },
              { step: "2", text: "Send it to one Tampa friend" },
              { step: "3", text: "They subscribe → you're entered" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-8 h-8 bg-pulse-orange/20 border border-pulse-orange/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-pulse-orange text-xs font-bold">{item.step}</span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Share link */}
          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto mb-4">
            <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-full px-5 py-3.5 text-gray-500 text-sm truncate font-mono">
              mytampapulse.com?ref=YOURCODE
            </div>
            <button
              onClick={handleCopy}
              className={`whitespace-nowrap font-semibold px-7 py-3.5 rounded-full transition-all duration-300 text-sm ${
                copied
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-pulse-orange hover:bg-pulse-orange/90 text-white hover:scale-105"
              }`}
            >
              {copied ? "Copied! ✓" : "Copy My Link"}
            </button>
          </div>

          <p className="text-gray-600 text-xs text-center mb-8">
            New giveaway every week. Your unique link is in every email we send you.
          </p>

          {/* Instagram follow + share bonus */}
          <div className="border-t border-white/10 pt-8">
            <div className="text-center mb-6">
              <p className="text-white text-sm font-semibold mb-1">Want daily Tampa updates?</p>
              <p className="text-gray-500 text-xs">We post 3x/day on Instagram — the stuff that can&apos;t wait until Thursday.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://instagram.com/thetampapulse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white font-semibold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Follow @thetampapulse
              </a>
              <button
                onClick={() => {
                  navigator.share?.({
                    title: "Tampa Pulse on Instagram",
                    text: "Follow @thetampapulse for daily Tampa updates — new openings, development, events",
                    url: "https://instagram.com/thetampapulse",
                  }).catch(() => {
                    window.open("https://instagram.com/thetampapulse", "_blank");
                  });
                }}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Share with a friend
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
