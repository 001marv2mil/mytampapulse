export default function SocialProof() {
  const stats = [
    { value: "1,000+", label: "Subscribers" },
    { value: "52", label: "Issues Sent" },
    { value: "16+", label: "Events Weekly" },
  ];

  return (
    <section className="py-16 border-y border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-2xl md:text-3xl font-bold text-white">
                {stat.value}
              </div>
              <div className="text-white/30 text-xs md:text-sm mt-1 tracking-wider uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
