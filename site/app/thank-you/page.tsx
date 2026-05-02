import Link from "next/link";

export const metadata = {
  title: "Your Guide is on the Way — Tampa Pulse",
  description: "Download your free 60-Day Tampa Events Guide.",
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{ background: "linear-gradient(170deg, #FFF5F0 0%, #FFFBF7 45%, #FFF8F0 100%)" }}>

      {/* Logo */}
      <div className="mb-10">
        <Link href="/">
          <span className="font-heading text-3xl font-black text-gray-900">
            tampa<span style={{ color: "#FF5A36" }}>pulse</span>
          </span>
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-orange-100 shadow-2xl shadow-orange-100/40 max-w-lg w-full p-10 text-center">

        <div className="text-5xl mb-5">🎉</div>

        <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">
          You&apos;re in.<br />
          <span style={{ color: "#FF5A36" }}>Here&apos;s your guide.</span>
        </h1>

        <p className="text-gray-500 text-base leading-relaxed mb-8">
          Check your inbox — your 60-Day Tampa Events Guide is on the way. Or download it right now:
        </p>

        {/* Primary CTA */}
        <a
          href="/events-guide.pdf"
          download
          className="block w-full text-center text-white font-black text-lg py-4 px-8 rounded-2xl mb-4 transition-all hover:scale-[1.02]"
          style={{ background: "#FF5A36" }}
        >
          Download the Guide →
        </a>

        <p className="text-gray-400 text-xs mb-8">PDF · Free · No strings attached</p>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-7 mb-6">
          <p className="text-gray-500 text-sm font-semibold mb-1">Your first issue drops Thursday.</p>
          <p className="text-gray-400 text-sm">Locals&apos; picks, not tourist traps — direct to your inbox every week.</p>
        </div>

        {/* Referral nudge */}
        <div className="bg-orange-50 rounded-xl p-5 text-left mb-6">
          <p className="text-sm font-bold text-gray-900 mb-1">🎁 Refer a friend, unlock more</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            1 referral → Tampa Neighborhoods Guide + First-Timer&apos;s Checklist<br />
            5 referrals → Restaurant voucher entry<br />
            10+ referrals → $100 gift card &amp; iPad giveaway
          </p>
          <p className="text-xs text-gray-400 mt-2">Your unique referral link is in your welcome email.</p>
        </div>

        {/* Read latest issue */}
        <Link
          href="/newsletter"
          className="block w-full text-center bg-gray-900 text-white font-bold text-sm py-3 px-6 rounded-xl transition-all hover:scale-[1.02]"
        >
          Read the Latest Issue →
        </Link>
      </div>

      {/* Instagram */}
      <div className="mt-8 text-center">
        <a
          href="https://instagram.com/thetampapulse"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          Follow @thetampapulse for daily Tampa updates →
        </a>
      </div>
    </main>
  );
}
