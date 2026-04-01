import Link from "next/link";

const neighborhoods = [
  { slug: "ybor-city", label: "Ybor City", emoji: "🍺" },
  { slug: "hyde-park", label: "Hyde Park", emoji: "🌳" },
  { slug: "channelside", label: "Channelside", emoji: "⚓" },
  { slug: "seminole-heights", label: "Seminole Heights", emoji: "🌿" },
  { slug: "south-tampa", label: "South Tampa", emoji: "🏡" },
  { slug: "downtown-tampa", label: "Downtown Tampa", emoji: "🏙️" },
  { slug: "westshore", label: "Westshore", emoji: "✈️" },
  { slug: "carrollwood", label: "Carrollwood", emoji: "🌲" },
  { slug: "brandon", label: "Brandon", emoji: "🛍️" },
  { slug: "st-pete", label: "St. Pete", emoji: "🎨" },
  { slug: "clearwater", label: "Clearwater", emoji: "🏖️" },
  { slug: "temple-terrace", label: "Temple Terrace", emoji: "🏛️" },
  { slug: "new-tampa", label: "New Tampa", emoji: "🌆" },
  { slug: "riverview", label: "Riverview", emoji: "🌊" },
  { slug: "wesley-chapel", label: "Wesley Chapel", emoji: "🏘️" },
  { slug: "lutz", label: "Lutz", emoji: "🌾" },
  { slug: "land-o-lakes", label: "Land O' Lakes", emoji: "💧" },
  { slug: "odessa", label: "Odessa", emoji: "🌅" },
  { slug: "palm-harbor", label: "Palm Harbor", emoji: "🌴" },
  { slug: "dunedin", label: "Dunedin", emoji: "🎸" },
  { slug: "safety-harbor", label: "Safety Harbor", emoji: "⛵" },
  { slug: "largo", label: "Largo", emoji: "☀️" },
  { slug: "pinellas-park", label: "Pinellas Park", emoji: "🎡" },
  { slug: "tarpon-springs", label: "Tarpon Springs", emoji: "🐠" },
  { slug: "holiday", label: "Holiday", emoji: "🌞" },
];

export default function ExploreNeighborhoods() {
  return (
    <section className="py-20 px-6 bg-[#FFFBF7] border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-3">
            Tampa Bay
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Explore Neighborhoods
          </h2>
          <p className="text-gray-500 text-base mt-3 max-w-lg">
            From Ybor City to Dunedin — find the best things to do in every corner of Tampa Bay.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {neighborhoods.map((n) => (
            <Link
              key={n.slug}
              href={`/tampa/${n.slug}`}
              className="group flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 border border-gray-100 hover:border-pulse-orange/40 hover:shadow-md transition-all duration-200"
            >
              <span className="text-lg leading-none">{n.emoji}</span>
              <span className="font-semibold text-gray-800 text-sm group-hover:text-pulse-orange transition-colors leading-tight">
                {n.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
