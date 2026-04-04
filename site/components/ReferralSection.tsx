"use client";

import { useState, useEffect } from "react";

// Rotating giveaways — one active at a time, cycles every 5 weeks.
// Each runs Thu → Tue (5 days, aligns with newsletter send day).
// To add a new one, just push to this array.
const giveaways = [
  {
    prize: "AirPods Pro",
    emoji: "🎧",
    description: "1 winner. Share your link once to enter. We ship anywhere in the US.",
    urgencyLabel: "This week only",
  },
  {
    prize: "$100 Tampa Restaurant Gift Card",
    emoji: "🍽️",
    description: "1 winner gets $100 to spend at any Tampa restaurant of their choice. Your call.",
    urgencyLabel: "5 days left",
  },
  {
    prize: "30 Min with Marv",
    emoji: "🗺️",
    description: "1 winner. We meet anywhere in Tampa. I'll show you spots that never made the newsletter.",
    urgencyLabel: "Limited spots",
  },
  {
    prize: "Tampa Pulse Merch Pack",
    emoji: "🧢",
    description: "Hat + tote + sticker sheet. The full kit. 1 referral = 1 entry.",
    urgencyLabel: "This week only",
  },
  {
    prize: "$75 Ybor Bar Tab",
    emoji: "🍺",
    description: "1 winner gets a $75 bar tab to use at a Tampa Pulse partner bar in Ybor City.",
    urgencyLabel: "5 days left",
  },
];

function getActiveGiveaway() {
  // Rotate based on week number — changes every Thursday
  const now = new Date();
  // Week number since a fixed epoch (Jan 2, 2026 = issue #1 Thursday)
  const epoch = new Date("2026-01-01").getTime();
  const weeksSinceEpoch = Math.floor((now.getTime() - epoch) / (7 * 24 * 60 * 60 * 1000));
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

          <p className="text-gray-600 text-xs text-center">
            New giveaway every week. Your unique link is in every email we send you.
          </p>
        </div>
      </div>
    </section>
  );
}
