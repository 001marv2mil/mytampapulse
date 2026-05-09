"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BlackMaskPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ref, setRef] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setGoogleLoading(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref");
    const eventParam = params.get("event");
    if (refParam) setRef(refParam);
    if (eventParam) setEventName(eventParam);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ref, source: "black-mask" }),
      });
      if (!res.ok) throw new Error();
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead");
        (window as any).fbq("track", "CompleteRegistration");
      }
      window.location.href = "/thank-you";
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        nav, footer, header { display: none !important; }
        body { background: #000 !important; }
      `}</style>

      {/* Full-screen background */}
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
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.90) 100%)" }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">

          {/* Logo */}
          <p className="font-heading text-lg font-black text-white tracking-tight mb-8">
            Tampa <span className="text-[#FF5A36]">Pulse</span>
          </p>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
            {eventName ? (
              <><span className="text-[#FF5A36]">{eventName}</span><br />is coming to Tampa.</>
            ) : (
              <>Want in on<br /><span className="text-[#FF5A36]">the next one?</span></>
            )}
          </h1>

          {/* Sub-headline */}
          <p className="text-white/60 text-base leading-relaxed mb-8 max-w-sm">
            {eventName
              ? <>Drop your email for first access — plus the free weekly roundup of everything happening in the Bay.</>
              : <>Drop your email and stay tapped in on Tampa&apos;s best events, nightlife, and things to do. Free weekly roundup, no spam.</>
            }
          </p>

          {/* Social proof */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[
                  "https://images.pexels.com/photos/7383149/pexels-photo-7383149.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1&fit=crop",
                  "https://randomuser.me/api/portraits/women/29.jpg",
                  "https://images.pexels.com/photos/7346623/pexels-photo-7346623.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1&fit=crop",
                  "https://randomuser.me/api/portraits/men/22.jpg",
                  "https://randomuser.me/api/portraits/men/54.jpg",
                  "https://images.pexels.com/photos/34697032/pexels-photo-34697032.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1&fit=crop",
                ].map((src, i) => (
                  <img key={i} src={src} alt="" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                ))}
              </div>
              <p className="text-white/50 text-xs">1,000+ locals already in</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="w-full bg-white/10 border border-white/20 rounded-full px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5A36]/60 transition-all text-sm backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF5A36] hover:bg-[#e5502f] disabled:opacity-60 text-white font-black py-4 rounded-full transition-all text-sm tracking-wide"
            >
              {loading ? "Sending details…" : "Send Me the Details. It's Free"}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-xs mt-2">{error}</p>
          )}

          {/* Already subscribed? Sign in */}
          <div className="w-full mt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">already subscribed?</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2.5 border border-white/15 bg-white/8 backdrop-blur-sm rounded-full px-4 py-3.5 text-sm text-white/70 font-medium hover:bg-white/15 transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? "Redirecting..." : "Sign in with Google"}
            </button>
          </div>

          {/* Trust */}
          <p className="text-white/20 text-xs mt-5">
            No spam. Unsubscribe anytime. You&apos;ll get Tampa Pulse every Thursday.
          </p>

        </div>
      </div>
    </>
  );
}
