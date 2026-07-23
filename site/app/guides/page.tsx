import Link from "next/link";
import { getAllGuides } from "@/lib/guides";

export const metadata = {
  title: "Tampa Bay Guides | Tampa Pulse",
  description:
    "Evergreen Tampa Bay guides from Tampa Pulse — bucket lists, game day plans, dog-friendly spots, and the local knowledge worth keeping.",
};

export default function GuidesIndexPage() {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-[#FFFBF7] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <header className="mb-12 text-center">
          <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-3 block">
            Tampa Pulse
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            Tampa Bay Guides
          </h1>
          <p className="text-gray-500 text-base">
            The stuff worth keeping. Updated as the city changes.
          </p>
        </header>

        <hr className="border-gray-200 mb-10" />

        {guides.length === 0 ? (
          <p className="text-gray-400 text-sm text-center">Guides are on the way.</p>
        ) : (
          <div className="space-y-4">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="block bg-white rounded-2xl border border-orange-100 p-6 hover:shadow-md transition-shadow"
              >
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-1.5">
                  {g.emoji} {g.title}
                </h2>
                {g.blurb && <p className="text-gray-500 text-sm leading-relaxed">{g.blurb}</p>}
                <span className="text-pulse-orange text-sm font-medium mt-3 inline-block">Read the guide →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
