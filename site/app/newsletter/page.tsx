"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { archiveIssues } from "@/lib/data";

export default function NewsletterDashboard() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] pt-28 pb-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 bg-pulse-orange rounded-full animate-pulse" />
            <span className="text-pulse-orange text-xs font-semibold tracking-wider uppercase">Issue Archive</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Every Issue, One Place. 📬
          </h1>
          <p className="text-gray-500 text-base max-w-lg">
            {archiveIssues.length} issues and counting. Tampa&apos;s best weekly picks, every Thursday.
          </p>
        </motion.div>

        {/* All issues — locked */}
        <div className="relative">
          <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-5">All Issues</p>

          {/* Blurred, non-interactive grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 blur-sm pointer-events-none select-none"
            aria-hidden="true"
          >
            {archiveIssues.map((issue) => (
              <div
                key={issue.id}
                className="relative rounded-2xl overflow-hidden border border-gray-100 bg-white"
              >
                <div className="relative h-44 overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${issue.image})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-pulse-orange text-white text-xs font-bold px-2.5 py-1 rounded-full">#{issue.number}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white/70">
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-gray-900 font-bold text-base leading-snug mb-2 line-clamp-2">
                    {issue.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">{issue.date}</span>
                    <span className="text-gray-300 text-xs">{issue.eventCount} picks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gate overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-gradient-to-b from-transparent via-white/30 to-white/80">
            <div className="text-center bg-white/95 backdrop-blur-md rounded-3xl p-10 max-w-md w-full mx-4 border border-orange-100 shadow-xl">
              <div className="bg-pulse-orange/10 border border-pulse-orange/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-pulse-orange">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Subscribers Only
              </h2>
              <p className="text-gray-500 mb-2 text-sm leading-relaxed">
                {archiveIssues.length} issues locked for subscribers. Free to join.
              </p>
              <p className="text-gray-400 text-xs mb-7">
                Takes 10 seconds. Delivered every Thursday.
              </p>
              <Link
                href="/"
                className="block w-full bg-pulse-orange hover:bg-pulse-orange/90 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-center"
              >
                Subscribe Free →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
