import Link from "next/link";
import Stripe from "stripe";
import { EVENT, formatPrice } from "@/lib/all-white-party";
import { issueTicketsForSession } from "@/lib/awp-issue-tickets";

export const dynamic = "force-dynamic";

// Stripe redirects here after a successful payment with ?session_id=...
// We retrieve the session server-side to show a real confirmation — and run
// the ticket-issuing pipeline as a BACKUP to the webhook. Issuance is
// idempotent, so whichever of the two fires second is a no-op. Between them,
// a paying buyer always gets their e-tickets.
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let email: string | null = null;
  let amountTotal: number | null = null;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (secretKey && session_id) {
    try {
      await issueTicketsForSession(session_id);
    } catch {
      // Never block the confirmation page on issuance; webhook still covers it.
    }
    try {
      const stripe = new Stripe(secretKey);
      const session = await stripe.checkout.sessions.retrieve(session_id);
      email = session.customer_details?.email ?? null;
      amountTotal = session.amount_total ?? null;
    } catch {
      // Fall back to a generic confirmation if retrieval fails.
    }
  }

  return (
    <div
      className="min-h-screen text-white flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #2a2016 0%, #140f0a 55%, #0c0a08 100%)",
      }}
    >
      <div className="max-w-md w-full bg-[#15100b]/80 border border-[#D4AF37]/25 rounded-3xl p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#F0D488] to-[#D4AF37] flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#1a1208]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-black mb-3">
          You&apos;re in! 🤍
        </h1>
        <p className="text-white/60 text-sm leading-relaxed mb-4">
          Your spot at the <span className="text-white font-semibold">{EVENT.name}</span> is locked
          in.
          {email ? (
            <>
              {" "}
              Your QR-code e-ticket{" "}
              <span className="text-white font-semibold">is being emailed to {email}</span> right
              now.
            </>
          ) : (
            " Your QR-code e-ticket is being emailed to you right now."
          )}
        </p>

        <div className="bg-[#F0D488]/10 border border-[#D4AF37]/40 rounded-xl px-4 py-3 mb-6 text-left">
          <p className="text-[#F0D488] text-xs font-bold uppercase tracking-wider mb-1">
            📬 Don&apos;t see the email?
          </p>
          <p className="text-white/70 text-xs leading-relaxed">
            Check your <span className="text-white font-semibold">Promotions</span> tab (Gmail) or{" "}
            <span className="text-white font-semibold">Spam / Junk</span> folder — it sometimes
            lands there. Look for{" "}
            <span className="text-white font-semibold">&quot;Your ticket — All White R&amp;B Rooftop&quot;</span>{" "}
            from Tampa Pulse. Save it — the QR code inside is your entry at the door.
          </p>
        </div>

        {amountTotal !== null && (
          <div className="flex justify-between items-baseline border-y border-white/10 py-4 mb-6 text-sm">
            <span className="text-white/50">Total paid</span>
            <span className="font-heading font-black text-xl text-[#F0D488]">
              {formatPrice(amountTotal)}
            </span>
          </div>
        )}

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
          {[
            { label: "Date", value: EVENT.dateLabel },
            { label: "Time", value: EVENT.timeLabel },
            { label: "Where", value: EVENT.venue },
          ].map((f) => (
            <div key={f.label} className="flex justify-between text-sm">
              <span className="text-white/40">{f.label}</span>
              <span className="text-white font-medium">{f.value}</span>
            </div>
          ))}
          <a
            href={EVENT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-sm pt-1 text-[#F0D488] hover:underline"
          >
            <span className="text-white/40">Address</span>
            <span className="text-right">{EVENT.address} · Map</span>
          </a>
        </div>

        <p className="text-[#F0D488] text-xs font-semibold mb-6">{EVENT.dressCode}</p>

        <Link
          href="/"
          className="inline-block text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Back to mytampapulse
        </Link>
      </div>
    </div>
  );
}
