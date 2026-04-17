import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NEIGHBORHOODS,
  CATEGORIES,
  MODIFIERS,
  getNeighborhood,
  getCategory,
  getModifier,
  isNeighborhood,
  isCategory,
  isModifier,
} from "@/lib/seo-data";

// neighborhood × category × modifier (25 × 10 × 10 = 2,500 pages)
// URL: /tampa/[neighborhood]/[category]/[modifier]
// e.g. /tampa/ybor-city/food/this-weekend
export function generateStaticParams() {
  return NEIGHBORHOODS.flatMap((n) =>
    CATEGORIES.flatMap((c) =>
      MODIFIERS.map((m) => ({
        category: n.slug,
        modifier: c.slug,
        extra: m.slug,
      }))
    )
  );
}

type Params = { category: string; modifier: string; extra: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category, modifier, extra } = await params;

  if (!isNeighborhood(category) || !isCategory(modifier) || !isModifier(extra)) {
    return { title: "Tampa Pulse" };
  }

  const hood = getNeighborhood(category)!;
  const cat = getCategory(modifier)!;
  const mod = getModifier(extra)!;

  const title = `${cat.name} ${mod.name} in ${hood.name} Tampa | Tampa Pulse`;
  const description = `The best ${cat.name.toLowerCase()} ${mod.name.toLowerCase()} in ${hood.name}, Tampa. Real local picks from Tampa Pulse — updated every Thursday.`;

  return {
    title,
    description,
    keywords: [
      `${cat.name.toLowerCase()} ${mod.name.toLowerCase()} ${hood.name}`,
      `${hood.name} Tampa ${cat.name.toLowerCase()}`,
      `${cat.name.toLowerCase()} ${hood.name} ${mod.name.toLowerCase()}`,
      "Tampa Pulse",
    ],
    openGraph: { title, description, type: "website", siteName: "Tampa Pulse" },
  };
}

export default async function ThreeLevelPage({ params }: { params: Promise<Params> }) {
  const { category, modifier, extra } = await params;

  if (!isNeighborhood(category) || !isCategory(modifier) || !isModifier(extra)) notFound();

  const hood = getNeighborhood(category)!;
  const cat = getCategory(modifier)!;
  const mod = getModifier(extra)!;

  const heading = `${cat.name} ${mod.name} in ${hood.name}`;
  const subheading = `Local picks for ${cat.name.toLowerCase()} ${mod.name.toLowerCase()} in ${hood.name}, Tampa — curated by people who live here.`;

  const breadcrumb = [
    { label: "Tampa", href: "/tampa" },
    { label: hood.name, href: `/tampa/${hood.slug}` },
    { label: cat.name, href: `/tampa/${hood.slug}/${cat.slug}` },
    { label: mod.name, href: `/tampa/${hood.slug}/${cat.slug}/${mod.slug}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: heading,
    description: subheading,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.label,
        item: `https://mytampapulse.com${b.href}`,
      })),
    },
  };

  // Other modifiers for this neighborhood × category
  const otherModifiers = MODIFIERS.filter((m) => m.slug !== extra);
  // Other categories for this neighborhood
  const otherCategories = CATEGORIES.filter((c) => c.slug !== modifier);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-[#FFFBF7]">
        {/* Hero */}
        <section className="pt-32 pb-16 px-6" style={{ background: "linear-gradient(170deg, #FFF0E8 0%, #FFFBF7 60%)" }}>
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
              {breadcrumb.map((b, i) => (
                <span key={b.href} className="flex items-center gap-1.5">
                  {i > 0 && <span>/</span>}
                  <Link href={b.href} className="hover:text-pulse-orange transition-colors">{b.label}</Link>
                </span>
              ))}
            </nav>
            <div className="text-4xl mb-4">{cat.emoji}</div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-5">
              {heading}
            </h1>
            <p className="text-gray-600 text-lg max-w-xl leading-relaxed">{subheading}</p>
          </div>
        </section>

        {/* Content + related */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-10">
              <div className="text-3xl mb-3">{cat.emoji}</div>
              <p className="text-gray-700 font-semibold mb-1">
                {cat.name} {mod.name.toLowerCase()} picks in {hood.name} — every Thursday.
              </p>
              <p className="text-gray-500 text-sm">
                Subscribe free and get the best local picks delivered straight to your inbox.
              </p>
              <Link href="/#subscribe"
                className="inline-block mt-5 bg-pulse-orange text-white font-black px-7 py-3 rounded-xl text-sm hover:opacity-90 transition-all hover:scale-[1.02]">
                Subscribe Free →
              </Link>
            </div>

            {/* Other modifiers */}
            <div className="mb-8">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">More {cat.name} in {hood.name}</p>
              <div className="flex flex-wrap gap-2">
                {otherModifiers.map((m) => (
                  <Link key={m.slug} href={`/tampa/${hood.slug}/${cat.slug}/${m.slug}`}
                    className="text-xs bg-white border border-gray-200 hover:border-pulse-orange hover:text-pulse-orange text-gray-600 px-3 py-1.5 rounded-full transition-all">
                    {cat.name} {m.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Other categories */}
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">More in {hood.name}</p>
              <div className="flex flex-wrap gap-2">
                {otherCategories.map((c) => (
                  <Link key={c.slug} href={`/tampa/${hood.slug}/${c.slug}`}
                    className="text-xs bg-white border border-gray-200 hover:border-pulse-orange hover:text-pulse-orange text-gray-600 px-3 py-1.5 rounded-full transition-all">
                    {c.emoji} {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Subscribe CTA */}
        <section className="py-16 px-6 bg-gray-900">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white mb-4">
              Tampa&apos;s insider guide. Free, every Thursday.
            </h2>
            <p className="text-gray-400 text-base mb-8">
              1,000+ Tampa locals get the best {cat.name.toLowerCase()} picks — and everything else worth knowing — every week.
            </p>
            <Link href="/#subscribe"
              className="inline-block bg-pulse-orange text-white font-black px-8 py-4 rounded-xl text-sm hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg">
              Get the Free Newsletter →
            </Link>
          </div>
        </section>

        <div className="py-8 px-6 bg-[#FFFBF7] border-t border-gray-100 text-center space-x-6">
          <Link href={`/tampa/${hood.slug}/${cat.slug}`} className="text-gray-400 hover:text-gray-700 text-sm transition-colors">
            ← {cat.name} in {hood.name}
          </Link>
          <Link href={`/tampa/${hood.slug}`} className="text-gray-400 hover:text-gray-700 text-sm transition-colors">
            All of {hood.name}
          </Link>
        </div>
      </div>
    </>
  );
}
