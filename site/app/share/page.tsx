"use client";

import { useState, useEffect } from "react";

export default function SharePage() {
  const [shareUrl, setShareUrl] = useState("");
  const [eventName, setEventName] = useState("Black Mask Social");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    const event = params.get("event");
    if (event) setEventName(decodeURIComponent(event));

    const base = window.location.origin;
    const url =
      event && ref
        ? `${base}/join?event=${encodeURIComponent(decodeURIComponent(event))}&ref=${ref}`
        : ref
        ? `${base}?ref=${ref}`
        : `${base}/join`;
    setShareUrl(url);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select the text
    }
  };

  const whatsappText = `Just locked in my spot for ${eventName} in Tampa — it's invite-only, grab yours before it fills: ${shareUrl}`;
  const smsText = `Yo, ${eventName} in Tampa looks lowkey fire. I'm already in — grab your spot: ${shareUrl}`;

  return (
    <>
      <style jsx global>{`
        nav, footer, header { display: none !important; }
        body { background: #000 !important; }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 py-14 relative"
        style={{
          backgroundImage: "url('/black-mask-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.82) 40%, rgba(0,0,0,0.96) 100%)",
          }}
        />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
          {/* Logo */}
          <p className="font-heading text-lg font-black text-white tracking-tight mb-8">
            Tampa <span className="text-[#FF5A36]">Pulse</span>
          </p>

          {/* Checkmark */}
          <div className="w-16 h-16 rounded-full bg-[#FF5A36] flex items-center justify-center mb-5 shadow-lg shadow-[#FF5A36]/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Confirmation */}
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-white leading-tight mb-2">
            You&apos;re in. 🎭
          </h1>
          <p className="text-[#FF5A36] font-bold text-base mb-6 tracking-wide uppercase text-sm">
            {eventName}
          </p>

          {/* Hook */}
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
            Now bring your crew.
          </h2>
          <p className="text-white/55 text-sm leading-relaxed mb-5 max-w-xs">
            These nights hit different with your people. Share your link — anyone who signs up gets first access when {eventName} drops.
          </p>

          {/* Reward ladder */}
          <div className="w-full bg-white/8 border border-white/15 rounded-2xl px-5 py-4 mb-7 backdrop-blur-sm text-left space-y-2">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Your referral rewards</p>
            <div className="flex items-center gap-3">
              <span className="text-base">🎁</span>
              <div>
                <p className="text-white text-xs font-bold">1 friend signs up</p>
                <p className="text-white/50 text-xs">Tampa Neighborhoods Guide + First-Timer&apos;s Checklist unlocked</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base">💳</span>
              <div>
                <p className="text-white text-xs font-bold">5 friends sign up</p>
                <p className="text-white/50 text-xs">Entered for a $250 Tampa Bay gift card</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base">📱</span>
              <div>
                <p className="text-white text-xs font-bold">10 friends sign up</p>
                <p className="text-white/50 text-xs">Entered for an iPad giveaway</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base">🍽️</span>
              <div>
                <p className="text-white text-xs font-bold">25 friends sign up</p>
                <p className="text-white/50 text-xs">Dinner for 2 at Bern&apos;s Steak House</p>
              </div>
            </div>
          </div>

          {/* Your link */}
          <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 text-left">
            <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest mb-1">Your link</p>
            <p className="text-white/60 text-xs font-mono break-all leading-relaxed">
              {shareUrl || "Loading…"}
            </p>
          </div>

          {/* Share buttons */}
          <div className="w-full space-y-3">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="w-full py-4 rounded-full font-black text-sm tracking-wide transition-all"
              style={{
                background: copied ? "#22c55e" : "#FF5A36",
                color: "white",
              }}
            >
              {copied ? "Copied! ✓" : "Copy My Link"}
            </button>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: "#25D366", color: "white" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Send on WhatsApp
            </a>

            {/* SMS */}
            <a
              href={`sms:?body=${encodeURIComponent(smsText)}`}
              className="w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all border"
              style={{
                background: "rgba(255,255,255,0.07)",
                borderColor: "rgba(255,255,255,0.15)",
                color: "white",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Send via Text
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-2 mt-8">
            <div className="flex -space-x-2">
              {[
                "https://images.pexels.com/photos/7383149/pexels-photo-7383149.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1&fit=crop",
                "https://randomuser.me/api/portraits/women/29.jpg",
                "https://randomuser.me/api/portraits/men/22.jpg",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full border-2 border-black object-cover"
                />
              ))}
            </div>
            <p className="text-white/35 text-xs">1,000+ Tampa locals already in ⭐⭐⭐⭐⭐</p>
          </div>
        </div>
      </div>
    </>
  );
}
