// Diagnostic: parse Issue N and print structure counts. No network calls.
// Usage: npx tsx scripts/check-issue.mts 17

import parserModule from "../lib/newsletter-parser";
const parseNewsletter = (parserModule as any).parseNewsletter ?? (parserModule as any).default?.parseNewsletter;

const issueNumber = Number(process.argv[2] ?? 17);
const p = parseNewsletter(issueNumber);
if (!p) {
  console.error(`Issue ${issueNumber} not found`);
  process.exit(1);
}

console.log({
  issueNumber: p.issueNumber,
  title: p.title,
  subtitle: p.subtitle,
  dateRange: p.dateRange,
  greetingFirst80: p.greeting?.slice(0, 80),
  proTipFirst80: p.proTip?.slice(0, 80),
  weekAtAGlance: p.weekAtAGlance.length,
  weatherRows: p.weatherTable.length,
  proTips: p.proTips.length,
  digest: p.digest.length,
  hiddenGems: p.hiddenGems.length,
  images: p.images.length,
  imageSrcs: p.images.map((i: any) => i.src.slice(0, 60)),
  communityPickFirst80: p.communityPickBody[0]?.slice(0, 80),
  eventRoundup: p.eventRoundup.length,
  signoffFirst80: p.signoff?.slice(0, 80),
});
