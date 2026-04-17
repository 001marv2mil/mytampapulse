import { MetadataRoute } from 'next'

const BASE_URL = 'https://mytampapulse.com'

const NEIGHBORHOODS = [
  'ybor-city','hyde-park','channelside','seminole-heights','south-tampa',
  'downtown-tampa','westshore','carrollwood','brandon','st-pete',
  'clearwater','temple-terrace','new-tampa','riverview','wesley-chapel',
  'lutz','land-o-lakes','odessa','palm-harbor','dunedin',
  'safety-harbor','largo','pinellas-park','tarpon-springs','holiday'
]

const CATEGORIES = [
  'restaurants','bars-nightlife','coffee-shops','events','arts-culture',
  'outdoor-activities','sports','shopping','services','nightlife'
]

const FAQ_SLUGS = [
  'things-to-do-in-tampa-this-weekend','free-things-to-do-in-tampa',
  'best-restaurants-in-tampa','best-bars-in-tampa','things-to-do-in-ybor-city',
  'best-coffee-shops-in-tampa','outdoor-activities-tampa','tampa-nightlife-guide',
  'things-to-do-in-hyde-park-tampa','best-brunch-tampa','tampa-arts-culture',
  'family-activities-tampa','channelside-tampa-guide','seminole-heights-guide',
  'st-pete-things-to-do'
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/tampa`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const neighborhoodPages: MetadataRoute.Sitemap = NEIGHBORHOODS.map(n => ({
    url: `${BASE_URL}/tampa/${n}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8
  }))

  const neighborhoodCategoryPages: MetadataRoute.Sitemap = NEIGHBORHOODS.flatMap(n =>
    CATEGORIES.map(c => ({
      url: `${BASE_URL}/tampa/${n}/${c}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7
    }))
  )

  const neighborhoodFAQPages: MetadataRoute.Sitemap = NEIGHBORHOODS.map(n => ({
    url: `${BASE_URL}/tampa/${n}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6
  }))

  const guidePages: MetadataRoute.Sitemap = NEIGHBORHOODS.map(n => ({
    url: `${BASE_URL}/guide/${n}`, lastModified: now, changeFrequency: 'monthly', priority: 0.6
  }))

  const faqPages: MetadataRoute.Sitemap = FAQ_SLUGS.map(slug => ({
    url: `${BASE_URL}/faq/${slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.7
  }))

  return [...staticPages, ...neighborhoodPages, ...neighborhoodCategoryPages, ...neighborhoodFAQPages, ...guidePages, ...faqPages]
}
