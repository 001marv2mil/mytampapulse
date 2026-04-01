import Link from "next/link";
import EmailSignup from "./EmailSignup";

export default function CTASection() {
  return (
    <section id="subscribe" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pulse-orange/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Label */}
        <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-6 block">
          Don&apos;t Miss Out
        </span>

        {/* Headline */}
        <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Get Tapped In
        </h2>

        <p className="text-white/40 text-base md:text-lg mb-10 max-w-md mx-auto">
          Every Thursday. The best events, spots, and hidden gems in Tampa. Delivered.
        </p>

        {/* Email signup */}
        <div className="flex justify-center">
          <EmailSignup variant="section" buttonText="Subscribe" />
        </div>

        {/* Pulse+ teaser */}
        <div className="mt-8">
          <Link
            href="/pulse-plus"
            className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-pulse-orange transition-colors duration-300"
          >
            Want the VIP experience?
            <span className="text-pulse-orange font-semibold">Pulse+ →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
