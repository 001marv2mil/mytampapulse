import Link from "next/link";

const categories = [
  { label: "Things To Do This Weekend", href: "/faq/things-to-do-in-tampa-this-weekend", emoji: "🗓️" },
  { label: "Free Things To Do", href: "/faq/free-things-to-do-in-tampa", emoji: "🆓" },
  { label: "Best Restaurants", href: "/faq/best-restaurants-in-tampa", emoji: "🍽️" },
  { label: "Best Bars", href: "/faq/best-bars-in-tampa", emoji: "🍹" },
  { label: "Coffee Shops", href: "/faq/best-coffee-shops-in-tampa", emoji: "☕" },
  { label: "Arts & Culture", href: "/faq/tampa-arts-culture", emoji: "🎨" },
  { label: "Outdoor Activities", href: "/faq/outdoor-activities-tampa", emoji: "🌿" },
  { label: "Nightlife Guide", href: "/faq/tampa-nightlife-guide", emoji: "🌙" },
];

export default function BrowseByCategory() {
  return (
    <section className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-pulse-orange text-xs font-bold tracking-[0.3em] uppercase mb-3">
            Quick Links
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Browse by Category
          </h2>
          <p className="text-gray-500 text-base mt-3 max-w-lg">
            Looking for something specific? Jump straight to what you need.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group bg-[#FFFBF7] rounded-2xl p-5 border border-gray-100 hover:border-pulse-orange/40 hover:shadow-lg transition-all duration-200"
            >
              <span className="text-2xl mb-3 block">{cat.emoji}</span>
              <span className="font-heading font-black text-gray-900 text-sm leading-snug group-hover:text-pulse-orange transition-colors block">
                {cat.label}
              </span>
              <span className="mt-2 text-pulse-orange text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity block">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
