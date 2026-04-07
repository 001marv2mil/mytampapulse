import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { events, hiddenGems, liveMusic, digest, weekAtAGlance } from "@/lib/data";
import {
  NEIGHBORHOODS,
  CATEGORIES,
  getNeighborhood,
  getCategory,
  isNeighborhood,
} from "@/lib/seo-data";

const categoryConfig: Record<string, { heading: string; subheading: string; emoji: string; hasFaq: boolean }> = {
  events: { heading: "Tampa Events", subheading: "What's happening in Tampa this weekend — curated by locals, not an algorithm.", emoji: "🎉", hasFaq: true },
  food: { heading: "Tampa Food & Restaurants", subheading: "The spots locals actually eat at — hidden kitchens, new openings, and old favorites.", emoji: "🍽️", hasFaq: true },
  nightlife: { heading: "Tampa Nightlife", subheading: "After dark in Tampa — rooftops, hidden bars, and late nights worth staying up for.", emoji: "🌙", hasFaq: false },
  "things-to-do": { heading: "Things To Do in Tampa", subheading: "A real local's guide to what's actually worth doing in Tampa Bay this week.", emoji: "🗺️", hasFaq: false },
  music: { heading: "Live Music in Tampa", subheading: "Who's playing in Tampa Bay this week — venues, vibes, and whether it's worth going.", emoji: "🎵", hasFaq: false },
  arts: { heading: "Tampa Arts & Culture", subheading: "The creative side of Tampa Bay — galleries, festivals, theater, and things that aren't just bars.", emoji: "🎨", hasFaq: false },
  sports: { heading: "Tampa Sports", subheading: "Bucs, Lightning, Rays, and every game worth watching or attending in Tampa Bay.", emoji: "🏟️", hasFaq: false },
  outdoors: { heading: "Tampa Outdoors", subheading: "Parks, trails, kayaking, beaches, and getting outside in Tampa Bay.", emoji: "🌿", hasFaq: false },
  family: { heading: "Family Things To Do in Tampa", subheading: "Kid-friendly events, attractions, and the best family activities in Tampa Bay.", emoji: "👨‍👩‍👧", hasFaq: false },
  wellness: { heading: "Tampa Wellness", subheading: "Yoga, fitness events, meditation, farmers markets, and living well in Tampa Bay.", emoji: "🧘", hasFaq: false },
};

export function generateStaticParams() {
  return [
    ...CATEGORIES.map((c) => ({ category: c.slug })),
    ...NEIGHBORHOODS.map((n) => ({ category: n.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;

  if (isNeighborhood(category)) {
    const hood = getNeighborhood(category)!;
    const title = `Things To Do in ${hood.name} Tampa | Tampa Pulse`;
    const description = `The best events, food, nightlife, and things to do in ${hood.name}, Tampa. Local picks updated weekly.`;
    return {
      title,
      description,
      keywords: [hood.name, "Tampa", `${hood.name} restaurants`, `${hood.name} events`, `things to do ${hood.name}`, "Tampa Pulse"],
      openGraph: { title, description, type: "website", siteName: "Tampa Pulse" },
    };
  }

  const config = categoryConfig[category];
  if (!config) return { title: "Tampa Pulse" };
  const cat = getCategory(category);
  const title = `${config.heading} | Tampa Pulse`;
  const description = `The best ${cat?.name.toLowerCase() ?? category} in Tampa Bay. ${config.subheading}`;
  return {
    title,
    description: description.slice(0, 155),
    keywords: ["Tampa", "Tampa Bay", category, "things to do in Tampa", "Tampa events", "Tampa Pulse"],
    openGraph: { title, description: description.slice(0, 155), type: "website", siteName: "Tampa Pulse" },
  };
}

type ContentItem = { title: string; desc: string; meta: string; image: string; tag: string };

function getCategoryContent(category: string): { items: ContentItem[]; weekItems: string[] } {
  switch (category) {
    case "events":
      return { items: events.map((e) => ({ title: e.title, desc: e.description ?? "", meta: `${e.date}${e.location ? " · " + e.location : ""}`, image: e.image, tag: e.category })), weekItems: [] };
    case "food":
      return {
        items: [
          ...hiddenGems.map((g) => ({ title: g.name, desc: g.description, meta: g.tagline, image: g.image, tag: "Hidden Gem" })),
          ...digest.filter((d) => d.text.includes("🍽") || d.text.includes("🥪") || d.text.includes("🌮")).map((d) => ({ title: d.text.split(" ").slice(1, 5).join(" "), desc: d.text.replace(/^[^\s]+\s/, ""), meta: "This week", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80", tag: "Food Drop" })),
        ],
        weekItems: [],
      };
    case "nightlife":
      return {
        items: [
          ...events.filter((e) => e.category === "Nightlife").map((e) => ({ title: e.title, desc: e.description ?? "", meta: `${e.date}${e.location ? " · " + e.location : ""}`, image: e.image, tag: "Nightlife" })),
          ...liveMusic.map((m) => ({ title: m.artist, desc: `Live at ${m.venue}`, meta: m.date, image: m.image, tag: "Live Music" })),
        ],
        weekItems: [],
      };
    case "things-to-do":
      return { items: events.map((e) => ({ title: e.title, desc: e.description ?? "", meta: `${e.date}${e.location ? " · " + e.location : ""}`, image: e.image, tag: e.category })), weekItems: weekAtAGlance };
    case "music":
      return { items: liveMusic.map((m) => ({ title: m.artist, desc: `Live at ${m.venue}`, meta: m.date, image: m.image, tag: "Live Music" })), weekItems: [] };
    case "arts":
      return { items: events.filter((e) => e.category === "Events").map((e) => ({ title: e.title, desc: e.description ?? "", meta: `${e.date}${e.location ? " · " + e.location : ""}`, image: e.image, tag: "Arts & Culture" })), weekItems: [] };
    default:
      return { items: [], weekItems: [] };
  }
}

export default async function TampaSlugPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const hood = getNeighborhood(category);
  const config = categoryConfig[category];

  if (!hood && !config) notFound();

  if (hood) {
    return (
      <div className="min-h-screen bg-[#FFFBF7]">
        <section className="pt-32 pb-16 px-6" style={{ background: "linear-gradient(170deg, #FFF0E8 0%, #FFFBF7 60%)" }}>
          <div className="max-w-4xl mx-auto">
            <Link href="/tampa" className="inline-flex items-center gap-1 text-pulse-orange text-xs font-bold tracking-wider uppercase mb-8 hover:opacity-70 transition-opacity">
              ← Tampa Guide
            </Link>
            <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-6 shadow-sm">
              <span className="w-2 h-2 bg-pulse-orange rounded-full animate-pulse" />
              <span className="text-pulse-orange text-xs font-bold tracking-wider uppercase">Neighborhood Guide</span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[0.9] mb-5">{hood.name}</h1>
            <p className="text-gray-600 text-lg max-w-2xl mb-8 leading-relaxed">{hood.description}</p>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-black text-gray-900 mb-6">Explore {hood.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/tampa/${hood.slug}/${c.slug}`} className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-pulse-orange/40 hover:shadow-lg transition-all duration-200">
                  <span className="text-3xl block mb-3">{c.emoji}</span>
                  <h3 className="font-heading font-black text-gray-900 text-lg mb-2 group-hover:text-pulse-orange transition-colors">{c.name} in {hood.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{c.description}</p>
                  <div className="mt-3 text-pulse-orange text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Explore →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 px-6 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-3">
            <Link href={`/tampa/${hood.slug}/faq`} className="bg-gray-900 text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors">{hood.name} FAQ →</Link>
            <Link href={`/guide/${hood.slug}`} className="bg-white border border-gray-200 text-gray-700 font-bold text-sm px-5 py-3 rounded-xl hover:border-gray-400 transition-colors">Full Neighborhood Guide</Link>
          </div>
        </section>

        <section className="py-16 px-6 bg-pulse-orange">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white mb-4">Get {hood.name} in Your Inbox</h2>
            <p className="text-white/80 text-base mb-8">The best of Tampa Bay every Thursday — events, food, nightlife, hidden gems. Free.</p>
            <Link href="/#subscribe" className="inline-block bg-white text-pulse-orange font-black px-8 py-4 rounded-xl text-sm hover:bg-gray-50 transition-all hover:scale-[1.02] shadow-lg">Subscribe Free →</Link>
          </div>
        </section>

        <div className="py-8 px-6 bg-[#FFFBF7] border-t border-gray-100 text-center space-x-6">
          <Link href="/tampa" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">← Tampa Guide</Link>
          <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">Home</Link>
          <Link href="/faq" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">FAQ</Link>
        </div>
      </div>
    );
  }

  const { items, weekItems } = getCategoryContent(category);

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      <section className="pt-32 pb-16 px-6" style={{ background: "linear-gradient(170deg, #FFF0E8 0%, #FFFBF7 60%)" }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/tampa" className="inline-flex items-center gap-1 text-pulse-orange text-xs font-bold tracking-wider uppercase mb-8 hover:opacity-70 transition-opacity">← Tampa Guide</Link>
          <div className="text-5xl mb-4">{config.emoji}</div>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[0.9] mb-5">{config.heading}</h1>
          <p className="text-gray-600 text-lg max-w-2xl mb-8 leading-relaxed">{config.subheading}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tampa" className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 hover:border-pulse-orange hover:text-pulse-orange transition-all">All Categories</Link>
            <Link href={`/tampa/${category}/this-weekend`} className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 hover:border-pulse-orange hover:text-pulse-orange transition-all">This Weekend</Link>
            <Link href={`/tampa/${category}/free`} className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 hover:border-pulse-orange hover:text-pulse-orange transition-all">Free</Link>
            {config.hasFaq && (
              <Link href={`/tampa/${category}/faq`} className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 hover:border-pulse-orange hover:text-pulse-orange transition-all">FAQ →</Link>
            )}
          </div>
        </div>
      </section>

      {weekItems.length > 0 && (
        <section className="py-12 px-6 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-black text-gray-900 mb-6">This Week in Tampa</h2>
            <ul className="space-y-3">
              {weekItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-pulse-orange font-black text-sm mt-0.5 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {items.length === 0 ? (
            <p className="text-gray-400 text-center py-12">Check back Thursday — new picks weekly.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {items.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 transition-all hover:shadow-lg group">
                  {item.image && (
                    <div className="h-48 overflow-hidden relative">
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${item.image})` }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute top-3 left-3 bg-pulse-orange text-white text-[10px] font-bold tracking-wide uppercase px-3 py-1 rounded-full">{item.tag}</span>
                    </div>
                  )}
                  <div className="p-5">
                    <span className="text-gray-400 text-xs font-medium block mb-1">{item.meta}</span>
                    <h3 className="font-heading font-bold text-gray-900 text-lg mb-2 leading-tight">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-6 bg-pulse-orange">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-white mb-4">Never Miss a Tampa Moment</h2>
          <p className="text-white/80 text-base mb-8 max-w-md mx-auto">The best of Tampa Bay hits your inbox every Thursday — events, food, nightlife, hidden gems. Free, always.</p>
          <Link href="/#subscribe" className="inline-block bg-white text-pulse-orange font-black px-8 py-4 rounded-xl text-sm hover:bg-gray-50 transition-all hover:scale-[1.02] shadow-lg">Subscribe Free →</Link>
        </div>
      </section>

      <div className="py-8 px-6 bg-[#FFFBF7] border-t border-gray-100 text-center space-x-6">
        <Link href="/tampa" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">← Tampa Guide</Link>
        <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">Home</Link>
        <Link href="/faq" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">FAQ</Link>
      </div>
    </div>
  );
}
