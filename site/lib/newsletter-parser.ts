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
// lives. First match wins. This is intentionally defensive — without it
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

    // Pro Tip (blockquote section)
    if (firstLine.includes("Pro Tip") && firstLine.startsWith("###")) {
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
    8:  "Tattoos, a 5K, and spring training — Tampa doing the most this weekend",
    9:  "Barry Manilow's last tour, IndyCar on the streets, and art you can actually afford",
    10: "Strawberry season is here. Plus: spring training and why you should go",
    11: "St. Patrick's week in Tampa is unhinged. Here's the full breakdown",
    12: "March Madness is in Tampa. Here's what else is happening this week",
    13: "They're attempting a 370-foot Cuban sandwich. This is real life",
    14: "Billy Strings sold out the arena. Here's what else is happening",
    15: "Donovan Frankenreiter's at Zodiac Live. Here's what else Tampa's got this week",
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

const TAMPA_IMAGES = [
  "https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1564357645071-9726b526a8f2?w=800&q=80",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
  "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80",
  "https://images.unsplash.com/photo-1598520106830-8c45c2035460?w=800&q=80",
  "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80",
  "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80",
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

  for (const f of files) {
    const m = f.match(/^issue-(\d+)-/);
    if (!m) continue;
    const num = parseInt(m[1], 10);

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
