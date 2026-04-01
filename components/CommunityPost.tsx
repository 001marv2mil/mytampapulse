"use client";

import { useState, useEffect } from "react";
import type { CommunityPost as CommunityPostType } from "@/lib/data";

const TYPE_STYLES = {
  poll: { label: "Poll", bg: "bg-pulse-orange/20", text: "text-pulse-orange", dot: "bg-pulse-orange" },
  question: { label: "Question", bg: "bg-blue-500/20", text: "text-blue-400", dot: "bg-blue-400" },
  announcement: { label: "Announcement", bg: "bg-white/10", text: "text-white/70", dot: "bg-white/50" },
  community_event: { label: "Community Event", bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
};

const REACTIONS = [
  { emoji: "🔥", label: "Fire", weight: 30 },
  { emoji: "💯", label: "100", weight: 20 },
  { emoji: "👏", label: "Clap", weight: 15 },
  { emoji: "😍", label: "Love", weight: 10 },
  { emoji: "❤️", label: "Heart", weight: 25 },
  { emoji: "😎", label: "Cool", weight: 12 },
  { emoji: "👍", label: "Thumbs Up", weight: 18 },
];

// Deterministic seed from post id so counts are stable across renders
function seedRandom(str: string): () => number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return () => {
    h = ((h << 13) ^ h) | 0;
    h = (h * 0x5bd1e995) | 0;
    return Math.abs(h) / 2147483647;
  };
}

// Calculate how many days old a post is (from Mar 26, 2026 as "today")
function getDaysOld(dateStr: string): number {
  const months: Record<string, number> = {
    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11,
  };
  const parts = dateStr.replace(",", "").split(" ");
  const month = months[parts[0]] ?? 2;
  const day = parseInt(parts[1]) || 26;
  const year = parseInt(parts[2]) || 2026;
  const postDate = new Date(year, month, day);
  const today = new Date(2026, 2, 26); // Mar 26, 2026
  return Math.max(0, Math.floor((today.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)));
}

function generateReactions(post: CommunityPostType): Record<string, number> {
  const rng = seedRandom(post.id + post.title);
  const daysOld = getDaysOld(post.date);

  // Total interactions: 2-5% of 1000 subs, scaled by age
  // New posts (0-2 days): 5-15 total reactions
  // Mid posts (3-7 days): 15-35 total reactions
  // Old posts (8+ days): 25-45 total reactions
  let maxTotal: number;
  if (daysOld <= 2) {
    maxTotal = 5 + Math.floor(rng() * 10);
  } else if (daysOld <= 7) {
    maxTotal = 15 + Math.floor(rng() * 20);
  } else {
    maxTotal = 25 + Math.floor(rng() * 20);
  }

  // Pinned posts get a bump
  if (post.pinned) {
    maxTotal = Math.floor(maxTotal * 1.4);
  }

  // Pick 3-5 emojis that actually get used (not all 7)
  const usedCount = 3 + Math.floor(rng() * 3);
  const shuffled = [...REACTIONS]
    .map((r) => ({ ...r, sort: rng() * r.weight }))
    .sort((a, b) => b.sort - a.sort)
    .slice(0, usedCount);

  // Distribute reactions unevenly. Top 1-2 get most
  const counts: Record<string, number> = {};
  REACTIONS.forEach((r) => { counts[r.emoji] = 0; });

  let remaining = maxTotal;
  shuffled.forEach((r, i) => {
    if (i === 0) {
      // Top emoji gets 30-50% of total
      const share = Math.floor(remaining * (0.3 + rng() * 0.2));
      counts[r.emoji] = share;
      remaining -= share;
    } else if (i === 1) {
      // Second gets 20-35%
      const share = Math.floor(remaining * (0.3 + rng() * 0.25));
      counts[r.emoji] = share;
      remaining -= share;
    } else {
      // Rest split whatever's left
      const share = Math.floor(remaining * (0.2 + rng() * 0.3));
      counts[r.emoji] = Math.min(share, remaining);
      remaining -= counts[r.emoji];
    }
  });

  // Dump any leftover into the top emoji
  if (remaining > 0 && shuffled.length > 0) {
    counts[shuffled[0].emoji] += remaining;
  }

  return counts;
}

export default function CommunityPost({ post }: { post: CommunityPostType }) {
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [interested, setInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(post.interestedCount || 0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  // Generate target counts once
  const [targetCounts] = useState(() => generateReactions(post));
  const [displayCounts, setDisplayCounts] = useState<Record<string, number>>(() => {
    // Start with ~70-90% of target (simulates "already loaded" state)
    const initial: Record<string, number> = {};
    const rng = seedRandom(post.id + "display");
    REACTIONS.forEach((r) => {
      const target = targetCounts[r.emoji] || 0;
      const showPct = 0.7 + rng() * 0.2;
      initial[r.emoji] = Math.floor(target * showPct);
    });
    return initial;
  });

  // Gradually trickle in remaining reactions over 10-30 seconds
  useEffect(() => {
    const remaining: { emoji: string; left: number }[] = [];
    REACTIONS.forEach((r) => {
      const left = (targetCounts[r.emoji] || 0) - (displayCounts[r.emoji] || 0);
      if (left > 0) remaining.push({ emoji: r.emoji, left });
    });

    if (remaining.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    remaining.forEach(({ emoji, left }) => {
      for (let i = 0; i < left; i++) {
        // Stagger each +1 between 3-25 seconds with randomness
        const delay = 3000 + Math.random() * 22000 + i * (2000 + Math.random() * 5000);
        timers.push(
          setTimeout(() => {
            setDisplayCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
          }, delay)
        );
      }
    });

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = TYPE_STYLES[post.type];
  const totalVotes = post.pollOptions?.reduce((sum, opt) => sum + opt.votes, 0) || 0;

  function handleVote(optionId: string) {
    if (votedOption) return;
    setVotedOption(optionId);
  }

  function handleInterested() {
    if (interested) return;
    setInterested(true);
    setInterestCount((c) => c + 1);
  }

  function handleReaction(emoji: string) {
    if (selectedReaction === emoji) {
      setSelectedReaction(null);
      setDisplayCounts((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) - 1) }));
    } else {
      if (selectedReaction) {
        setDisplayCounts((prev) => ({ ...prev, [selectedReaction!]: Math.max(0, (prev[selectedReaction!] || 0) - 1) }));
      }
      setSelectedReaction(emoji);
      setDisplayCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    }
  }

  return (
    <article className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1]">
      {/* Pinned indicator */}
      {post.pinned && (
        <div className="absolute -top-3 left-6 bg-pulse-orange text-white text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full">
          Pinned
        </div>
      )}

      {/* Header: type badge + date */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${style.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className={`text-xs font-semibold tracking-wide uppercase ${style.text}`}>
            {style.label}
          </span>
        </div>
        <span className="text-white/25 text-xs">{post.date}</span>
      </div>

      {/* Title */}
      <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
        {post.title}
      </h3>

      {/* Content */}
      <p className="text-white/60 text-sm leading-relaxed mb-5">
        {post.content}
      </p>

      {/* Author */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-6 h-6 rounded-full bg-pulse-orange/30 flex items-center justify-center">
          <span className="text-[10px] font-bold text-pulse-orange">
            {post.author.charAt(0)}
          </span>
        </div>
        <span className="text-white/40 text-xs">{post.author}</span>
      </div>

      {/* Poll options */}
      {post.type === "poll" && post.pollOptions && (
        <div className="space-y-2.5 mb-5">
          {post.pollOptions.map((option) => {
            const pct = totalVotes > 0 ? Math.round(((option.votes + (votedOption === option.id ? 1 : 0)) / (totalVotes + (votedOption ? 1 : 0))) * 100) : 0;
            const isSelected = votedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={!!votedOption}
                className={`w-full relative overflow-hidden rounded-xl border transition-all duration-300 text-left ${
                  isSelected
                    ? "border-pulse-orange/50 bg-pulse-orange/10"
                    : votedOption
                    ? "border-white/5 bg-white/[0.02]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] cursor-pointer"
                }`}
              >
                {votedOption && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                      isSelected ? "bg-pulse-orange/15" : "bg-white/[0.03]"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-4 py-3">
                  <span className={`text-sm ${isSelected ? "text-white font-medium" : "text-white/70"}`}>
                    {option.text}
                  </span>
                  {votedOption && (
                    <span className={`text-sm font-semibold ml-3 ${isSelected ? "text-pulse-orange" : "text-white/30"}`}>
                      {pct}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          <p className="text-white/20 text-xs mt-2">
            {totalVotes + (votedOption ? 1 : 0)} votes
          </p>
        </div>
      )}

      {/* Community Event details + interested button */}
      {post.type === "community_event" && (
        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            {post.eventDate && (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-xs">📅</span>
                <span className="text-white/50 text-sm">{post.eventDate}</span>
              </div>
            )}
            {post.eventLocation && (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-xs">📍</span>
                <span className="text-white/50 text-sm">{post.eventLocation}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleInterested}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              interested
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/[0.05] text-white/50 border border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 cursor-pointer"
            }`}
          >
            <span>{interested ? "✓" : "👋"}</span>
            <span>{interested ? "You're interested" : "I'm interested"}</span>
            <span className="text-white/20 ml-1">({interestCount})</span>
          </button>
        </div>
      )}

      {/* Emoji reactions bar */}
      <div className="border-t border-white/[0.05] pt-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {REACTIONS.map((reaction) => {
            const count = displayCounts[reaction.emoji] || 0;
            const isActive = selectedReaction === reaction.emoji;

            // Only show emojis that have counts or are being hovered
            return (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                aria-label={reaction.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white/[0.12] border border-white/20 scale-105"
                    : count > 0
                    ? "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12]"
                    : "bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.08] opacity-50 hover:opacity-100"
                }`}
              >
                <span className={`text-sm ${isActive ? "scale-110" : ""} transition-transform duration-200`}>
                  {reaction.emoji}
                </span>
                {count > 0 && (
                  <span className={`tabular-nums transition-all duration-300 ${isActive ? "text-white/70" : "text-white/30"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
