import { communityPosts, headlines } from "@/lib/data";
import CommunityPost from "@/components/CommunityPost";
import HeadlineTicker from "@/components/HeadlineTicker";

export const metadata = {
  title: "Community | Tampa Pulse",
  description: "Join the conversation. Polls, questions, announcements, and events from Tampa Pulse.",
};

export default function CommunityPage() {
  // Pinned posts first, then by date (already ordered in data)
  const pinned = communityPosts.filter((p) => p.pinned);
  const unpinned = communityPosts.filter((p) => !p.pinned);

  return (
    <div className="pt-16 pb-20">
      {/* Rotating headline ticker */}
      <div className="sticky top-16 z-40">
        <HeadlineTicker headlines={headlines} />
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-8">
        {/* Page header */}
        <header className="mb-12">
          <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-3 block">
            THE FEED
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Community
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-md">
            Polls, questions, and updates from the Pulse. This is where we talk.
          </p>
        </header>

        {/* Posts feed */}
        <div className="space-y-6">
          {/* Pinned posts */}
          {pinned.map((post) => (
            <CommunityPost key={post.id} post={post} />
          ))}

          {/* Regular posts */}
          {unpinned.map((post) => (
            <CommunityPost key={post.id} post={post} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-white/20 text-sm">
            More posts coming every week. Got something to say?
          </p>
          <p className="text-white/30 text-xs mt-1">
            Reply to any newsletter and your response might end up here.
          </p>
        </div>
      </div>
    </div>
  );
}
