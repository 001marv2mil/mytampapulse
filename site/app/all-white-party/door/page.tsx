import { EVENT } from "@/lib/all-white-party";
import DoorList from "./DoorList";

export const dynamic = "force-dynamic";

// Door staff guest list — backup to QR scanning. PIN-gated client side.
export default function DoorPage() {
  return (
    <div
      className="min-h-screen text-white px-4 py-8"
      style={{
        background: "radial-gradient(120% 80% at 50% 0%, #2a2016 0%, #140f0a 55%, #0c0a08 100%)",
      }}
    >
      <div className="max-w-lg mx-auto">
        <p className="text-center text-[#e0b256] text-xs font-bold tracking-[0.3em] uppercase mb-1">
          Door List
        </p>
        <h1 className="text-center text-2xl font-black mb-6">{EVENT.name}</h1>
        <DoorList />
      </div>
    </div>
  );
}
