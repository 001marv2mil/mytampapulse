import { notFound } from "next/navigation";
import Link from "next/link";
import {
  parseNewsletter,
  getAllIssueNumbers,
  getArchiveIssues,
  getLatestIssueNumber,
} from "@/lib/newsletter-parser";
import ReferralSection from "@/components/ReferralSection";
import ScrollGate from "@/components/ScrollGate";

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
  const archiveEntry = getArchiveIssues().find((i) => i.number === issueNumber);

  return {
    title: archiveEntry
      ? `${archiveEntry.title} | Tampa Pulse Issue #${issueNumber}`
      : `Issue #${issueNumber} | Tampa Pulse`,
    description: `Tampa Pulse Issue #${issueNumber}. Your weekly guide to the best events, nightlife, food, and hidden gems in Tampa.`,
  };
}

function getWeatherEmojiClass(emoji: string): string {
  if (emoji.includes("\u2600\uFE0F") || emoji === "\u2600") return "weather-sun";
  if (emoji.includes("\uD83C\uDF24")) return "weather-partly";
  if (emoji.includes("\u26C5")) return "weather-cloud";
  if (emoji.includes("\uD83C\uDF27") || emoji.includes("\uD83C\uDF26")) return "weather-rain";
  if (emoji.includes("\u26C8") || emoji.includes("\uD83C\uDF29")) return "weather-storm";
  return "weather-sun";
}

function renderMarkdownInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match;
  const working = text.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
  while ((match = regex.exec(working)) !== null) {
    if (match.index > lastIndex) parts.push(working.slice(lastIndex, match.index));
    if (match[1]) parts.push(<strong key={match.index} className="text-gray-900 font-semibold">{match[1]}</strong>);
    else if (match[2]) parts.push(<em key={match.index}>{match[2]}</em>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < working.length) parts.push(working.slice(lastIndex));
  return parts;
}

function stripEmDashes(text: string): string {
  return text.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
}

export default async function NewsletterIssuePage({ params }: PageProps) {
  const { issue: issueParam } = await params;
  const issueNumber = parseInt(issueParam, 10);

  if (isNaN(issueNumber)) notFound();

  const newsletter = parseNewsletter(issueNumber);
  if (!newsletter) notFound();

  const archiveEntry = getArchiveIssues().find((i) => i.number === issueNumber);
  const allNumbers = getAllIssueNumbers();
  const currentIndex = allNumbers.indexOf(issueNumber);
  const prevIssue = currentIndex > 0 ? allNumbers[currentIndex - 1] : null;
  const nextIssue = currentIndex < allNumbers.length - 1 ? allNumbers[currentIndex + 1] : null;
  const isLatest = issueNumber === getLatestIssueNumber();

  // Older issues: show title + blurred content + subscribe wall
  if (!isLatest) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] pt-24 pb-20">
        <article className="max-w-2xl mx-auto px-6">
          <header className="mb-12 text-center">
            <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-3 block">
              Issue #{issueNumber} &middot; {archiveEntry?.date || newsletter.dateRange}
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
              {stripEmDashes(newsletter.title)}
            </h1>
            <p className="text-gray-400 text-sm">
              {stripEmDashes(newsletter.dateRange)} &middot; {newsletter.subtitle || "The Bay, Simplified"}
            </p>
          </header>

          <hr className="border-gray-200 mb-10" />

          {/* Blurred content preview */}
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none space-y-6" aria-hidden="true">
              {newsletter.greeting && (
                <p className="text-gray-700 text-base leading-relaxed">{stripEmDashes(newsletter.greeting)}</p>
              )}
              {newsletter.weekAtAGlance.length > 0 && (
                <div>
                  <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">This Week at a Glance</h2>
                  <ol className="space-y-2">
                    {newsletter.weekAtAGlance.slice(0, 4).map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="text-pulse-orange font-bold text-sm w-6 shrink-0">{i + 1}.</span>
                        <span className="text-gray-700 text-sm">{stripEmDashes(item)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {newsletter.digest.slice(0, 3).map((item, i) => (
                <p key={i} className="text-gray-600 text-sm border-b border-gray-100 pb-2">{item}</p>
              ))}
            </div>

            {/* Fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFFBF7]/60 to-[#FFFBF7]" />

            {/* Subscribe wall */}
            <div className="relative mt-6 text-center bg-white rounded-3xl p-10 border border-orange-100 shadow-lg">
              <div className="bg-pulse-orange/10 border border-pulse-orange/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-pulse-orange">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">This issue is for subscribers</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-2 max-w-sm mx-auto">
                Subscribe free and get every issue of Tampa Pulse delivered to your inbox every Thursday.
              </p>
              <p className="text-gray-400 text-xs mb-8">Takes 10 seconds. No spam, ever.</p>
              <Link href="/" className="inline-block bg-pulse-orange hover:bg-pulse-orange/90 text-white font-semibold px-10 py-3.5 rounded-xl transition-colors">
                Subscribe Free →
              </Link>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <Link href={`/newsletter/${getLatestIssueNumber()}`} className="text-pulse-orange text-sm hover:underline">
                  Read the latest issue →
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  // Latest issue: full content with scroll-triggered fade + subscribe gate
  return (
    <div className="min-h-screen bg-[#FFFBF7] pt-24 pb-20">
      <article className="max-w-2xl mx-auto px-6">
        {/* Issue header */}
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

        {/* ScrollGate wraps all content — fades and gates on scroll */}
        <ScrollGate>
          {/* Greeting */}
          {newsletter.greeting && (
            <section className="mb-10">
              <p className="text-gray-700 text-base leading-relaxed">
                {stripEmDashes(newsletter.greeting)}
              </p>
            </section>
          )}

          {/* Recap + Teaser */}
          {newsletter.recap && (
            <section className="mb-10">
              <p className="text-gray-500 text-sm leading-relaxed">
                {stripEmDashes(newsletter.recap)}
              </p>
            </section>
          )}

          {/* Pro Tip */}
          {newsletter.proTip && (
            <section className="mb-12">
              <div className="border-l-2 border-pulse-orange pl-5 py-1 bg-orange-50 rounded-r-xl pr-4">
                <span className="text-pulse-orange text-xs font-semibold tracking-[0.2em] uppercase mb-2 block">Pro Tip</span>
                <p className="text-gray-600 text-sm leading-relaxed italic">{stripEmDashes(newsletter.proTip)}</p>
              </div>
            </section>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* This Week at a Glance */}
          {newsletter.weekAtAGlance.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">This Week at a Glance</h2>
              <ol className="space-y-3">
                {newsletter.weekAtAGlance.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-pulse-orange font-heading font-bold text-sm mt-0.5 w-6 shrink-0">{i + 1}.</span>
                    <span className="text-gray-700 text-sm leading-relaxed">{stripEmDashes(item)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Weather */}
          {newsletter.weatherTable.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">7-Day Weather Whisper</h2>
              {newsletter.weatherIntro && (
                <p className="text-gray-500 text-sm mb-6">{stripEmDashes(newsletter.weatherIntro)}</p>
              )}
              <div className="overflow-x-auto -mx-2 rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
                      <th className="text-left py-2 px-3 font-medium">Day</th>
                      <th className="text-left py-2 px-3 font-medium"></th>
                      <th className="text-left py-2 px-3 font-medium">Hi/Lo</th>
                      <th className="text-left py-2 px-3 font-medium">Conditions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    {newsletter.weatherTable.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-2.5 px-3 font-medium text-gray-800">{row.day}</td>
                        <td className="py-2.5 px-3">
                          <span className={`weather-emoji ${getWeatherEmojiClass(row.emoji)}`}>{row.emoji}</span>
                        </td>
                        <td className="py-2.5 px-3">{stripEmDashes(row.hiLo)}</td>
                        <td className="py-2.5 px-3">{stripEmDashes(row.conditions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Marv's Pro Tips */}
          {newsletter.proTips.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Marv&apos;s Tampa Pro Tips</h2>
              <ul className="space-y-4">
                {newsletter.proTips.map((tip, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-pulse-orange mt-1.5 shrink-0">&bull;</span>
                    <p className="text-gray-600 text-sm leading-relaxed">{renderMarkdownInline(tip.text)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Image 1 */}
          {newsletter.images[0] && (
            <div className="mb-12 rounded-2xl overflow-hidden shadow-sm">
              <img src={newsletter.images[0].src} alt={newsletter.images[0].alt} className="w-full h-56 sm:h-72 object-cover" />
              {newsletter.images[0].alt && <p className="text-gray-400 text-xs mt-2 italic px-1">{stripEmDashes(newsletter.images[0].alt)}</p>}
            </div>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Digest */}
          {newsletter.digest.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Digest</h2>
              <div className="space-y-3">
                {newsletter.digest.map((item, i) => (
                  <div key={i} className="py-2.5 border-b border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed">{renderMarkdownInline(item)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Hidden Gems */}
          {newsletter.hiddenGems.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Hidden Gems</h2>
              <div className="space-y-5">
                {newsletter.hiddenGems.map((gem, i) => (
                  <div key={i} className="py-1">
                    <p className="text-gray-600 text-sm leading-relaxed">{renderMarkdownInline(gem)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Image 2 */}
          {newsletter.images[1] && (
            <div className="mb-12 rounded-2xl overflow-hidden shadow-sm">
              <img src={newsletter.images[1].src} alt={newsletter.images[1].alt} className="w-full h-56 sm:h-72 object-cover" />
              {newsletter.images[1].alt && <p className="text-gray-400 text-xs mt-2 italic px-1">{stripEmDashes(newsletter.images[1].alt)}</p>}
            </div>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Community Pick */}
          {newsletter.communityPickBody.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-1">Community Pick</h2>
              {newsletter.communityPickTitle && (
                <p className="text-gray-400 text-sm mb-6">{stripEmDashes(newsletter.communityPickTitle)}</p>
              )}
              <div className="space-y-4 border-l-2 border-pulse-orange/40 pl-5">
                {newsletter.communityPickBody.map((para, i) => {
                  const paragraphs = para.split("\n\n").filter((p) => p.trim());
                  return paragraphs.map((p, j) => {
                    const trimmed = p.trim();
                    if (trimmed.startsWith("*") && trimmed.endsWith("*") && !trimmed.startsWith("**")) {
                      return <p key={`${i}-${j}`} className="text-gray-400 text-sm leading-relaxed italic">{stripEmDashes(trimmed.replace(/^\*|\*$/g, ""))}</p>;
                    }
                    return <p key={`${i}-${j}`} className="text-gray-600 text-sm leading-relaxed">{renderMarkdownInline(stripEmDashes(trimmed))}</p>;
                  });
                })}
              </div>
            </section>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Local Business */}
          {newsletter.localBusiness.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">New in Town</h2>
              <ul className="space-y-3">
                {newsletter.localBusiness.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start py-1">
                    <span className="text-pulse-orange mt-1.5 shrink-0">&bull;</span>
                    <p className="text-gray-600 text-sm leading-relaxed">{renderMarkdownInline(item)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Civic */}
          {newsletter.civic.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Civic &amp; Community</h2>
              <ul className="space-y-3">
                {newsletter.civic.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start py-1">
                    <span className="text-gray-300 mt-1.5 shrink-0">&bull;</span>
                    <p className="text-gray-500 text-sm leading-relaxed">{renderMarkdownInline(item)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Upcoming Features */}
          {newsletter.upcomingFeatures.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">Upcoming Features</h2>
              <ul className="space-y-3">
                {newsletter.upcomingFeatures.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start py-1">
                    <span className="text-pulse-orange mt-1.5 shrink-0">&bull;</span>
                    <p className="text-gray-500 text-sm leading-relaxed">{renderMarkdownInline(item)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Event Roundup */}
          {newsletter.eventRoundup.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6">What&apos;s Happenin&apos;. Event Roundup</h2>
              <div className="space-y-3">
                {newsletter.eventRoundup.map((item, i) => (
                  <div key={i} className="py-2.5 border-b border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed">{renderMarkdownInline(item)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Image 3 */}
          {newsletter.images[2] && (
            <div className="mb-12 rounded-2xl overflow-hidden shadow-sm">
              <img src={newsletter.images[2].src} alt={newsletter.images[2].alt} className="w-full h-56 sm:h-72 object-cover" />
              {newsletter.images[2].alt && <p className="text-gray-400 text-xs mt-2 italic px-1">{stripEmDashes(newsletter.images[2].alt)}</p>}
            </div>
          )}

          {/* Signoff */}
          {newsletter.signoff && (
            <section className="mb-12 text-center bg-orange-50 rounded-2xl p-8">
              {newsletter.signoff.split("\n").filter((l) => l.trim()).map((line, i) => {
                const clean = stripEmDashes(line.trim());
                if (clean.toLowerCase().includes("marv")) return <p key={i} className="font-heading font-bold text-gray-900 text-lg">{clean}</p>;
                if (clean.toLowerCase().includes("see you") || clean.toLowerCase().includes("next thursday") || clean.toLowerCase().includes("next week")) return <p key={i} className="text-gray-500 text-sm mb-2">{clean}</p>;
                return <p key={i} className="text-gray-500 text-sm leading-relaxed mb-4">{clean}</p>;
              })}
            </section>
          )}

          <hr className="border-gray-200 mb-10" />

          {/* Issue Navigation */}
          <div className="flex items-center justify-between mb-12">
            {prevIssue ? (
              <Link href={`/newsletter/${prevIssue}`} className="text-gray-400 hover:text-pulse-orange transition-colors text-sm">
                &larr; Issue #{prevIssue}
              </Link>
            ) : <span />}
            <Link href="/newsletter" className="text-gray-400 hover:text-pulse-orange transition-colors text-sm">All Issues</Link>
            {nextIssue ? (
              <Link href={`/newsletter/${nextIssue}`} className="text-gray-400 hover:text-pulse-orange transition-colors text-sm">
                Issue #{nextIssue} &rarr;
              </Link>
            ) : <span />}
          </div>

          {/* Referral */}
          <div className="-mx-6">
            <ReferralSection />
          </div>
        </ScrollGate>
      </article>
    </div>
  );
}
