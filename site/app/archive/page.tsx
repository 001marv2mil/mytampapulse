import Link from "next/link";
import { archiveIssues } from "@/lib/data";

export const metadata = {
  title: "Archive | Tampa Pulse",
  description: "Browse past issues of Tampa Pulse. Every week's best events, nightlife, and hidden gems in Tampa.",
};

export default function ArchivePage() {
  // For now, show locked message to all users
  const isSubscribed = false; // TODO: Add real auth check

  return (
    <div className="pt-24 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">
          Past Issues
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
          Archive
        </h1>
        <p className="text-white/40 text-lg max-w-xl">
          Missed a week? We&apos;ve got you. Browse every issue of Tampa Pulse.
        </p>
      </div>

      {/* Grid - BLURRED if not subscribed */}
      <div className={`max-w-7xl mx-auto px-6 relative ${!isSubscribed ? "blur-xl" : ""}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {archiveIssues.map((issue) => (
            <Link
              key={issue.id}
              href={`/newsletter/${issue.number}`}
              className="group relative rounded-2xl overflow-hidden h-[320px] cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${issue.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
              <div className="absolute top-4 left-4 z-10">
                <span className="glass text-white/80 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full">
                  Issue #{issue.number}
                </span>
              </div>
              <div className="absolute top-4 right-4 z-10">
                <span className="text-pulse-orange text-xs font-medium">
                  {issue.eventCount} picks
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                <span className="text-white/30 text-xs font-medium block mb-2">
                  {issue.date}
                </span>
                <h3 className="font-heading text-xl font-bold text-white leading-tight">
                  {issue.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Subscription Gate - shows if NOT subscribed */}
      {!isSubscribed && (
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md rounded-3xl p-8 max-w-md border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-3">Newsletter Locked</h2>
              <p className="text-white/60 mb-6">
                Subscribe to Tampa Pulse to access our complete newsletter archive
              </p>
              <Link
                href="/subscribe"
                className="inline-block bg-pulse-orange hover:bg-pulse-orange/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
