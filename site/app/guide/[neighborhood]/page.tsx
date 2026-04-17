import { Metadata } from 'next'
import Link from 'next/link'

const NEIGHBORHOODS = [
  'ybor-city','hyde-park','channelside','seminole-heights','south-tampa',
  'downtown-tampa','westshore','carrollwood','brandon','st-pete',
  'clearwater','temple-terrace','new-tampa','riverview','wesley-chapel',
  'lutz','land-o-lakes','odessa','palm-harbor','dunedin',
  'safety-harbor','largo','pinellas-park','tarpon-springs','holiday'
]

function toTitle(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateStaticParams() {
  return NEIGHBORHOODS.map(n => ({ neighborhood: n }))
}

export async function generateMetadata({ params }: { params: Promise<{ neighborhood: string }> }): Promise<Metadata> {
  const { neighborhood } = await params
  const name = toTitle(neighborhood)
  return {
    title: `${name} Neighborhood Guide — Tampa Bay Local`,
    description: `Complete neighborhood guide to ${name} in Tampa Bay. Where to eat, drink, explore, and live.`,
  }
}

export default async function NeighborhoodGuidePage({ params }: { params: Promise<{ neighborhood: string }> }) {
  const { neighborhood } = await params
  const name = toTitle(neighborhood)

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-3">{name} Neighborhood Guide</h1>
      <p className="text-xl text-gray-600 mb-10">Everything you need to know about {name} in Tampa Bay.</p>

      <section className="prose max-w-none mb-12">
        <h2>Overview</h2>
        <p>{name} is one of Tampa Bay&apos;s distinctive neighborhoods, offering a mix of local character, dining, entertainment, and community life that makes it a favorite among residents and visitors alike.</p>

        <h2>Where to Eat</h2>
        <p>The dining scene in {name} reflects the neighborhood&apos;s character — from casual neighborhood spots to destination restaurants drawing visitors from across Tampa Bay.</p>

        <h2>Things to Do</h2>
        <p>From local events to outdoor spaces, {name} offers year-round activities for residents and visitors. The neighborhood hosts regular community events and has easy access to Tampa Bay&apos;s broader attractions.</p>

        <h2>Getting Around</h2>
        <p>{name} is well-connected within the Tampa Bay area, with access to major roads and some public transit options.</p>
      </section>

      <div className="flex gap-4">
        <Link href={`/tampa/${neighborhood}`} className="text-blue-600 hover:underline">
          Browse {name} listings →
        </Link>
        <Link href={`/tampa/${neighborhood}/faq`} className="text-blue-600 hover:underline">
          {name} FAQ →
        </Link>
      </div>
    </main>
  )
}
