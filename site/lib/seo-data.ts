// Shared SEO data: neighborhoods, categories, modifiers
// Used across programmatic SEO pages, FAQ pages, and sitemap

export const NEIGHBORHOODS = [
  { slug: "ybor-city", name: "Ybor City", description: "Tampa's historic Latin Quarter — brick streets, Columbia Restaurant, nightlife, and Cuban culture since 1885." },
  { slug: "hyde-park", name: "Hyde Park", description: "Upscale South Tampa neighborhood with boutique shops, restaurants, and leafy streets near Bayshore Boulevard." },
  { slug: "channelside", name: "Channelside", description: "Waterfront district near downtown with the Convention Center, Amalie Arena, and harbor views." },
  { slug: "downtown-tampa", name: "Downtown Tampa", description: "Tampa's urban core — skyscrapers, Curtis Hixon Park, the Riverwalk, and the heart of city life." },
  { slug: "davis-islands", name: "Davis Islands", description: "Charming island community just off Bayshore — small-town feel, waterfront dining, and a local airport." },
  { slug: "south-tampa", name: "South Tampa", description: "Affluent peninsula neighborhood known for Bayshore Boulevard, great schools, and top restaurants." },
  { slug: "seminole-heights", name: "Seminole Heights", description: "Tampa's hipster-cool bungalow district — craft breweries, indie restaurants, and vintage everything." },
  { slug: "westshore", name: "Westshore", description: "Tampa's business and shopping hub — International Plaza, office towers, and easy airport access." },
  { slug: "carrollwood", name: "Carrollwood", description: "Suburban north Tampa community with parks, family-friendly dining, and a classic Florida neighborhood vibe." },
  { slug: "riverview", name: "Riverview", description: "Fast-growing suburb southeast of Tampa — new developments, the Alafia River, and family neighborhoods." },
  { slug: "brandon", name: "Brandon", description: "The original Tampa suburb — malls, chain restaurants, but also a tight-knit community with local flavor." },
  { slug: "wesley-chapel", name: "Wesley Chapel", description: "Booming northern suburb with The Grove shopping center, Wiregrass Mall, and new restaurants weekly." },
  { slug: "new-tampa", name: "New Tampa", description: "Planned suburban community in north Tampa — newer homes, top-rated schools, and family-oriented living." },
  { slug: "tampa-heights", name: "Tampa Heights", description: "Revitalized historic neighborhood just north of downtown — Armature Works, the Heights Market, and growth." },
  { slug: "palma-ceia", name: "Palma Ceia", description: "Quiet, affluent South Tampa neighborhood with the Palma Ceia Golf Club and charming residential streets." },
  { slug: "ballast-point", name: "Ballast Point", description: "South Tampa waterfront neighborhood known for Ballast Point Park, fishing piers, and sunsets over Tampa Bay." },
  { slug: "harbour-island", name: "Harbour Island", description: "Private island community connected to downtown — luxury condos, marinas, and walkability to the Riverwalk." },
  { slug: "port-tampa", name: "Port Tampa", description: "Historic waterfront community in southwest Tampa — fishing, old Florida character, and Gadsden Park." },
  { slug: "sulphur-springs", name: "Sulphur Springs", description: "Historic north Tampa neighborhood with the Sulphur Springs Pool, a local landmark since 1927." },
  { slug: "temple-terrace", name: "Temple Terrace", description: "Golf course community northeast of Tampa — University of South Florida is nearby, with a small-town downtown." },
  { slug: "town-n-country", name: "Town N Country", description: "West Tampa suburb with diverse dining, affordable housing, and close proximity to the airport." },
  { slug: "citrus-park", name: "Citrus Park", description: "Northwest suburb with the Citrus Park Town Center mall and family neighborhoods." },
  { slug: "westchase", name: "Westchase", description: "Planned northwest community with parks, pools, golf, and the popular Westchase Town Center." },
  { slug: "lutz", name: "Lutz", description: "Semi-rural northern suburb — lakes, land, and a quieter pace just 20 minutes from downtown." },
  { slug: "land-o-lakes", name: "Land O Lakes", description: "Northern Hillsborough County community — waterfront living, outdoor recreation, and growing suburbs." },
] as const;

export const CATEGORIES = [
  { slug: "events", name: "Events", emoji: "🎉", description: "Festivals, markets, pop-ups, community gatherings, and everything happening this weekend." },
  { slug: "food", name: "Food & Restaurants", emoji: "🍽️", description: "Hidden gems, new openings, food trucks, and the spots locals actually eat at." },
  { slug: "nightlife", name: "Nightlife", emoji: "🌙", description: "Rooftop bars, craft cocktail spots, live music venues, and late nights worth having." },
  { slug: "things-to-do", name: "Things To Do", emoji: "🗺️", description: "Activities, attractions, experiences, and everything worth doing this weekend." },
  { slug: "music", name: "Live Music", emoji: "🎵", description: "Concerts, shows, open mics, and who's playing in Tampa Bay this week." },
  { slug: "arts", name: "Arts & Culture", emoji: "🎨", description: "Gallery openings, theater, museums, cultural festivals, and the creative scene." },
  { slug: "sports", name: "Sports", emoji: "🏟️", description: "Bucs, Lightning, Rays, Rowdies, and every game worth watching or attending." },
  { slug: "outdoors", name: "Outdoors", emoji: "🌿", description: "Parks, trails, kayaking, beaches, and getting outside in Tampa Bay." },
  { slug: "family", name: "Family", emoji: "👨‍👩‍👧", description: "Kid-friendly events, attractions, and activities for the whole family." },
  { slug: "wellness", name: "Wellness", emoji: "🧘", description: "Yoga, fitness events, meditation, farmers markets, and living well in Tampa." },
] as const;

export const MODIFIERS = [
  { slug: "this-weekend", name: "This Weekend", label: "weekend picks" },
  { slug: "tonight", name: "Tonight", label: "tonight's picks" },
  { slug: "free", name: "Free", label: "free options" },
  { slug: "best", name: "Best", label: "top picks" },
  { slug: "near-me", name: "Near Me", label: "nearby" },
  { slug: "open-now", name: "Open Now", label: "open now" },
  { slug: "open-late", name: "Open Late", label: "late night" },
  { slug: "happy-hour", name: "Happy Hour", label: "happy hour deals" },
  { slug: "brunch", name: "Brunch", label: "brunch spots" },
  { slug: "romantic", name: "Romantic", label: "date night picks" },
] as const;

export const FAQ_SLUGS = [
  "things-to-do-in-tampa-this-weekend",
  "free-things-to-do-in-tampa",
  "best-restaurants-in-tampa",
  "tampa-nightlife-guide",
  "family-friendly-tampa",
  "tampa-arts-scene",
  "tampa-sports-events",
  "tampa-outdoor-activities",
  "tampa-music-venues",
  "tampa-food-scene",
  "best-brunch-tampa",
  "tampa-happy-hour",
  "tampa-date-night-ideas",
  "tampa-hidden-gems",
  "moving-to-tampa",
] as const;

export type NeighborhoodSlug = (typeof NEIGHBORHOODS)[number]["slug"];
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type ModifierSlug = (typeof MODIFIERS)[number]["slug"];
export type FaqSlug = (typeof FAQ_SLUGS)[number];

export function getNeighborhood(slug: string) {
  return NEIGHBORHOODS.find((n) => n.slug === slug) ?? null;
}

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function isNeighborhood(slug: string): boolean {
  return NEIGHBORHOODS.some((n) => n.slug === slug);
}

export function isCategory(slug: string): boolean {
  return CATEGORIES.some((c) => c.slug === slug);
}

export function isModifier(slug: string): boolean {
  return MODIFIERS.some((m) => m.slug === slug);
}

export function getModifier(slug: string) {
  return MODIFIERS.find((m) => m.slug === slug) ?? null;
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
