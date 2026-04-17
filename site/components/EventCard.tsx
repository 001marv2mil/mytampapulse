import type { Event } from "@/lib/data";

interface EventCardProps {
  event: Event;
  size?: "default" | "large";
}

export default function EventCard({ event, size = "default" }: EventCardProps) {
  const isLarge = size === "large";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
        isLarge ? "h-[420px] md:h-[500px]" : "h-[300px] md:h-[360px]"
      }`}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${event.image})` }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Premium badge */}
      {event.isPremium && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-gold/90 text-black text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full backdrop-blur-sm">
            Premium Pick
          </span>
        </div>
      )}

      {/* Category tag */}
      <div className="absolute top-4 left-4 z-10">
        <span className="glass text-white/90 text-[11px] font-medium tracking-wider uppercase px-3 py-1.5 rounded-full">
          {event.category}
        </span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        {/* Date */}
        <div className="flex items-end gap-4 mb-2">
          <span className="font-heading text-3xl md:text-4xl font-bold text-white/90 leading-none">
            {event.date}
          </span>
          {event.time && (
            <span className="text-white/50 text-xs font-medium mb-1">
              {event.time}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`font-heading font-bold text-white leading-tight mb-1 ${
          isLarge ? "text-xl md:text-2xl" : "text-lg"
        }`}>
          {event.title}
        </h3>

        {/* Location */}
        {event.location && (
          <p className="text-white/40 text-sm">{event.location}</p>
        )}

        {/* Description (only on large) */}
        {isLarge && event.description && (
          <p className="text-white/50 text-sm mt-2 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}
