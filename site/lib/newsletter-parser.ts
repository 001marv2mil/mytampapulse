import fs from "fs";
import path from "path";
import { getMarvSignoff } from "./marv-signoffs";

export interface WeatherRow {
  day: string;
  emoji: string;
  hiLo: string;
  conditions: string;
}

export interface ParsedNewsletter {
  issueNumber: number;
  title: string;
  subtitle: string;
  dateRange: string;
  greeting: string;
  recap: string;
  proTip: string;
  weekAtAGlance: string[];
  weatherIntro: string;
  weatherTable: WeatherRow[];
  proTips: { text: string; bold: string }[];
  images: { src: string; alt: string }[];
  digest: string[];
  hiddenGems: string[];
  communityPickTitle: string;
  communityPickBody: string[];
  localBusiness: string[];
  civic: string[];
  upcomingFeatures: string[];
  eventRoundup: string[];
  signoff: string;
  footer: string;
}

// Try multiple candidate locations because Vercel's process.cwd() and
// Next.js outputFileTracing don't always agree on where bundled content
// lives. First match wins. This is intentionally defensive without it
// the cron silently returned 0 files and no email ever shipped.
const CANDIDATE_DIRS = [
  path.join(process.cwd(), "content", "newsletters"),
  path.join(process.cwd(), "site", "content", "newsletters"),
  path.join(process.cwd(), ".next", "server", "content", "newsletters"),
  path.join(process.cwd(), "..", "content", "newsletters"),
];

function resolveNewslettersDir(): string | null {
  for (const dir of CANDIDATE_DIRS) {
    try {
      if (fs.existsSync(dir)) return dir;
    } catch {
      // ignore
    }
  }
  return null;
}

const NEWSLETTERS_DIR = resolveNewslettersDir() ?? CANDIDATE_DIRS[0];

export function getNewsletterFiles(): string[] {
  const dir = resolveNewslettersDir();
  if (!dir) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
}

export function findNewsletterFile(issueNumber: number): string | null {
  const dir = resolveNewslettersDir();
  if (!dir) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const match = files.find((f) =>
    f.startsWith(`issue-${issueNumber}-`)
  );
  return match ? path.join(dir, match) : null;
}

export function getLatestIssueNumber(): number {
  const files = getNewsletterFiles();
  let max = 0;
  for (const f of files) {
    const m = f.match(/^issue-(\d+)-/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
}

function splitBySections(content: string): string[] {
  // Split on --- (horizontal rules) that are on their own line
  // Handle both Unix (LF) and Windows (CRLF) line endings
  return content.split(/\r?\n---\r?\n/).map((s) => s.trim());
}

function parseWeatherTable(text: string): WeatherRow[] {
  const rows: WeatherRow[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    // Skip header rows and separator rows
    if (line.startsWith("|--") || line.includes("Day |") || line.includes("High/Low")) continue;
    if (!line.startsWith("|")) continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.length >= 4) {
      rows.push({
        day: cells[0],
        emoji: cells[1],
        hiLo: cells[2],
        conditions: cells[3],
      });
    }
  }
  return rows;
}

function parseBulletList(text: string): string[] {
  const items: string[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      items.push(trimmed.slice(2));
    }
  }
  return items;
}

function parseNumberedList(text: string): string[] {
  const items: string[] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(/^\d+\.\s+(.+)/);
    if (m) {
      items.push(m[1]);
    }
  }
  return items;
}

function parseBlockquote(text: string): string {
  const lines = text.split("\n");
  return lines
    .map((l) => l.replace(/^>\s?/, ""))
    .join("\n")
    .trim();
}

function parseImage(text: string): { src: string; alt: string } | null {
  const m = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (m) return { alt: m[1], src: m[2] };
  return null;
}

export function parseNewsletter(issueNumber: number): ParsedNewsletter | null {
  const filePath = findNewsletterFile(issueNumber);
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const sections = splitBySections(raw);

  const result: ParsedNewsletter = {
    issueNumber,
    title: "",
    subtitle: "",
    dateRange: "",
    greeting: "",
    recap: "",
    proTip: "",
    weekAtAGlance: [],
    weatherIntro: "",
    weatherTable: [],
    proTips: [],
    images: [],
    digest: [],
    hiddenGems: [],
    communityPickTitle: "",
    communityPickBody: [],
    localBusiness: [],
    civic: [],
    upcomingFeatures: [],
    eventRoundup: [],
    signoff: "",
    footer: "",
  };

  for (const section of sections) {
    const lines = section.split("\n");
    const firstLine = lines[0]?.trim() || "";

    // Header section: # Tampa Pulse / ## The Bay / ### date
    if (firstLine === "# Tampa Pulse") {
      for (const line of lines) {
        if (line.startsWith("## ")) result.subtitle = line.slice(3).trim();
        if (line.startsWith("### ") && !line.includes("Recap")) {
          result.dateRange = line.slice(4).trim();
        }
      }
      result.title = getIssueTitleFromData(issueNumber);
      continue;
    }

    // Greeting paragraph (no heading, just text)
    if (
      !firstLine.startsWith("#") &&
      !firstLine.startsWith(">") &&
      !firstLine.startsWith("!") &&
      !firstLine.startsWith("|") &&
      !firstLine.startsWith("-") &&
      !firstLine.startsWith("*Tampa Pulse") &&
      !firstLine.startsWith("*Know someone") &&
      firstLine.length > 50 &&
      !result.greeting
    ) {
      result.greeting = section;
      continue;
    }

    // Recap + Teaser
    if (firstLine.includes("Recap") && firstLine.startsWith("###")) {
      result.recap = lines.slice(1).join("\n").trim();
      continue;
    }

    // Pro Tip (blockquote section). MUST check that this is the SINGULAR
    // "Pro Tip" heading and not the plural "Marv's Pro Tips" otherwise
    // the bulleted Marv's Pro Tips section gets eaten by the blockquote
    // handler and result.proTips ends up empty (rendering nothing).
    if (
      firstLine.includes("Pro Tip") &&
      !firstLine.includes("Pro Tips") &&
      firstLine.startsWith("###")
    ) {
      const rest = lines.slice(1).join("\n").trim();
      result.proTip = parseBlockquote(rest).replace(/^\*|\*$/g, "").trim();
      continue;
    }

    // This Week at a Glance
    if (firstLine.includes("at a Glance") || firstLine.includes("At a Glance")) {
      result.weekAtAGlance = parseNumberedList(section);
      continue;
    }

    // Weather
    if (firstLine.includes("Weather Whisper")) {
      // Extract intro text (between heading and table)
      const tableStart = section.indexOf("|");
      if (tableStart > 0) {
        const introText = section.slice(section.indexOf("\n") + 1, tableStart).trim();
        result.weatherIntro = introText;
      }
      result.weatherTable = parseWeatherTable(section);
      continue;
    }

    // Marv's Pro Tips
    if (firstLine.includes("Pro Tips") && firstLine.startsWith("###")) {
      const items = parseBulletList(section);
      result.proTips = items.map((item) => {
        const boldMatch = item.match(/\*\*([^*]+)\*\*/);
        return {
          text: item.replace(/\*\*([^*]+)\*\*/g, "$1"),
          bold: boldMatch ? boldMatch[1] : "",
        };
      });
      continue;
    }

    // Images
    if (firstLine.startsWith("![")) {
      const img = parseImage(section);
      if (img) result.images.push(img);
      continue;
    }

    // Digest
    if (firstLine.includes("Digest") && firstLine.startsWith("###") && !firstLine.includes("Civic") && !firstLine.includes("Community")) {
      result.digest = parseBulletList(section);
      continue;
    }

    // Hidden Gems
    if (firstLine.includes("Hidden Gem")) {
      result.hiddenGems = parseBulletList(section);
      continue;
    }

    // Community Pick
    if (firstLine.includes("Community Pick")) {
      const bodyLines: string[] = [];
      let title = "";

      for (const line of lines) {
        if (line.startsWith("### ")) {
          title = line.slice(4).trim();
        } else if (line.startsWith("**Community Pick:")) {
          title = line.replace(/\*\*/g, "").trim();
        } else if (line.trim().length > 0) {
          bodyLines.push(line);
        }
      }

      result.communityPickTitle = title
        .replace(/^[^\w]*Community Pick[:\s]*/, "")
        .replace(/^[^\w]*/, "")
        .trim();
      result.communityPickBody = [bodyLines.map((l) => l.replace(/^>\s?/, "")).join("\n").trim()];
      continue;
    }

    // Local Business / New in Town
    if (firstLine.includes("Local Business") || firstLine.includes("New in Town")) {
      result.localBusiness = parseBulletList(section);
      continue;
    }

    // Civic & Community
    if (firstLine.includes("Civic") && firstLine.startsWith("###")) {
      result.civic = parseBulletList(section);
      continue;
    }

    // Upcoming Themed Features
    if (firstLine.includes("Upcoming") && firstLine.includes("Feature")) {
      result.upcomingFeatures = parseBulletList(section);
      continue;
    }

    // Event Roundup
    if (firstLine.includes("Happenin") || firstLine.includes("Event Roundup")) {
      result.eventRoundup = parseBulletList(section);
      continue;
    }

    // Signoff (paragraph that starts with "Alright" or "That's the week" etc, near the end)
    if (
      !firstLine.startsWith("#") &&
      !firstLine.startsWith(">") &&
      !firstLine.startsWith("!") &&
      !firstLine.startsWith("*Tampa Pulse") &&
      !firstLine.startsWith("*Know someone") &&
      firstLine.length > 20 &&
      (section.includes("Marv") || section.includes("See you next")) &&
      result.greeting
    ) {
      result.signoff = section;
      continue;
    }

    // Footer
    if (firstLine.startsWith("*Tampa Pulse")) {
      result.footer = section;
      continue;
    }
  }

  // Always override with the unique Marv sign-off for this issue number
  result.signoff = getMarvSignoff(issueNumber);

  return result;
}

function getIssueTitleFromData(issueNumber: number): string {
  // Import from the data file to get the title
  // Since this is a server-side function, we read the data file
  const titles: Record<number, string> = {
    1:  "The bar nobody's talking about yet (and 6 other things to do this week)",
    2:  "Tampa went from 82° to 37° in 4 days. Here's what's still worth going to",
    3:  "It's cold. Tampa is not handling it. Here's where to go anyway",
    4:  "Gasparilla is coming. Here's how to not be the tourist",
    5:  "Pirates in puffer jackets. The coldest Gasparilla on record",
    6:  "Super Bowl week in Tampa. Plus: State Fair things you'll actually want to eat",
    7:  "Valentine's in Ybor hits different. Here's your plan",
    8:  "Tattoos, a 5K, and spring training Tampa doing the most this weekend",
    9:  "Barry Manilow's last tour, IndyCar on the streets, and art you can actually afford",
    10: "Strawberry season is here. Plus: spring training and why you should go",
    11: "St. Patrick's week in Tampa is unhinged. Here's the full breakdown",
    12: "March Madness is in Tampa. Here's what else is happening this week",
    13: "They're attempting a 370-foot Cuban sandwich. This is real life",
    14: "Billy Strings sold out the arena. Here's what else is happening",
    15: "Donovan Frankenreiter's at Zodiac Live. Here's what else Tampa's got this week",
    16: "Tampa Tarpons, Lightning vs Rangers, and the rest of the week worth showing up for",
    17: "BTS takes Raymond James for THREE nights. Here's the rest of your week",
    18: "Rock the Park is back. Here's the rest of your May 1st week",
    19: "WWE Backlash, Kid Cudi, and a taco spot making tortillas the right way",
    21: "Free crawfish, a 17,000 sqft supper club, and your Memorial Day weekend plan",
    22: "Memorial Day's done. Now Tampa actually gets loud.",
    23: "England at Raymond James. Cliff divers in St. Pete. Tampa's June is not playing around.",
    24: "Juneteenth in Tampa. A food truck worth chasing and a restaurant everyone's about to discover.",
    25: "The longest day of the year is Saturday. Here's how Tampa is spending it.",
  };
  return titles[issueNumber] || `Issue #${issueNumber}`;
}

export function getAllIssueNumbers(): number[] {
  const files = getNewsletterFiles();
  const numbers: number[] = [];
  for (const f of files) {
    const m = f.match(/^issue-(\d+)-/);
    if (m) numbers.push(parseInt(m[1], 10));
  }
  return numbers.sort((a, b) => a - b);
}

// ── Dynamic archive builder ──────────────────────────────────────────
// Reads all newsletter markdown files and builds the archive list
// so new issues show up automatically without editing data.ts.

// Real Tampa Bay / Ybor City photos sourced from Unsplash Tampa searches
const TAMPA_IMAGES = [
  "https://images.unsplash.com/photo-1561063139-e183e66909c4?w=800&q=80",     // Tampa waterfront
  "https://images.unsplash.com/photo-1609964956781-519678450be5?w=800&q=80",  // Tampa Bay
  "https://images.unsplash.com/photo-1656119337375-13bfe30f8e76?w=800&q=80",  // Tampa scene
  "https://images.unsplash.com/photo-1564937183532-839087b287f2?w=800&q=80",  // Tampa Bay area
  "https://images.unsplash.com/photo-1573611586863-e4d9ef7fc2b5?w=800&q=80",  // Tampa Bay
  "https://images.unsplash.com/photo-1621866221044-3945266ebc39?w=800&q=80",  // Tampa waterfront
  "https://images.unsplash.com/photo-1613318222147-473196f4027a?w=800&q=80",  // Tampa Bay
  "https://images.unsplash.com/photo-1613318632229-425f908f0345?w=800&q=80",  // Tampa scene
  "https://images.unsplash.com/photo-1673405910908-b361417f200a?w=800&q=80",  // Tampa Bay area
  "https://images.unsplash.com/photo-1580785692949-7b5b7fd83d25?w=800&q=80",  // Tampa waterfront
  "https://images.unsplash.com/photo-1525360194704-1ae52d86a25d?w=800&q=80",  // Tampa Bay
  "https://images.unsplash.com/photo-1561063139-09996cdf3f49?w=800&q=80",     // Tampa scene
  "https://images.unsplash.com/photo-1671777249018-2ec7fde3c583?w=800&q=80",  // Tampa Bay
  "https://images.unsplash.com/photo-1645771845014-7077d5d0f058?w=800&q=80",  // Tampa area
  "https://images.unsplash.com/photo-1580617332602-5a5ed8bc480f?w=800&q=80",  // Tampa waterfront
  "https://images.unsplash.com/photo-1699734121009-2c18950988f7?w=800&q=80",  // Ybor City
  "https://images.unsplash.com/photo-1669639785851-27fcaeee3a3f?w=800&q=80",  // Ybor City street
  "https://images.unsplash.com/photo-1646082524984-c8d487b92d78?w=800&q=80",  // Ybor City
  "https://images.unsplash.com/photo-1646082524797-8ebbd7840a27?w=800&q=80",  // Ybor clock tower
  "https://images.unsplash.com/photo-1646082525096-cc9f25dc0a3b?w=800&q=80",  // Ybor City
  "https://images.unsplash.com/photo-1646082525085-f79271abdbe1?w=800&q=80",  // Ybor City building
  "https://images.unsplash.com/photo-1696377968227-6cd89ea0e40f?w=800&q=80",  // Ybor City trolley
  "https://images.unsplash.com/photo-1622215216302-2169bd5f4e5f?w=800&q=80",  // Ybor City night
];

export interface ArchiveIssue {
  id: string;
  number: number;
  date: string;
  title: string;
  image: string;
  eventCount: number;
}

function formatDateFromFilename(filename: string): string {
  const m = filename.match(/issue-\d+-(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[parseInt(m[2], 10) - 1];
  const day = parseInt(m[3], 10);
  return `${month} ${day}, ${m[1]}`;
}

function countEvents(issueNumber: number): number {
  const parsed = parseNewsletter(issueNumber);
  if (!parsed) return 0;
  return parsed.eventRoundup.length || parsed.weekAtAGlance.length || 0;
}

function generateTitle(issueNumber: number): string {
  // Use hardcoded title if available, otherwise extract from content
  const title = getIssueTitleFromData(issueNumber);
  if (title !== `Issue #${issueNumber}`) return title;

  // Fallback: use first event from "at a glance" as a hook
  const parsed = parseNewsletter(issueNumber);
  if (parsed && parsed.weekAtAGlance.length > 0) {
    const first = parsed.weekAtAGlance[0];
    // Extract just the event name (before "at" venue)
    const eventName = first.split(" at ")[0].replace(/\*\*/g, "").trim();
    if (eventName.length > 10) {
      return `${eventName}. Here's what else Tampa's got this week`;
    }
  }
  return `Tampa Pulse Issue #${issueNumber}`;
}

export function getArchiveIssues(): ArchiveIssue[] {
  const files = getNewsletterFiles();
  const issues: ArchiveIssue[] = [];
  const seen = new Set<number>(); // deduplicate by issue number

  for (const f of files) {
    const m = f.match(/^issue-(\d+)-/);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    if (seen.has(num)) continue; // skip duplicate issue numbers
    seen.add(num);

    issues.push({
      id: `i-${num}`,
      number: num,
      date: formatDateFromFilename(f),
      title: generateTitle(num),
      image: TAMPA_IMAGES[(num - 1) % TAMPA_IMAGES.length],
      eventCount: countEvents(num),
    });
  }

  // Sort newest first
  issues.sort((a, b) => b.number - a.number);
  return issues;
}
