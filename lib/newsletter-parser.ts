import fs from "fs";
import path from "path";

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

const NEWSLETTERS_DIR = path.join(
  process.cwd(),
  "content",
  "newsletters"
);

export function getNewsletterFiles(): string[] {
  if (!fs.existsSync(NEWSLETTERS_DIR)) return [];
  return fs.readdirSync(NEWSLETTERS_DIR).filter((f) => f.endsWith(".md"));
}

export function findNewsletterFile(issueNumber: number): string | null {
  const files = getNewsletterFiles();
  const match = files.find((f) =>
    f.startsWith(`issue-${issueNumber}-`)
  );
  return match ? path.join(NEWSLETTERS_DIR, match) : null;
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
  return content.split(/\n---\n/).map((s) => s.trim());
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

  return result;
}

function getIssueTitleFromData(issueNumber: number): string {
  // Import from the data file to get the title
  // Since this is a server-side function, we read the data file
  const titles: Record<number, string> = {
    1: "New Year, New Moves",
    2: "Cold Snap & Hot Takes",
    3: "Bundle Up, Tampa",
    4: "Gasparilla Season Begins",
    5: "The Coldest Gasparilla Ever",
    6: "Super Bowl Snacks & State Fair Vibes",
    7: "Valentine's in Ybor",
    8: "Ink, Runs & Spring Training",
    9: "Barry's Last Bow & Art on the River",
    10: "Strawberry Fields & Spring Training",
    11: "St. Patrick's Week Takeover",
    12: "March Madness Comes to Tampa",
    13: "World Record Cubans & Sand Castles",
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
