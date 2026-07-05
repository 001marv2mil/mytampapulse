import { EVENT } from "@/lib/all-white-party";
import StatsBoard from "./StatsBoard";

export const dynamic = "force-dynamic";

// Mini money dashboard — same door PIN as the guest list. Auto-refreshes.
export default function StatsPage() {
  return (
    <div
      className="min-h-screen text-white px-4 py-8"
      style={{
        background: "radial-gradient(120% 80% at 50% 0%, #2a2016 0%, #140f0a 55%, #0c0a08 100%)",
      }}
    >
      <div className="max-w-lg mx-auto">
        <p className="text-center text-[#e0b256] text-xs font-bold tracking-[0.3em] uppercase mb-1">
          Sales Dashboard
        </p>
        <h1 className="text-center text-2xl font-black mb-6">{EVENT.name}</h1>
        <StatsBoard />
      </div>
    </div>
  );
}
