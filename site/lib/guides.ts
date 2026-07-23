import fs from "fs";
import path from "path";

// Evergreen "pillar" guides — long-lived Tampa Bay resources linked from every
// newsletter issue. Unlike newsletters these are not dated; they are updated in
// place. Same defensive dir resolution as the newsletter loader, because
// Vercel's cwd and outputFileTracing don't always agree.

export interface Guide {
  slug: string;
  title: string;
  emoji: string;
  blurb: string;
  updated: string;
  body: string;
}

const CANDIDATE_DIRS = [
  path.join(process.cwd(), "content", "guides"),
  path.join(process.cwd(), "site", "content", "guides"),
  path.join(process.cwd(), ".next", "server", "content", "guides"),
  path.join(process.cwd(), "..", "content", "guides"),
];

function resolveGuidesDir(): string | null {
  for (const dir of CANDIDATE_DIRS) {
    try {
      if (fs.existsSync(dir)) return dir;
    } catch {
      // ignore
    }
  }
  return null;
}

// Front matter is a simple `key: value` block between --- fences.
function parseGuide(slug: string, raw: string): Guide {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const meta: Record<string, string> = {};
  let body = raw;
  if (fm) {
    for (const line of fm[1].split(/\r?\n/)) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    body = fm[2];
  }
  return {
    slug,
    title: meta.title || slug,
    emoji: meta.emoji || "📍",
    blurb: meta.blurb || "",
    updated: meta.updated || "",
    body: body.trim(),
  };
}

export function getAllGuides(): Guide[] {
  const dir = resolveGuidesDir();
  if (!dir) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseGuide(f.replace(/\.md$/, ""), fs.readFileSync(path.join(dir, f), "utf-8")))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getGuide(slug: string): Guide | null {
  const dir = resolveGuidesDir();
  if (!dir) return null;
  const file = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return parseGuide(slug, fs.readFileSync(file, "utf-8"));
}
