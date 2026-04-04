"use client";

import { useState } from "react";

const referralTiers = [
  {
    friends: 3,
    reward: "The Tampa Insider",
    detail: "A private weekly DM with one spot that didn't make the newsletter. Only referrers get this.",
    icon: "🗝️",
  },
  {
    friends: 10,
    reward: "Pulse+ Free for 3 Months",
    detail: "When Pulse+ launches — early access, VIP venue perks, members chat. Yours free.",
    icon: "👑",
  },
  {
    friends: 25,
    reward: "Lunch with Marv",
    detail: "Pick the spot. I'm buying. We talk Tampa, what's coming, what you want to see.",
    icon: "🍽️",
  },
];

export default function ReferralSection() {
  const [copied, setCopied] = useState(false);

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
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">
              Share the Pulse
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
              Know someone who needs this?
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">
              Send them your link. Every person who subscribes through you gets you closer to something real.
            </p>
          </div>

          {/* Reward tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {referralTiers.map((tier) => (
              <div
                key={tier.friends}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-pulse-orange/40 transition-all duration-300 group"
              >
                <span className="text-3xl mb-3 block">{tier.icon}</span>
                <div className="font-heading font-bold text-white text-base mb-1">
                  {tier.friends} referrals
                </div>
                <div className="text-pulse-orange text-sm font-semibold mb-2">
                  {tier.reward}
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{tier.detail}</p>
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
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <p className="text-gray-600 text-xs text-center">
            Your personal referral link is included at the bottom of every issue we send you.
          </p>
        </div>
      </div>
    </section>
  );
}
