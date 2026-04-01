import { notFound } from "next/navigation";
import Link from "next/link";
import {
  parseNewsletter,
  getAllIssueNumbers,
} from "@/lib/newsletter-parser";
import { archiveIssues } from "@/lib/data";
import ReferralSection from "@/components/ReferralSection";

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

function getWeatherEmojiClass(emoji: string): string {
  if (emoji.includes("\u2600\uFE0F") || emoji === "\u2600") return "weather-sun";
  if (emoji.includes("\uD83C\uDF24")) return "weather-partly";
  if (emoji.includes("\u26C5")) return "weather-cloud";
  if (emoji.includes("\uD83C\uDF27") || emoji.includes("\uD83C\uDF26")) return "weather-rain";
  if (emoji.includes("\u26C8") || emoji.includes("\uD83C\uDF29")) return "weather-storm";
  return "weather-sun";
}

function renderMarkdownInline(text: string): React.ReactNode[] {
  // Parse **bold** and *italic* inline markdown
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match;

  const working = text.replace(/\u2014/g, "-").replace(/\u2013/g, "-");

  while ((match = regex.exec(working)) !== null) {
    if (match.index > lastIndex) {
      parts.push(working.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(
        <strong key={match.index} className="text-white font-semibold">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      parts.push(
        <em key={match.index}>{match[2]}</em>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < working.length) {
    parts.push(working.slice(lastIndex));
  }
  return parts;
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
  const allNumbers = getAllIssueNumbers();
  const currentIndex = allNumbers.indexOf(issueNumber);
  const prevIssue = currentIndex > 0 ? allNumbers[currentIndex - 1] : null;
  const nextIssue =
    currentIndex < allNumbers.length - 1 ? allNumbers[currentIndex + 1] : null;

  // Track image index for alternating placement
  let imageIndex = 0;

  return (
    <div className="pt-24 pb-20">
      <article className="max-w-2xl mx-auto px-6">
        {/* Issue header */}
        <header className="mb-12 text-center">
          <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-3 block">
            Issue #{issueNumber} &middot;{" "}
            {archiveEntry?.date || newsletter.dateRange}
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
            {stripEmDashes(newsletter.title)}
          </h1>
          <p className="text-white/30 text-sm">
            {stripEmDashes(newsletter.dateRange)} &middot;{" "}
            {newsletter.subtitle || "The Bay, Simplified"}
          </p>
        </header>

        <hr className="border-white/10 mb-10" />

        {/* Greeting */}
        {newsletter.greeting && (
          <section className="mb-10">
            <p className="text-white/80 text-base leading-relaxed">
              {stripEmDashes(newsletter.greeting)}
            </p>
          </section>
        )}

        {/* Recap + Teaser */}
        {newsletter.recap && (
          <section className="mb-10">
            <p className="text-white/60 text-sm leading-relaxed">
              {stripEmDashes(newsletter.recap)}
            </p>
          </section>
        )}

        {/* Pro Tip */}
        {newsletter.proTip && (
          <section className="mb-12">
            <div className="border-l-2 border-pulse-orange pl-5 py-1">
              <span className="text-pulse-orange text-xs font-semibold tracking-[0.2em] uppercase mb-2 block">
                Pro Tip
              </span>
              <p className="text-white/70 text-sm leading-relaxed italic">
                {stripEmDashes(newsletter.proTip)}
              </p>
            </div>
          </section>
        )}

        <hr className="border-white/10 mb-10" />

        {/* This Week at a Glance */}
        {newsletter.weekAtAGlance.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              This Week at a Glance
            </h2>
            <ol className="space-y-3">
              {newsletter.weekAtAGlance.map((item, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-pulse-orange font-heading font-bold text-sm mt-0.5 w-6 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-white/80 text-sm leading-relaxed">
                    {stripEmDashes(item)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Weather */}
        {newsletter.weatherTable.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-2">
              7-Day Weather Whisper
            </h2>
            {newsletter.weatherIntro && (
              <p className="text-white/50 text-sm mb-6">
                {stripEmDashes(newsletter.weatherIntro)}
              </p>
            )}
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/30 text-xs uppercase tracking-wider">
                    <th className="text-left py-2 px-3 font-medium">Day</th>
                    <th className="text-left py-2 px-3 font-medium"></th>
                    <th className="text-left py-2 px-3 font-medium">
                      Hi/Lo
                    </th>
                    <th className="text-left py-2 px-3 font-medium">
                      Conditions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {newsletter.weatherTable.map((row, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-2.5 px-3 font-medium text-white/90">
                        {row.day}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`weather-emoji ${getWeatherEmojiClass(row.emoji)}`}
                        >
                          {row.emoji}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {stripEmDashes(row.hiLo)}
                      </td>
                      <td className="py-2.5 px-3">
                        {stripEmDashes(row.conditions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Marv's Pro Tips */}
        {newsletter.proTips.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              Marv&apos;s Tampa Pro Tips
            </h2>
            <ul className="space-y-4">
              {newsletter.proTips.map((tip, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-pulse-orange mt-1.5 shrink-0">
                    &bull;
                  </span>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {renderMarkdownInline(tip.text)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Image 1 */}
        {newsletter.images[0] && (
          <div className="mb-12 rounded-xl overflow-hidden">
            <img
              src={newsletter.images[0].src}
              alt={newsletter.images[0].alt}
              className="w-full h-56 sm:h-72 object-cover"
            />
            {newsletter.images[0].alt && (
              <p className="text-white/25 text-xs mt-2 italic">
                {stripEmDashes(newsletter.images[0].alt)}
              </p>
            )}
          </div>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Digest */}
        {newsletter.digest.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              Digest
            </h2>
            <div className="space-y-3">
              {newsletter.digest.map((item, i) => (
                <div key={i} className="py-2.5 border-b border-white/5">
                  <p className="text-white/70 text-sm leading-relaxed">
                    {renderMarkdownInline(item)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Hidden Gems */}
        {newsletter.hiddenGems.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              Hidden Gems
            </h2>
            <div className="space-y-5">
              {newsletter.hiddenGems.map((gem, i) => (
                <div key={i} className="py-1">
                  <p className="text-white/70 text-sm leading-relaxed">
                    {renderMarkdownInline(gem)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Image 2 */}
        {newsletter.images[1] && (
          <div className="mb-12 rounded-xl overflow-hidden">
            <img
              src={newsletter.images[1].src}
              alt={newsletter.images[1].alt}
              className="w-full h-56 sm:h-72 object-cover"
            />
            {newsletter.images[1].alt && (
              <p className="text-white/25 text-xs mt-2 italic">
                {stripEmDashes(newsletter.images[1].alt)}
              </p>
            )}
          </div>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Community Pick */}
        {newsletter.communityPickBody.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-1">
              Community Pick
            </h2>
            {newsletter.communityPickTitle && (
              <p className="text-white/30 text-sm mb-6">
                {stripEmDashes(newsletter.communityPickTitle)}
              </p>
            )}
            <div className="space-y-4 border-l-2 border-pulse-orange/30 pl-5">
              {newsletter.communityPickBody.map((para, i) => {
                const paragraphs = para.split("\n\n").filter((p) => p.trim());
                return paragraphs.map((p, j) => {
                  const trimmed = p.trim();
                  // Check if it's an italic closer line
                  if (
                    trimmed.startsWith("*") &&
                    trimmed.endsWith("*") &&
                    !trimmed.startsWith("**")
                  ) {
                    return (
                      <p
                        key={`${i}-${j}`}
                        className="text-white/40 text-sm leading-relaxed italic"
                      >
                        {stripEmDashes(trimmed.replace(/^\*|\*$/g, ""))}
                      </p>
                    );
                  }
                  return (
                    <p
                      key={`${i}-${j}`}
                      className="text-white/70 text-sm leading-relaxed"
                    >
                      {renderMarkdownInline(stripEmDashes(trimmed))}
                    </p>
                  );
                });
              })}
            </div>
          </section>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Local Business + New in Town */}
        {newsletter.localBusiness.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              New in Town
            </h2>
            <ul className="space-y-3">
              {newsletter.localBusiness.map((item, i) => (
                <li key={i} className="flex gap-3 items-start py-1">
                  <span className="text-pulse-orange mt-1.5 shrink-0">
                    &bull;
                  </span>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {renderMarkdownInline(item)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Civic & Community */}
        {newsletter.civic.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              Civic &amp; Community
            </h2>
            <ul className="space-y-3">
              {newsletter.civic.map((item, i) => (
                <li key={i} className="flex gap-3 items-start py-1">
                  <span className="text-white/30 mt-1.5 shrink-0">
                    &bull;
                  </span>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {renderMarkdownInline(item)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Upcoming Themed Features */}
        {newsletter.upcomingFeatures.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              Upcoming Features
            </h2>
            <ul className="space-y-3">
              {newsletter.upcomingFeatures.map((item, i) => (
                <li key={i} className="flex gap-3 items-start py-1">
                  <span className="text-pulse-orange mt-1.5 shrink-0">
                    &bull;
                  </span>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {renderMarkdownInline(item)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Event Roundup */}
        {newsletter.eventRoundup.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">
              What&apos;s Happenin&apos;. Event Roundup
            </h2>
            <div className="space-y-3">
              {newsletter.eventRoundup.map((item, i) => (
                <div key={i} className="py-2.5 border-b border-white/5">
                  <p className="text-white/70 text-sm leading-relaxed">
                    {renderMarkdownInline(item)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Image 3 (last) */}
        {newsletter.images[2] && (
          <div className="mb-12 rounded-xl overflow-hidden">
            <img
              src={newsletter.images[2].src}
              alt={newsletter.images[2].alt}
              className="w-full h-56 sm:h-72 object-cover"
            />
            {newsletter.images[2].alt && (
              <p className="text-white/25 text-xs mt-2 italic">
                {stripEmDashes(newsletter.images[2].alt)}
              </p>
            )}
          </div>
        )}

        {/* Signoff */}
        {newsletter.signoff && (
          <section className="mb-12 text-center">
            {newsletter.signoff.split("\n").filter((l) => l.trim()).map((line, i, arr) => {
              const clean = stripEmDashes(line.trim());
              if (clean.toLowerCase().includes("marv")) {
                return (
                  <p
                    key={i}
                    className="font-heading font-bold text-white text-lg"
                  >
                    {clean}
                  </p>
                );
              }
              if (
                clean.toLowerCase().includes("see you") ||
                clean.toLowerCase().includes("next thursday") ||
                clean.toLowerCase().includes("next week")
              ) {
                return (
                  <p key={i} className="text-white/60 text-sm mb-2">
                    {clean}
                  </p>
                );
              }
              return (
                <p
                  key={i}
                  className="text-white/60 text-sm leading-relaxed mb-6"
                >
                  {clean}
                </p>
              );
            })}
          </section>
        )}

        <hr className="border-white/10 mb-10" />

        {/* Issue Navigation */}
        <div className="flex items-center justify-between mb-12">
          {prevIssue ? (
            <Link
              href={`/newsletter/${prevIssue}`}
              className="text-white/40 hover:text-pulse-orange transition-colors text-sm"
            >
              &larr; Issue #{prevIssue}
            </Link>
          ) : (
            <span />
          )}
          <Link
            href="/archive"
            className="text-white/40 hover:text-pulse-orange transition-colors text-sm"
          >
            All Issues
          </Link>
          {nextIssue ? (
            <Link
              href={`/newsletter/${nextIssue}`}
              className="text-white/40 hover:text-pulse-orange transition-colors text-sm"
            >
              Issue #{nextIssue} &rarr;
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* Referral */}
        <div className="-mx-6">
          <ReferralSection />
        </div>
      </article>
    </div>
  );
}
