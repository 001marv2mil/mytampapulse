import Link from "next/link";
import { archiveIssues } from "@/lib/data";

export const metadata = {
  title: "Archive | Tampa Pulse",
  description: "Browse past issues of Tampa Pulse. Every week's best events, nightlife, and hidden gems in Tampa.",
};

export default function ArchivePage() {
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

      {/* Gated Section */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative">

          {/* Card grid — no links, pointer-events disabled, blurred */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 blur-sm pointer-events-none select-none"
            aria-hidden="true"
          >
            {archiveIssues.map((issue) => (
              <div
                key={issue.id}
                className="relative rounded-2xl overflow-hidden h-[320px]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${issue.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                {/* Lock icon overlay on each card */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-black/60 rounded-full p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-6 h-6 text-white/70"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <div className="absolute top-4 left-4 z-10">
                  <span className="glass text-white/80 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full">
                    Issue #{issue.number}
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
              </div>
            ))}
          </div>

          {/* Gate overlay — sits on top, fully interactive */}
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-gradient-to-b from-transparent via-black/40 to-black/80">
            <div className="text-center bg-black/90 backdrop-blur-md rounded-3xl p-10 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
              <div className="bg-pulse-orange/10 border border-pulse-orange/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-pulse-orange"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Subscribers Only
              </h2>
              <p className="text-white/60 mb-2 text-sm leading-relaxed">
                {archiveIssues.length} issues of Tampa&apos;s best weekly newsletter — locked for subscribers.
              </p>
              <p className="text-white/40 text-xs mb-7">
                Free to subscribe. Takes 10 seconds.
              </p>
              <Link
                href="/"
                className="block w-full bg-pulse-orange hover:bg-pulse-orange/90 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-center"
              >
                Subscribe — It&apos;s Free
              </Link>
              <p className="text-white/25 text-xs mt-4">
                Already subscribed? Issues are delivered to your inbox every Thursday.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
