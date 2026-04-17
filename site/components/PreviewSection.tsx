import SectionHeader from "./SectionHeader";
import EventCard from "./EventCard";
import { events } from "@/lib/data";

export default function PreviewSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          label="Preview"
          title="This Week in Tampa"
          subtitle="A taste of what lands in your inbox every Thursday."
        />

        {/* Featured event */}
        <div className="mb-6">
          <EventCard event={events[0]} size="large" />
        </div>

        {/* Event grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.slice(1, 4).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* See more */}
        <div className="mt-8 text-center">
          <a
            href="/newsletter"
            className="inline-flex items-center gap-2 text-white/50 hover:text-pulse-orange transition-colors text-sm font-medium group"
          >
            See full issue
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
