"use client";

import EmailSignup from "./EmailSignup";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient grain">
      {/* Oversized decorative text */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none select-none z-0 overflow-hidden">
        <span className="font-heading text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] font-black text-white/[0.03] leading-none -ml-8 tracking-tight">
          Tampa
        </span>
        <span className="font-heading text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] font-black text-white/[0.03] leading-none -mr-8 tracking-tight">
          Pulse
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 bg-pulse-orange rounded-full animate-pulse" />
          <span className="text-xs text-white/60 font-medium tracking-wider uppercase">
            Tampa Bay&apos;s #1 Weekly Newsletter
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 animate-fade-in-up animate-delay-100">
          Tampa&apos;s Social
          <br />
          Calendar.{" "}
          <span className="text-pulse-orange">Curated.</span>
        </h1>

        {/* Subline */}
        <p className="text-white/50 text-base sm:text-lg md:text-xl max-w-lg mx-auto mb-10 animate-fade-in-up animate-delay-200 leading-relaxed">
          The only newsletter you need to know what&apos;s worth it every week in Tampa.
        </p>

        {/* Email signup */}
        <div className="flex justify-center animate-fade-in-up animate-delay-300">
          <EmailSignup variant="hero" />
        </div>

        {/* Social proof mini */}
        <div className="mt-10 flex items-center justify-center gap-3 animate-fade-in-up animate-delay-400">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-dark-bg bg-gradient-to-br from-white/20 to-white/5"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-${
                    [
                      "1494790108377-be9c29b29330",
                      "1507003211169-0a1dd7228f2d",
                      "1438761681033-6461ffad8d80",
                      "1472099645785-5658abf4ff4e",
                    ][i - 1]
                  }?w=64&q=80)`,
                  backgroundSize: "cover",
                }}
              />
            ))}
          </div>
          <span className="text-white/40 text-sm">
            Join <span className="text-white/70 font-medium">1,000+</span> Tampa locals
          </span>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-bg to-transparent z-10" />
    </section>
  );
}
