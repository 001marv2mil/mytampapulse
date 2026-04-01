import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tampa Bay FAQ — Events, Food & Things To Do | Tampa Pulse",
  description:
    "Answers to the most common questions about Tampa Bay — best events, restaurants, nightlife, and things to do this weekend. Updated weekly by Tampa locals.",
  keywords: [
    "Tampa Bay FAQ",
    "things to do in Tampa",
    "Tampa events this weekend",
    "best restaurants Tampa",
    "Tampa nightlife",
    "Tampa Bay guide",
    "Tampa Pulse",
  ],
  openGraph: {
    title: "Tampa Bay FAQ — Events, Food & Things To Do | Tampa Pulse",
    description:
      "Answers to the most common questions about Tampa Bay — events, restaurants, nightlife, hidden gems.",
    type: "website",
    siteName: "Tampa Pulse",
  },
};

const faqs = [
  {
    question: "What's happening in Tampa this weekend?",
    answer:
      "Tampa Bay has something going on every single weekend. From outdoor festivals at Curtis Hixon Park to live music in Ybor City, rooftop bar nights in SoHo, and art markets in St. Pete, there's always a reason to get out. Tampa Pulse curates the best picks every Thursday — subscribe free to get them straight to your inbox. You can also browse our Tampa Events page for what's happening right now.",
  },
  {
    question: "Where are the best restaurants in Tampa?",
    answer:
      "Tampa's food scene has exploded in the last few years. SoHo (South Howard Avenue) is packed with date-night spots. Ybor City has everything from Cuban sandwiches at La Segunda to late-night bites after a show. Armature Works has over a dozen food vendors under one roof on the Riverwalk. For hidden gems — the spots locals actually go to — Tampa Pulse covers new openings and under-the-radar kitchens in every weekly issue.",
  },
  {
    question: "What are the best things to do in Tampa Bay?",
    answer:
      "Tampa Bay has serious range. Clearwater Beach is one of the top-rated beaches in the US. Ybor City is the historic nightlife hub with cigar bars and Latin culture. The Riverwalk connects downtown to Armature Works with parks, restaurants, and waterfront views. Busch Gardens for thrill seekers. The Florida Aquarium, MOSI, and the Straz Center for arts and culture. And every neighborhood has its own personality — Seminole Heights, Hyde Park, and Dunedin are all worth exploring.",
  },
  {
    question: "How do I find Tampa events this week?",
    answer:
      "The easiest way is to subscribe to Tampa Pulse — free newsletter every Thursday with the best events of the week, curated by locals. We also have a Tampa Events page updated weekly. For specific venues, Armature Works, Gasparilla Music Fest, and the Straz Center have their own event calendars. Creative Loafing Tampa also tracks local happenings.",
  },
  {
    question: "What is Tampa Pulse?",
    answer:
      "Tampa Pulse is a free weekly newsletter for Tampa Bay locals. Every Thursday, we send out the best events, hidden gem restaurants, live music picks, and things to do that week — no fluff, no sponsored lists, just real curated picks from people who actually live here. We cover events, food, nightlife, arts, and the lowkey spots most people haven't found yet.",
  },
  {
    question: "What's the best neighborhood to go out in Tampa?",
    answer:
      "Depends on what you're after. SoHo (South Howard) is Tampa's main bar and restaurant strip — great for casual drinks, date nights, and upscale dining. Ybor City is the wild card — historic, gritty, and fun, especially on weekends with the clubs on 7th Ave. Armature Works and the Riverwalk area is great for a chill evening. Seminole Heights is where you go if you want hip, local, and not touristy. St. Pete is technically its own city but a 20-minute drive and has one of the best bar scenes in the region.",
  },
  {
    question: "Are there free things to do in Tampa?",
    answer:
      "Yes, Tampa has plenty of free options. Curtis Hixon Waterfront Park hosts free events and festivals year-round. The Tampa Riverwalk is free to walk and has free public art. The Saturday Morning Market in downtown St. Pete is free to browse. Many museums offer free days. Clearwater Beach is free to access. Tampa Pulse calls out free events every week in the newsletter — we flag them specifically because we know not everything needs to cost money.",
  },
  {
    question: "What's the best area to stay in Tampa for tourists?",
    answer:
      "For first-time visitors, downtown Tampa or Channelside puts you close to the waterfront, the Aquarium, Amalie Arena, and easy walkability. Hyde Park/SoHo is great if you want to be near good restaurants and a walkable neighborhood feel. Ybor City is fun if you're there to party. If beaches are the goal, Clearwater Beach or St. Pete Beach are about 45 minutes away — or you can stay in Clearwater proper and do a day trip into Tampa.",
  },
  {
    question: "What are the major annual events in Tampa Bay?",
    answer:
      "Gasparilla Pirate Festival (January/February) is Tampa's biggest event — a pirate-themed parade and street party on Bayshore Boulevard. The Florida State Fair runs in February. Gasparilla Music Festival brings indie and folk acts to the waterfront in April. The Rays home opener signals spring. Cuban Sandwich Festival in Ybor. ZooBrews at Lowry Park. The Straz Center hosts Broadway touring shows year-round. Tampa Pride, the Greek Festival, and dozens of neighborhood events round out the calendar.",
  },
  {
    question: "How do I subscribe to Tampa Pulse?",
    answer:
      "Tampa Pulse is completely free. Just enter your email on the homepage at mytampapulse.com and you'll get the next issue straight to your inbox on Thursday morning. No spam, no reselling your data — just Tampa's best weekly picks. Thousands of locals already get it every week.",
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

export default function FaqPage() {
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
            <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-6 shadow-sm">
              <span className="text-pulse-orange text-xs font-bold tracking-wider uppercase">
                Tampa Bay Guide
              </span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-5">
              Tampa Bay FAQ
            </h1>
            <p className="text-gray-600 text-lg max-w-xl leading-relaxed">
              Real answers to the most common questions about Tampa Bay — events, food,
              nightlife, and things to do. Updated by locals.
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

        {/* Category FAQ links */}
        <section className="py-10 px-6 bg-white border-t border-b border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading font-black text-gray-900 text-xl mb-6">
              More Tampa Bay Answers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/tampa/events/faq"
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-orange-50 hover:border-pulse-orange border border-transparent transition-all"
              >
                <span className="text-2xl">🎉</span>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Tampa Events FAQ</div>
                  <div className="text-gray-500 text-xs">8 questions about Tampa events</div>
                </div>
              </Link>
              <Link
                href="/tampa/food/faq"
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 hover:bg-orange-50 hover:border-pulse-orange border border-transparent transition-all"
              >
                <span className="text-2xl">🍽️</span>
                <div>
                  <div className="font-bold text-gray-900 text-sm">Tampa Food FAQ</div>
                  <div className="text-xs text-gray-500">8 questions about Tampa restaurants</div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 bg-pulse-orange">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-white mb-4">
              Get Tampa Delivered Weekly
            </h2>
            <p className="text-white/80 text-base mb-8 max-w-md mx-auto">
              Stop Googling. Subscribe to Tampa Pulse and get the best events, food, and
              things to do every Thursday. Free.
            </p>
            <Link
              href="/"
              className="inline-block bg-white text-pulse-orange font-black px-8 py-4 rounded-xl text-sm hover:bg-gray-50 transition-all hover:scale-[1.02] shadow-lg"
            >
              Subscribe Free at mytampapulse.com →
            </Link>
          </div>
        </section>

        <div className="py-8 px-6 bg-[#FFFBF7] border-t border-gray-100 text-center space-x-6">
          <Link href="/tampa" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">
            Tampa Guide
          </Link>
          <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm transition-colors">
            Home
          </Link>
        </div>
      </div>
    </>
  );
}
