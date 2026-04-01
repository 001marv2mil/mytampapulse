import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tampa Restaurants & Food FAQ — Best Spots in Tampa Bay | Tampa Pulse",
  description:
    "Answers to the most common questions about Tampa Bay food — best restaurants, hidden gems, neighborhoods for dining, food trucks, new openings, and local favorites.",
  keywords: [
    "Tampa restaurants FAQ",
    "best restaurants Tampa",
    "Tampa food guide",
    "where to eat Tampa",
    "Tampa hidden gems food",
    "Tampa food trucks",
    "Tampa Bay dining",
    "Tampa Pulse",
  ],
  openGraph: {
    title: "Tampa Restaurants & Food FAQ | Tampa Pulse",
    description:
      "Where to eat in Tampa Bay — best restaurants, hidden gems, food trucks, and neighborhood dining guides.",
    type: "website",
    siteName: "Tampa Pulse",
  },
};

const faqs = [
  {
    question: "What are the best restaurants in Tampa?",
    answer:
      "Tampa has genuinely excellent dining. For upscale, Bern's Steak House is a Tampa institution that's been operating since 1956. The Landon in SoHo is a newer fine dining standout from a Hell's Kitchen chef. For casual, Taco Bus is a Tampa original. La Segunda is the legendary Cuban bakery. Willa's in West Tampa is pushing the food scene forward. Armature Works on the Riverwalk has over a dozen vendors in a beautiful building. Tampa Pulse highlights new and underrated spots in every weekly newsletter — the ones that don't have PR teams yet.",
  },
  {
    question: "What neighborhood has the best food in Tampa?",
    answer:
      "SoHo (South Howard Avenue) has the densest concentration of good restaurants — from upscale date-night spots to casual bars with great food. Ybor City is your spot for Cuban food and Latin flavors — La Segunda, The Columbia, Bodega. Seminole Heights on Florida Ave has a walkable, hip dining corridor with local spots. Armature Works and the Channelside area are great for waterfront dining. West Tampa is the underrated one — Willa's put it on the map and there's more coming. For variety, Armature Works lets you try multiple concepts in one visit.",
  },
  {
    question: "Where are the best hidden gem restaurants in Tampa?",
    answer:
      "Tampa Pulse specializes in these. Some current favorites: Kunafa King in Temple Terrace for Middle Eastern desserts. Deviant Libation in Ybor for $5 Sunday shows and cocktails. Madame Fortune in Ybor for a moody date night nobody knows about. Smith's Provisions at Sparkman Wharf for a roadside burger by the water. Tampa Food Truck Central on E. Broadway — five vendors including Colombian-Venezuelan fusion from Sancocho y Lena. Subscribe to the newsletter and we'll send you a new hidden gem every single week.",
  },
  {
    question: "What's the best Cuban food in Tampa?",
    answer:
      "Tampa has a deep Cuban food heritage and takes it seriously. La Segunda Central Bakery in West Tampa is a Tampa institution — their Cuban bread is shipped nationwide. The Columbia Restaurant in Ybor City has been open since 1905 and is the oldest continuously operating restaurant in Florida. For a quick Cuban sandwich, Bodega on S. Howard is excellent. The Cuban Sandwich Festival in Ybor City (annual, usually spring) is worth going to for the sheer spectacle of it. Tampa arguably does the Cuban sandwich better than anywhere in the world.",
  },
  {
    question: "Are there good food trucks in Tampa?",
    answer:
      "Yes. Tampa has an active food truck scene. Tampa Food Truck Central on E. Broadway is a permanent park with multiple vendors. Sparkman Wharf rotates food trucks along the waterfront. The Saturday Morning Market in St. Pete regularly features food trucks. Various events around Tampa bring in food trucks — Curtis Hixon events, festivals, and the Riverwalk. Tampa Pulse calls out notable food truck openings and events in the weekly newsletter.",
  },
  {
    question: "What new restaurants have opened in Tampa recently?",
    answer:
      "Tampa's restaurant scene moves fast. Some notable recent openings: The Landon at 717 S Howard from Hell's Kitchen chef Robert Hesse. Oro at Rome Collective doing Spanish wood-fired paella and tapas. SoDough Square in St. Pete for Detroit-style pizza. Central Park St. Pete is an upcoming five-story food hall with nine dining concepts and four bars. Tampa Pulse tracks new openings every week — if something opens that's worth going to, we'll tell you about it Thursday before anyone else does.",
  },
  {
    question: "Where should I eat in Tampa if I'm a first-time visitor?",
    answer:
      "Three essentials for a first-timer: 1) A Cuban sandwich — La Segunda Bakery or Bodega on S. Howard. 2) Armature Works on the Riverwalk — eat, drink, walk the waterfront. 3) One Ybor City night — the Columbia Restaurant for dinner if you want the full Tampa history, or wander 7th Ave for the vibe. If you want to go beyond the tourist trail, subscribe to Tampa Pulse before your trip — we'll tell you where locals actually eat.",
  },
  {
    question: "What are the best brunch spots in Tampa?",
    answer:
      "Brunch is serious business in Tampa. The Hall on Franklin downtown has a great brunch scene. Goody Goody in Hyde Park is Tampa's classic diner for weekend breakfast. Oxford Exchange does a proper elevated brunch in a beautiful building. On the more casual side, there are several spots in Seminole Heights and SoHo doing solid weekend brunch service. The Saturday Morning Market in downtown St. Pete (free to enter) isn't exactly brunch but serves that same lazy Saturday morning energy with food, coffee, and local vendors.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FoodFaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#FFFBF7]">
        {/* Hero */}
        <section
          className="pt-32 pb-16 px-6"
          style={{ background: "linear-gradient(170deg, #FFF0E8 0%, #FFFBF7 60%)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/tampa/food"
                className="text-pulse-orange text-xs font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
              >
                ← Tampa Food
              </Link>
            </div>
            <div className="text-4xl mb-4">🍽️</div>
            <h1 className="font-heading text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-5">
              Tampa Food FAQ
            </h1>
            <p className="text-gray-600 text-lg max-w-xl leading-relaxed">
              Where to eat in Tampa Bay — the best restaurants, hidden gems, and local
              favorites answered honestly.
            </p>
          </div>
        </section>

        {/* FAQ list */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-7 hover:border-orange-200 hover:shadow-sm transition-all"
                >
                  <h2 className="font-heading font-black text-gray-900 text-lg mb-3 leading-tight">
                    {faq.question}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 bg-pulse-orange">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white mb-4">
              Find Hidden Gems Every Week
            </h2>
            <p className="text-white/80 text-base mb-8">
              Tampa Pulse covers new restaurant openings and under-the-radar food spots
              every Thursday. Free newsletter from people who actually eat here.
            </p>
            <Link
              href="/"
              className="inline-block bg-white text-pulse-orange font-black px-8 py-4 rounded-xl text-sm hover:bg-gray-50 transition-all hover:scale-[1.02] shadow-lg"
            >
              Subscribe Free →
            </Link>
          </div>
        </section>

        <div className="py-8 px-6 bg-[#FFFBF7] border-t border-gray-100 text-center space-x-6">
          <Link
            href="/tampa/food"
            className="text-gray-400 hover:text-gray-700 text-sm transition-colors"
          >
            ← Tampa Food
          </Link>
          <Link href="/faq" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">
            All FAQs
          </Link>
          <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">
            Home
          </Link>
        </div>
      </div>
    </>
  );
}
