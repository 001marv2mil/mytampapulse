import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tampa Events FAQ — What's Happening This Weekend | Tampa Pulse",
  description:
    "Answers to the most common questions about Tampa events — what's happening this weekend, where to find events, free festivals, concerts, and more.",
  keywords: [
    "Tampa events FAQ",
    "Tampa events this weekend",
    "things to do Tampa",
    "Tampa festivals",
    "Tampa concerts",
    "free events Tampa",
    "Tampa Pulse",
  ],
  openGraph: {
    title: "Tampa Events FAQ | Tampa Pulse",
    description: "What's happening in Tampa this weekend? We answer the most common questions about Tampa Bay events.",
    type: "website",
    siteName: "Tampa Pulse",
  },
};

const faqs = [
  {
    question: "What events are happening in Tampa this weekend?",
    answer:
      "Tampa Bay has events every single weekend — festivals, markets, concerts, sports, outdoor movies, and more. The best way to know what's happening this specific weekend is to subscribe to Tampa Pulse, a free newsletter that drops every Thursday with the week's top picks. You can also browse the Tampa Events page on this site for current highlights.",
  },
  {
    question: "What are the biggest annual events in Tampa Bay?",
    answer:
      "Gasparilla Pirate Fest (January/February) is the big one — a massive pirate parade on Bayshore Boulevard with over 300,000 attendees. Gasparilla Music Festival in April brings live music to the waterfront. The Florida State Fair runs in February at the Fairgrounds. The Cuban Sandwich Festival in Ybor is free and beloved. ZooBrews at Lowry Park is adults-only fun. The Mainsail Art Festival at Vinoy Park in St. Pete. And the Sugar Sand Festival in Clearwater for something truly unique.",
  },
  {
    question: "Are there free events in Tampa?",
    answer:
      "Yes, plenty. Curtis Hixon Waterfront Park hosts free events and movie nights regularly. The Tampa Riverwalk is always open and free. The Saturday Morning Market in downtown St. Pete is free. Many festivals like the Cuban Sandwich Festival and Mainsail Art Festival are free admission. Tampa Pulse always flags free events in the weekly newsletter — we mark them explicitly because getting out shouldn't always cost money.",
  },
  {
    question: "Where do I find family-friendly events in Tampa?",
    answer:
      "Tampa is great for families. Busch Gardens, Zoo Tampa at Lowry Park, the Florida Aquarium, and MOSI are all solid year-round. For specific weekend events, the Saturday Morning Market in St. Pete is family-friendly with food and crafts. The Asian Pacific Islander Cultural Festival, the Mainsail Art Festival, and waterfront events at Curtis Hixon are all kid-welcoming. Tampa Pulse covers family events alongside adult events every week.",
  },
  {
    question: "What's happening in Ybor City this weekend?",
    answer:
      "Ybor City is Tampa's historic entertainment district and there's almost always something going on. Friday and Saturday nights the clubs and bars on 7th Avenue come alive. The Cuban Club hosts cultural events, drag shows, and concerts. There's live music at several bars. For specific events this weekend, check the Tampa Pulse newsletter — we cover Ybor regularly. The neighborhood has a unique energy you don't find anywhere else in Florida.",
  },
  {
    question: "Are there outdoor events and festivals in Tampa?",
    answer:
      "Tampa Bay has a festival calendar that runs year-round, leaning heavily into the spring and fall when the weather is perfect. The Mainsail Art Festival at Vinoy Park, Gasparilla Music Fest, the Sugar Sand Festival in Clearwater, Tampa Bay Food & Wine Festival, and dozens of neighborhood events fill out the calendar. Curtis Hixon Park and Armature Works both host outdoor events regularly. The Riverwalk is a great backdrop for outdoor concerts and markets.",
  },
  {
    question: "What are the best music venues in Tampa for live events?",
    answer:
      "Tampa has a solid live music scene. The Straz Center for the Performing Arts books Broadway shows, classical, and major acts. Amalie Arena is for stadium shows. Hard Rock Live Tampa handles mid-size national acts. The Orpheum in Ybor is a beloved small venue. Crowbar in Ybor is the indie/alternative staple. Skipper's Smokehouse is iconic for roots music and outdoor shows. And the Gasparilla Music Festival turns the Riverwalk into a music destination every spring.",
  },
  {
    question: "How far in advance should I plan for Tampa events?",
    answer:
      "For major festivals like Gasparilla or the Gasparilla Music Fest, tickets sell fast — sometimes weeks in advance. For restaurant reservations at busy spots during events, book a few days ahead. For casual things like street festivals, markets, or free events, you can usually just show up. Tampa Pulse sends picks on Thursday for the coming weekend, which gives you a few days to plan — plenty of time for most things. For headliner concerts, grab tickets the moment they go on sale.",
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

export default function EventsFaqPage() {
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
                href="/tampa/events"
                className="text-pulse-orange text-xs font-bold tracking-wider uppercase hover:opacity-70 transition-opacity"
              >
                ← Tampa Events
              </Link>
            </div>
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="font-heading text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-5">
              Tampa Events FAQ
            </h1>
            <p className="text-gray-600 text-lg max-w-xl leading-relaxed">
              Everything you need to know about finding and planning for events in Tampa Bay.
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
              Never Miss a Tampa Event
            </h2>
            <p className="text-white/80 text-base mb-8">
              Get the best Tampa Bay events every Thursday morning — curated, not scraped.
              Free newsletter from local people.
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
            href="/tampa/events"
            className="text-gray-400 hover:text-gray-700 text-sm transition-colors"
          >
            ← Tampa Events
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
