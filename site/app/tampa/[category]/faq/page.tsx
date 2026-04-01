import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NEIGHBORHOODS, CATEGORIES, getNeighborhood, getCategory, isNeighborhood } from "@/lib/seo-data";

// Skip events and food — those have dedicated static FAQ pages
const STATIC_FAQ_CATEGORIES = ["events", "food"];

export function generateStaticParams() {
  return [
    // All neighborhoods get FAQ pages
    ...NEIGHBORHOODS.map((n) => ({ category: n.slug })),
    // Categories except those with static FAQ pages
    ...CATEGORIES.filter((c) => !STATIC_FAQ_CATEGORIES.includes(c.slug)).map((c) => ({ category: c.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const hood = getNeighborhood(category);
  const cat = getCategory(category);

  if (hood) {
    const title = `${hood.name} Tampa FAQ — Everything You Need to Know | Tampa Pulse`;
    const description = `Answers to the most common questions about ${hood.name} Tampa. Restaurants, parking, safety, walkability, bars, and things to do.`;
    return {
      title,
      description,
      keywords: [`${hood.name} Tampa FAQ`, `${hood.name} restaurants`, `things to do ${hood.name}`, "Tampa Pulse"],
      openGraph: { title, description, type: "website", siteName: "Tampa Pulse" },
    };
  }

  if (cat) {
    const title = `Tampa ${cat.name} FAQ — Questions Answered | Tampa Pulse`;
    const description = `Answers to the most common questions about ${cat.name.toLowerCase()} in Tampa Bay. Updated weekly by locals at Tampa Pulse.`;
    return {
      title,
      description,
      keywords: [`Tampa ${cat.name.toLowerCase()} FAQ`, `${cat.name} Tampa`, "Tampa Pulse"],
      openGraph: { title, description, type: "website", siteName: "Tampa Pulse" },
    };
  }

  return { title: "Tampa FAQ | Tampa Pulse" };
}

function getNeighborhoodFAQs(hoodName: string, hoodSlug: string) {
  return [
    {
      question: `What is ${hoodName} known for?`,
      answer: `${hoodName} is one of Tampa's most distinctive neighborhoods. It has a strong local identity built over decades — a mix of dining, community character, and the kind of spots that don't show up on the tourist maps. Tampa Pulse covers ${hoodName} regularly in the weekly newsletter.`,
    },
    {
      question: `What are the best restaurants in ${hoodName}?`,
      answer: `${hoodName} has a solid restaurant scene ranging from local institutions to newer spots that have earned their following. The best way to stay up on new openings and local favorites is to subscribe to Tampa Pulse — we cover ${hoodName} food regularly and don't just repeat the same Yelp top-10 list everyone else publishes.`,
    },
    {
      question: `Is ${hoodName} safe?`,
      answer: `${hoodName} is an established Tampa neighborhood that locals live in, dine in, and visit regularly. Like any urban area, it has blocks that are more or less residential. If you're heading out at night, the well-lit main commercial corridors are where activity is concentrated. Use your normal city awareness and you'll be fine.`,
    },
    {
      question: `What are things to do in ${hoodName} this weekend?`,
      answer: `Things to do in ${hoodName} this weekend depend on the season and what's on the local calendar. The Tampa Pulse newsletter drops every Thursday with the best weekend picks across all Tampa neighborhoods including ${hoodName}. Subscribe free to never miss what's happening.`,
    },
    {
      question: `Where should I park in ${hoodName}?`,
      answer: `Parking in ${hoodName} is generally manageable compared to more congested areas of Tampa. Most neighborhood restaurants and bars have adjacent lots or street parking nearby. For bigger events or weekend evenings, arriving a few minutes early gives you the best shot at the closest spots. Street parking rules vary by block, so check signs.`,
    },
    {
      question: `What are the best bars in ${hoodName}?`,
      answer: `${hoodName} has a mix of neighborhood bars, craft cocktail spots, and live music venues depending on where you are in the neighborhood. For the current best-of list in ${hoodName}, the Tampa Pulse nightlife section is updated weekly with what's worth your time and what's new.`,
    },
    {
      question: `What events are happening in ${hoodName}?`,
      answer: `Events in ${hoodName} include neighborhood festivals, pop-ups, markets, and venue-specific programming throughout the year. The best way to know what's happening specifically in ${hoodName} this week is to subscribe to Tampa Pulse — we flag neighborhood-specific events in every Thursday issue.`,
    },
    {
      question: `Is ${hoodName} walkable?`,
      answer: `${hoodName}'s walkability depends on which part you're in. The commercial corridors and main streets are the most pedestrian-friendly, with restaurants, shops, and cafes within walking distance of each other. Residential side streets are quieter. Tampa overall is more car-dependent than dense coastal cities, but ${hoodName} is one of the more walkable pockets in the metro.`,
    },
    {
      question: `How do I get to ${hoodName} from downtown Tampa?`,
      answer: `${hoodName} is accessible from downtown Tampa by car in a short drive depending on traffic. The HART bus system connects many Tampa neighborhoods. For the most convenient experience without worrying about parking, rideshare is reliable throughout Tampa Bay.`,
    },
    {
      question: `What's new in ${hoodName}?`,
      answer: `${hoodName} is constantly evolving — new restaurant openings, venue changes, and neighborhood development happen year-round. Tampa Pulse tracks new openings and changes across all Tampa neighborhoods. Subscribe to the free weekly newsletter to stay on top of what's new in ${hoodName} and the rest of Tampa Bay.`,
    },
  ];
}

function getCategoryFAQs(catName: string, catSlug: string) {
  const catLower = catName.toLowerCase();
  return [
    {
      question: `What's the best ${catLower} in Tampa right now?`,
      answer: `Tampa Bay's ${catLower} scene is always moving. The best source for what's actually worth your time right now — not recycled lists — is the Tampa Pulse newsletter, which drops every Thursday with fresh local picks. We cover ${catLower} from a local perspective, not a tourist one.`,
    },
    {
      question: `Where do locals go for ${catLower} in Tampa?`,
      answer: `Locals in Tampa know which spots are worth it and which ones are just good at Instagram. For ${catLower}, the real picks tend to be outside the obvious tourist zones — in Seminole Heights, Ybor City, South Tampa, and pockets of the city that don't get covered in travel guides. Tampa Pulse is the newsletter for exactly this.`,
    },
    {
      question: `Is Tampa's ${catLower} scene worth it?`,
      answer: `Tampa's ${catLower} scene has grown significantly over the last decade. It's not NYC or Chicago, but it punches above its weight for a city its size. There are genuine gems here — you just have to know where to look. That's what Tampa Pulse is for.`,
    },
    {
      question: `What are the hidden gems for ${catLower} in Tampa?`,
      answer: `The best hidden gems for ${catLower} in Tampa are the ones that haven't been Instagrammed into mainstream awareness yet. Tampa Pulse specifically hunts for these — new spots, under-the-radar finds, and places that locals love but haven't been covered to death by the big food and lifestyle sites.`,
    },
    {
      question: `What neighborhoods in Tampa have the best ${catLower}?`,
      answer: `For ${catLower}, different Tampa neighborhoods offer different vibes. Ybor City and downtown have concentrated activity. Seminole Heights has the indie/local feel. South Tampa and Hyde Park offer the upscale version. Wesley Chapel and Brandon for suburban options. Each has its own character — explore the neighborhood pages on Tampa Pulse for local breakdowns.`,
    },
    {
      question: `How does Tampa's ${catLower} scene compare to other Florida cities?`,
      answer: `Tampa holds up well against Miami, Orlando, and Jacksonville for ${catLower}. It has a smaller, more local feel than Miami but a lot more personality than some other Florida metros. The food scene especially has exploded over the last few years. For ongoing coverage, Tampa Pulse is the best local source.`,
    },
    {
      question: `What's coming up for ${catLower} in Tampa this month?`,
      answer: `The best way to know what's coming up for ${catLower} in Tampa is the Thursday Tampa Pulse newsletter — we compile the best upcoming ${catLower} picks each week. Subscribe free and you'll never wonder what's happening this weekend again.`,
    },
    {
      question: `Are there free ${catLower} options in Tampa?`,
      answer: `Yes — Tampa has plenty of free ${catLower} options, from free outdoor events at Curtis Hixon Park to free museum days, free concerts, and community gatherings. Tampa Pulse always flags free options explicitly in the weekly newsletter because getting out shouldn't always cost money.`,
    },
  ];
}

export default async function DynamicFaqPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const hood = getNeighborhood(category);
  const cat = getCategory(category);

  if (!hood && !cat) notFound();
  if (STATIC_FAQ_CATEGORIES.includes(category)) notFound(); // defer to static pages

  const isHood = !!hood;
  const displayName = hood?.name ?? cat?.name ?? "";
  const emoji = cat?.emoji ?? "📍";
  const faqs = isHood
    ? getNeighborhoodFAQs(hood!.name, hood!.slug)
    : getCategoryFAQs(cat!.name, cat!.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const backHref = isHood ? `/tampa/${hood!.slug}` : `/tampa/${cat!.slug}`;
  const backLabel = isHood ? `← ${hood!.name}` : `← ${cat!.name}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-[#FFFBF7]">
        <section className="pt-32 pb-16 px-6" style={{ background: "linear-gradient(170deg, #FFF0E8 0%, #FFFBF7 60%)" }}>
          <div className="max-w-3xl mx-auto">
            <Link href={backHref} className="text-pulse-orange text-xs font-bold tracking-wider uppercase hover:opacity-70 transition-opacity mb-6 inline-block">
              {backLabel}
            </Link>
            <div className="text-4xl mb-4">{emoji}</div>
            <h1 className="font-heading text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-5">
              {isHood ? `${displayName} FAQ` : `Tampa ${displayName} FAQ`}
            </h1>
            <p className="text-gray-600 text-lg max-w-xl leading-relaxed">
              {isHood
                ? `Everything you need to know about ${displayName} in Tampa Bay — answered by locals.`
                : `The most common questions about ${displayName.toLowerCase()} in Tampa Bay — answered.`}
            </p>
            <p className="text-gray-400 text-sm mt-3">
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-7 hover:border-orange-200 hover:shadow-sm transition-all">
                  <h2 className="font-heading font-black text-gray-900 text-lg mb-3 leading-tight">{faq.question}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-pulse-orange">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white mb-4">
              {isHood ? `Never Miss ${displayName} Picks` : `Never Miss Tampa ${displayName}`}
            </h2>
            <p className="text-white/80 text-base mb-8">
              {isHood
                ? `Get the best events, food, and nightlife in ${displayName} and all of Tampa Bay every Thursday.`
                : `Get the best ${displayName.toLowerCase()} picks in Tampa Bay every Thursday morning. Free newsletter from local people.`}
            </p>
            <Link href="/#subscribe" className="inline-block bg-white text-pulse-orange font-black px-8 py-4 rounded-xl text-sm hover:bg-gray-50 transition-all hover:scale-[1.02] shadow-lg">
              Subscribe Free →
            </Link>
          </div>
        </section>

        <div className="py-8 px-6 bg-[#FFFBF7] border-t border-gray-100 text-center space-x-6">
          <Link href={backHref} className="text-gray-400 hover:text-gray-700 text-sm transition-colors">{backLabel}</Link>
          <Link href="/faq" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">All FAQs</Link>
          <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">Home</Link>
        </div>
      </div>
    </>
  );
}
