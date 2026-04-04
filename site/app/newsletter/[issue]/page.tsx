import { notFound } from "next/navigation";
import Link from "next/link";
import { parseNewsletter, getAllIssueNumbers } from "@/lib/newsletter-parser";
import { archiveIssues } from "@/lib/data";

interface PageProps {
  params: Promise<{ issue: string }>;
}

export async function generateStaticParams() {
  const numbers = getAllIssueNumbers();
  return numbers.map((n) => ({ issue: String(n) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { issue: issueParam } = await params;
  const issueNumber = parseInt(issueParam, 10);
  const archiveEntry = archiveIssues.find((i) => i.number === issueNumber);

  return {
    title: archiveEntry
      ? `${archiveEntry.title} | Tampa Pulse Issue #${issueNumber}`
      : `Issue #${issueNumber} | Tampa Pulse`,
    description: `Tampa Pulse Issue #${issueNumber}. Your weekly guide to the best events, nightlife, food, and hidden gems in Tampa.`,
  };
}

function stripEmDashes(text: string): string {
  return text.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
}

export default async function NewsletterIssuePage({ params }: PageProps) {
  const { issue: issueParam } = await params;
  const issueNumber = parseInt(issueParam, 10);

  if (isNaN(issueNumber)) {
    notFound();
  }

  const newsletter = parseNewsletter(issueNumber);

  if (!newsletter) {
    notFound();
  }

  const archiveEntry = archiveIssues.find((i) => i.number === issueNumber);

  return (
    <div className="min-h-screen bg-[#FFFBF7] pt-24 pb-20">
      <article className="max-w-2xl mx-auto px-6">
        {/* Issue header — teaser only */}
        <header className="mb-12 text-center">
          <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-3 block">
            Issue #{issueNumber} &middot;{" "}
            {archiveEntry?.date || newsletter.dateRange}
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            {stripEmDashes(newsletter.title)}
          </h1>
          <p className="text-gray-400 text-sm">
            {stripEmDashes(newsletter.dateRange)} &middot;{" "}
            {newsletter.subtitle || "The Bay, Simplified"}
          </p>
        </header>

        <hr className="border-gray-200 mb-10" />

        {/* Greeting teaser — 3 lines max */}
        {newsletter.greeting && (
          <section className="mb-8 relative">
            <p className="text-gray-700 text-base leading-relaxed line-clamp-3">
              {stripEmDashes(newsletter.greeting)}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FFFBF7] to-transparent" />
          </section>
        )}

        {/* Subscription gate */}
        <div className="mt-10 text-center bg-white rounded-3xl p-10 border border-orange-100 shadow-lg">
          <div className="bg-pulse-orange/10 border border-pulse-orange/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-pulse-orange">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            This issue is for subscribers
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2 max-w-sm mx-auto">
            Subscribe free and get every issue of Tampa Pulse delivered to your inbox every Thursday.
          </p>
          <p className="text-gray-400 text-xs mb-8">
            Takes 10 seconds. No spam, ever.
          </p>
          <Link
            href="/"
            className="inline-block bg-pulse-orange hover:bg-pulse-orange/90 text-white font-semibold px-10 py-3.5 rounded-xl transition-colors"
          >
            Subscribe Free →
          </Link>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link href="/newsletter" className="text-gray-400 text-sm hover:text-pulse-orange transition-colors">
              ← Back to archive
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
