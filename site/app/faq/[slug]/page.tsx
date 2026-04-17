import { Metadata } from 'next'
import Link from 'next/link'

const FAQ_TOPICS = [
  { slug: 'things-to-do-in-tampa-this-weekend', title: 'Things To Do in Tampa This Weekend', neighborhood: null },
  { slug: 'free-things-to-do-in-tampa', title: 'Free Things To Do in Tampa', neighborhood: null },
  { slug: 'best-restaurants-in-tampa', title: 'Best Restaurants in Tampa', neighborhood: null },
  { slug: 'best-bars-in-tampa', title: 'Best Bars in Tampa', neighborhood: null },
  { slug: 'things-to-do-in-ybor-city', title: 'Things To Do in Ybor City', neighborhood: 'ybor-city' },
  { slug: 'best-coffee-shops-in-tampa', title: 'Best Coffee Shops in Tampa', neighborhood: null },
  { slug: 'outdoor-activities-tampa', title: 'Outdoor Activities in Tampa Bay', neighborhood: null },
  { slug: 'tampa-nightlife-guide', title: 'Tampa Nightlife Guide', neighborhood: null },
  { slug: 'things-to-do-in-hyde-park-tampa', title: 'Things To Do in Hyde Park Tampa', neighborhood: 'hyde-park' },
  { slug: 'best-brunch-tampa', title: 'Best Brunch in Tampa', neighborhood: null },
  { slug: 'tampa-arts-culture', title: 'Arts & Culture in Tampa Bay', neighborhood: null },
  { slug: 'family-activities-tampa', title: 'Family Activities in Tampa', neighborhood: null },
  { slug: 'channelside-tampa-guide', title: 'Channelside Tampa Guide', neighborhood: 'channelside' },
  { slug: 'seminole-heights-guide', title: 'Seminole Heights Tampa Guide', neighborhood: 'seminole-heights' },
  { slug: 'st-pete-things-to-do', title: 'Things To Do in St. Pete', neighborhood: 'st-pete' },
]

function getGenericFAQs(title: string) {
  return [
    { q: `What are the best ${title.toLowerCase()} options?`, a: `Tampa Bay has a wide range of options. Our local guide is updated regularly with the best picks recommended by residents.` },
    { q: `Are there free options for ${title.toLowerCase()}?`, a: `Yes — Tampa Bay regularly offers free and low-cost options. Check our events calendar for current free activities.` },
    { q: `What time of year is best for ${title.toLowerCase()}?`, a: `Tampa Bay's mild winter (October–April) is peak season. Summer brings heat and afternoon storms but also great indoor options and deals.` },
    { q: `How do I find the latest information about ${title.toLowerCase()}?`, a: `Tampa Pulse is updated weekly with fresh local content. Bookmark this page and check back regularly.` },
  ]
}

export async function generateStaticParams() {
  return FAQ_TOPICS.map(t => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const topic = FAQ_TOPICS.find(t => t.slug === slug)
  const title = topic?.title ?? 'Tampa Bay FAQ'
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return {
    title: `${title} — FAQ & Local Guide`,
    description: `Answers to common questions about ${title.toLowerCase()} in Tampa Bay. Updated ${updated}.`,
  }
}

export default async function FAQSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = FAQ_TOPICS.find(t => t.slug === slug)
  const title = topic?.title ?? 'Tampa Bay FAQ'
  const faqs = getGenericFAQs(title)
  const updated = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-sm text-gray-400 mb-10">Updated {updated}</p>

      <div className="space-y-8">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-gray-100 pb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{faq.q}</h2>
            <p className="text-gray-700 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link href="/" className="text-blue-600 hover:underline">← Tampa Pulse Home</Link>
      </div>
    </main>
  )
}
