import { supabaseAdmin } from "@/lib/supabase";
import { EVENT, getTier } from "@/lib/all-white-party";
import CheckInPanel from "./CheckInPanel";

export const dynamic = "force-dynamic";

// Landing page for a scanned ticket QR. Guests see their ticket; door staff
// see the same page and check people in with the door PIN.
export default async function TicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

  const { data: ticket } = await supabaseAdmin
    .from("awp_tickets")
    .select("code, tier, status, used_at, buyer_email, guest_name")
    .eq("code", cleanCode)
    .maybeSingle();

  const tierName = ticket ? getTier(ticket.tier)?.name ?? ticket.tier : null;

  return (
    <div
      className="min-h-screen text-white flex items-center justify-center px-6 py-10"
      style={{
        background: "radial-gradient(120% 80% at 50% 0%, #2a2016 0%, #140f0a 55%, #0c0a08 100%)",
      }}
    >
      <div className="max-w-sm w-full">
        <p className="text-center text-[#e0b256] text-xs font-bold tracking-[0.3em] uppercase mb-2">
          Tampa Pulse
        </p>
        <h1 className="text-center text-2xl font-black mb-6">{EVENT.name}</h1>

        {!ticket ? (
          <div className="bg-red-500/10 border-2 border-red-500/60 rounded-3xl p-8 text-center">
            <div className="text-5xl mb-4">✕</div>
            <h2 className="text-2xl font-black text-red-300 mb-2">Ticket not found</h2>
            <p className="text-white/60 text-sm">
              Code <span className="font-mono font-bold">{cleanCode}</span> doesn&apos;t match any
              issued ticket. Check the code or the buyer&apos;s email receipt.
            </p>
          </div>
        ) : (
          <CheckInPanel
            code={ticket.code}
            tierName={tierName ?? ""}
            guestName={ticket.guest_name}
            initialStatus={ticket.status as "valid" | "used"}
            initialUsedAt={ticket.used_at}
            buyerEmail={ticket.buyer_email}
            eventDate={`${EVENT.dateLabel} · ${EVENT.timeLabel}`}
          />
        )}
      </div>
    </div>
  );
}
