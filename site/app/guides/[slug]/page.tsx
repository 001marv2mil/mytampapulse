import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllGuides, getGuide } from "@/lib/guides";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide | Tampa Pulse" };
  return {
    title: `${guide.title} | Tampa Pulse`,
    description: guide.blurb,
  };
}

// Minimal markdown renderer for guide bodies: h2/h3, bullets, bold, links, paragraphs.
function renderBody(body: string) {
  const blocks = body.split(/\n{2,}/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="font-heading text-2xl font-bold text-gray-900 mt-12 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} className="font-heading text-lg font-bold text-gray-900 mt-8 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
    }
    if (trimmed.split("\n").every((l) => l.trim().startsWith("- "))) {
      return (
        <ul key={i} className="space-y-3 mb-6">
          {trimmed.split("\n").map((l, j) => (
            <li key={j} className="flex gap-3 items-start">
              <span className="text-pulse-orange mt-1.5 shrink-0 text-xs">&bull;</span>
              <span className="text-gray-600 text-[15px] leading-relaxed">{inline(l.trim().slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="text-gray-600 text-[15px] leading-relaxed mb-5">
        {inline(trimmed)}
      </p>
    );
  });
}

function inline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) {
      parts.push(
        <strong key={m.index} className="text-gray-900 font-semibold">
          {m[1]}
        </strong>
      );
    } else if (m[2]) {
      parts.push(
        <a key={m.index} href={m[3]} target="_blank" rel="noopener noreferrer" className="text-pulse-orange hover:underline">
          {m[2]}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <div className="min-h-screen bg-[#FFFBF7] pt-24 pb-20">
      <article className="max-w-2xl mx-auto px-6">
        <Link href="/guides" className="text-gray-400 hover:text-pulse-orange text-sm transition-colors">
          &larr; All guides
        </Link>

        <header className="mt-6 mb-10">
          <span className="text-pulse-orange text-xs font-semibold tracking-[0.18em] uppercase mb-3 block">
            Tampa Pulse Guide
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {guide.emoji} {guide.title}
          </h1>
          {guide.blurb && <p className="text-gray-500 text-base leading-relaxed">{guide.blurb}</p>}
          {guide.updated && <p className="text-gray-400 text-xs mt-3">Updated {guide.updated}</p>}
        </header>

        <hr className="border-gray-200 mb-10" />

        <div>{renderBody(guide.body)}</div>

        <div className="mt-16 text-center bg-orange-50 rounded-2xl p-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">Get this every Thursday</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Tampa Pulse is the weekly rundown of what&apos;s actually happening in Tampa Bay. Free, 10 seconds to subscribe.
          </p>
          <Link
            href="/"
            className="inline-block bg-pulse-orange hover:bg-pulse-orange/90 text-white font-semibold px-10 py-3.5 rounded-xl transition-colors"
          >
            Subscribe Free →
          </Link>
        </div>
      </article>
    </div>
  );
}
