import Link from "next/link";

export const metadata = {
  title: "Tampa's 50 Best Hidden Spots | Tampa Pulse",
  description: "The spots locals know and tourists never find. Marv's personal list — not published anywhere else.",
};

const gems = [
  // Food & Drink
  { number: 1, name: "Kunafa King", neighborhood: "Temple Terrace", category: "Food", note: "Middle Eastern dessert spot. The kunafa is made fresh. Nobody outside the neighborhood knows this exists." },
  { number: 2, name: "Madame Fortune", neighborhood: "Ybor City", category: "Bars", note: "Speakeasy vibes, great cocktails, dark lighting. Best date spot in Ybor nobody talks about." },
  { number: 3, name: "Deviant Libation", neighborhood: "Seminole Heights", category: "Bars", note: "$5 Sunday shows. Local bands, tiny room, zero pretension." },
  { number: 4, name: "Willa's Burger Bar", neighborhood: "West Tampa", category: "Food", note: "Smash burgers. The sauce is the move. Cash only, worth it." },
  { number: 5, name: "Sancocho y Leña", neighborhood: "East Tampa", category: "Food", note: "Colombian-Venezuelan fusion inside a food truck park. The sancocho is the real deal." },
  { number: 6, name: "The Bricks", neighborhood: "Ybor City", category: "Bars", note: "Rooftop bar that doesn't feel touristy. Go on a Tuesday." },
  { number: 7, name: "Datz", neighborhood: "South Tampa", category: "Food", note: "The mac + cheese grilled cheese alone justifies the trip." },
  { number: 8, name: "Ichicoro Ane", neighborhood: "Seminole Heights", category: "Food", note: "Izakaya-style Japanese. Go for the chicken karaage. Show up early." },
  { number: 9, name: "Sal's Subs", neighborhood: "Carrollwood", category: "Food", note: "Old school Italian sub shop. Nothing fancy. Perfect sandwich." },
  { number: 10, name: "The Refinery", neighborhood: "Seminole Heights", category: "Food", note: "Farm-to-table before it was a thing. Menu changes constantly. Go with curiosity." },
  // Hidden Bars & Nightlife
  { number: 11, name: "Ciro's Speakeasy", neighborhood: "South Tampa", category: "Bars", note: "Actual speakeasy. Ring the buzzer. Password required some nights." },
  { number: 12, name: "Undertow Beach Bar", neighborhood: "Harbour Island", category: "Bars", note: "Dock bar. Water views. No tourists." },
  { number: 13, name: "Crowbar", neighborhood: "Ybor City", category: "Music", note: "Best live music venue in Tampa. Has been for 30 years. Catch it before it's gone." },
  { number: 14, name: "Ritz Ybor", neighborhood: "Ybor City", category: "Music", note: "Rooftop is the move. Check the show calendar." },
  { number: 15, name: "Fly Bar", neighborhood: "Downtown Tampa", category: "Bars", note: "Rooftop on a weeknight is peaceful. Weekends get crowded." },
  // Neighborhoods Worth Exploring
  { number: 16, name: "Florida Ave strip", neighborhood: "Seminole Heights", category: "Explore", note: "10 blocks of local restaurants, bars, and coffee shops. Tampa's best-kept neighborhood secret." },
  { number: 17, name: "West Tampa", neighborhood: "West Tampa", category: "Explore", note: "Three restaurants have put this on the map recently. Walk around, you'll find more." },
  { number: 18, name: "Dunedin Causeway", neighborhood: "Dunedin", category: "Explore", note: "Best casual beach day near Tampa. Bring a cooler. Free parking on the causeway." },
  { number: 19, name: "Tarpon Springs Sponge Docks", neighborhood: "Tarpon Springs", category: "Explore", note: "30 min drive. Greek food, sponge divers, waterfront. Go for lunch on a Sunday." },
  { number: 20, name: "Safety Harbor", neighborhood: "Safety Harbor", category: "Explore", note: "Main Street has a real local scene. Good restaurants, no chains, walkable." },
  // Markets & Outdoor
  { number: 21, name: "Thai Temple Sunday Market", neighborhood: "North Tampa", category: "Markets", note: "Buddhist temple sells authentic Thai street food Sunday mornings. Cheapest, best Thai in Tampa." },
  { number: 22, name: "Seminole Heights Saturday Market", neighborhood: "Seminole Heights", category: "Markets", note: "Local produce, vendors, good coffee. Get there before 10am." },
  { number: 23, name: "St. Pete Youth Farm Secondhand Market", neighborhood: "St. Pete", category: "Markets", note: "Saturday mornings at a literal youth farm. Best thrift finds in the bay area." },
  { number: 24, name: "Hillsborough River State Park", neighborhood: "Zephyrhills", category: "Outdoor", note: "45 min from downtown. Kayak rentals, swimming, no crowd. Tampa's best outdoor secret." },
  { number: 25, name: "Fort De Soto Park", neighborhood: "St. Pete", category: "Outdoor", note: "Consistently ranked top beach in the US. An hour from downtown. Go on a weekday." },
  // Coffee
  { number: 26, name: "Buddy Brew", neighborhood: "Hyde Park", category: "Coffee", note: "Best local roast in Tampa. The Hyde Park location has a patio worth sitting at." },
  { number: 27, name: "Yeoman's Cask & Lion", neighborhood: "Hyde Park", category: "Coffee", note: "Coffee and cocktails. British pub feel. Open early." },
  { number: 28, name: "Rooster & The Till", neighborhood: "Seminole Heights", category: "Food", note: "Brunch is the move. Small menu, everything is excellent. Go before 10am or wait." },
  { number: 29, name: "Oxford Exchange", neighborhood: "Downtown Tampa", category: "Coffee", note: "Beautiful space. Good coffee. Works well as a remote office." },
  { number: 30, name: "Foundation Coffee", neighborhood: "Ybor City", category: "Coffee", note: "Best espresso in Ybor. Small, local, no corporate feel." },
  // Art & Culture
  { number: 31, name: "Ybor City Museum", neighborhood: "Ybor City", category: "Culture", note: "The history of Tampa is actually interesting. $4 admission. Most people walk past it." },
  { number: 32, name: "Tampa Museum of Art", neighborhood: "Downtown Tampa", category: "Culture", note: "Free on certain Thursdays. The waterfront location alone is worth the visit." },
  { number: 33, name: "Glazer Children's Museum", neighborhood: "Downtown Tampa", category: "Culture", note: "Best thing to do with kids in Tampa. Underrated for adults who are just curious." },
  { number: 34, name: "Stageworks Theatre", neighborhood: "Ybor City", category: "Culture", note: "Small local theater. Tickets are cheap, productions are good." },
  { number: 35, name: "Cuban Club", neighborhood: "Ybor City", category: "Culture", note: "Historic building with rotating events. Check the calendar — something is always happening." },
  // Food part 2
  { number: 36, name: "La Segunda Bakery", neighborhood: "West Tampa", category: "Food", note: "The original Cuban bread. They've been baking since 1915. Go in the morning." },
  { number: 37, name: "Brocato's Sandwich Shop", neighborhood: "West Tampa", category: "Food", note: "Cash only. Been here forever. Get the Cuban." },
  { number: 38, name: "Taco Bus", neighborhood: "Multiple", category: "Food", note: "24-hour taco truck turned institution. The al pastor is the standard." },
  { number: 39, name: "Columbia Restaurant", neighborhood: "Ybor City", category: "Food", note: "Florida's oldest restaurant. Flamenco shows on weekends. Tourist but worth it once." },
  { number: 40, name: "Wright's Gourmet House", neighborhood: "South Tampa", category: "Food", note: "Deli sandwiches that have been destroying people for decades. Get there before lunch rush." },
  // Waterfront & Views
  { number: 41, name: "Ballast Point Park", neighborhood: "South Tampa", category: "Views", note: "Best sunset view in Tampa. Fishing pier, free parking, no tourists." },
  { number: 42, name: "Bayshore Boulevard", neighborhood: "South Tampa", category: "Outdoor", note: "Longest continuous sidewalk in the US. Run, walk, bike. Go at sunrise." },
  { number: 43, name: "Sparkman Wharf", neighborhood: "Channelside", category: "Food", note: "Food trucks on the water. Go on a weeknight when it's not packed." },
  { number: 44, name: "Armature Works", neighborhood: "Riverfront", category: "Food", note: "Food hall with a rooftop. Best view of downtown Tampa. Go at sunset." },
  { number: 45, name: "Cotanchobee Fort Brooke Park", neighborhood: "Downtown Tampa", category: "Outdoor", note: "Hidden waterfront park under the bridge. Almost nobody goes here. Perfect for a quiet afternoon." },
  // Local Institutions
  { number: 46, name: "Inkwood Books", neighborhood: "Hyde Park", category: "Shop", note: "Independent bookstore. They hand-sell. Ask them what you should read." },
  { number: 47, name: "Mazzaro's Italian Market", neighborhood: "St. Pete", category: "Food", note: "Italian deli, cheese, wine, imported goods. The most European 30 minutes you'll spend in Tampa." },
  { number: 48, name: "The Saturday Market at Ybor", neighborhood: "Ybor City", category: "Markets", note: "Weekly flea market. Vintage, local art, random finds. Good Saturday morning." },
  { number: 49, name: "Casita Taqueria", neighborhood: "Seminole Heights", category: "Food", note: "Tiny, cash only, lines out the door on weekends. The birria is worth every minute of the wait." },
  { number: 50, name: "MacDinton's Irish Pub", neighborhood: "South Tampa", category: "Bars", note: "Best bar for a low-key weeknight. Regular crowd, no attitude, good pours." },
];

const categoryColors: Record<string, string> = {
  Food: "bg-orange-100 text-orange-700",
  Bars: "bg-purple-100 text-purple-700",
  Music: "bg-blue-100 text-blue-700",
  Explore: "bg-green-100 text-green-700",
  Markets: "bg-yellow-100 text-yellow-700",
  Outdoor: "bg-teal-100 text-teal-700",
  Coffee: "bg-amber-100 text-amber-700",
  Culture: "bg-pink-100 text-pink-700",
  Views: "bg-sky-100 text-sky-700",
  Shop: "bg-indigo-100 text-indigo-700",
};

export default function HiddenGemsPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF7] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-4 block">
            Referral Reward
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Tampa&apos;s 50 Best Hidden Spots
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto mb-2">
            The spots locals know and tourists never find. Marv&apos;s personal list — not published anywhere else.
          </p>
          <p className="text-gray-400 text-sm">
            You unlocked this by referring a friend to Tampa Pulse. Share it, or keep it to yourself. Either way.
          </p>
        </div>

        <hr className="border-gray-200 mb-12" />

        {/* Gems list */}
        <div className="space-y-5">
          {gems.map((gem) => (
            <div key={gem.number} className="flex gap-5 items-start py-4 border-b border-gray-100">
              <div className="text-pulse-orange font-heading font-bold text-lg w-8 shrink-0 pt-0.5">
                {gem.number}.
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-heading font-bold text-gray-900 text-base">{gem.name}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColors[gem.category] || "bg-gray-100 text-gray-600"}`}>
                    {gem.category}
                  </span>
                  <span className="text-gray-400 text-xs">{gem.neighborhood}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{gem.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center bg-gray-900 rounded-3xl p-10">
          <p className="text-white font-heading font-bold text-xl mb-2">
            Want next week&apos;s hidden gem before everyone else?
          </p>
          <p className="text-white/50 text-sm mb-6">
            It drops every Thursday in Tampa Pulse. Free.
          </p>
          <Link
            href="/"
            className="inline-block bg-pulse-orange hover:bg-pulse-orange/90 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
          >
            Subscribe Free →
          </Link>
        </div>

      </div>
    </div>
  );
}
