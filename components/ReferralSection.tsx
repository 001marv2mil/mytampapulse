"use client";

import { useState } from "react";

const referralTiers = [
  { friends: 3, reward: "Early access to next week's issue", icon: "⚡" },
  { friends: 5, reward: "Exclusive mytampapulse sticker pack", icon: "🔥" },
  { friends: 10, reward: "Free month of Pulse+ when it launches", icon: "👑" },
];

export default function ReferralSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("https://tampapulse.com?ref=YOURLINK");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="max-w-4xl mx-auto px-6 mb-20">
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-pulse-orange/10 via-dark-surface to-dark-surface" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-pulse-orange/5 rounded-full blur-[100px]" />

        <div className="relative z-10 border border-pulse-orange/15 rounded-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">
              Share the Pulse
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
              Bring Your Crew. Get Rewarded.
            </h2>
            <p className="text-white/40 text-sm md:text-base max-w-lg mx-auto">
              Share mytampapulse with friends and unlock exclusive perks. The more friends you bring, the better it gets.
            </p>
          </div>

          {/* Reward tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {referralTiers.map((tier) => (
              <div
                key={tier.friends}
                className="glass rounded-xl p-5 text-center hover:bg-white/[0.06] transition-all duration-300"
              >
                <span className="text-3xl mb-3 block">{tier.icon}</span>
                <div className="font-heading font-bold text-white text-lg mb-1">
                  {tier.friends} Friends
                </div>
                <p className="text-white/40 text-xs leading-relaxed">
                  {tier.reward}
                </p>
              </div>
            ))}
          </div>

          {/* Share link */}
          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
            <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-full px-5 py-3.5 text-white/50 text-sm truncate">
              tampapulse.com?ref=YOURLINK
            </div>
            <button
              onClick={handleCopy}
              className={`whitespace-nowrap font-semibold px-7 py-3.5 rounded-full transition-all duration-300 text-sm ${
                copied
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-pulse-orange hover:bg-pulse-orange-hover text-white hover:scale-105"
              }`}
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <p className="text-white/20 text-xs text-center mt-4">
            Your unique referral link will be in every email we send you.
          </p>
        </div>
      </div>
    </section>
  );
}
