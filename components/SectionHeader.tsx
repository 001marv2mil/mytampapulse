interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-10">
      {label && (
        <span className="text-pulse-orange text-xs font-semibold tracking-[0.3em] uppercase mb-3 block">
          {label}
        </span>
      )}
      <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-white/50 mt-3 text-base md:text-lg max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
