"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"confirm" | "loading" | "done" | "error">("confirm");

  const handleUnsubscribe = async () => {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-3xl font-black text-gray-900 mb-4">Invalid link</h1>
        <p className="text-gray-500 text-sm">This unsubscribe link is missing or invalid.</p>
        <Link href="/" className="inline-block mt-6 text-pulse-orange font-semibold text-sm hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      {status === "confirm" && (
        <>
          <div className="text-5xl mb-6">👋</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Hate to see you go.
          </h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
            If you unsubscribe, you&apos;ll stop receiving the weekly Tampa Pulse newsletter. You can always re-subscribe later.
          </p>
          <button
            onClick={handleUnsubscribe}
            className="bg-gray-900 hover:bg-black text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all duration-200 hover:scale-[1.02]"
          >
            Yes, unsubscribe me
          </button>
          <p className="mt-4">
            <Link href="/" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
              Never mind, take me back
            </Link>
          </p>
        </>
      )}

      {status === "loading" && (
        <p className="text-gray-500 text-sm">Unsubscribing...</p>
      )}

      {status === "done" && (
        <>
          <div className="text-5xl mb-6">✅</div>
          <h1 className="font-heading text-3xl font-black text-gray-900 mb-4">
            You&apos;re unsubscribed.
          </h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
            You won&apos;t receive any more emails from Tampa Pulse. If you change your mind, you can always sign up again on our homepage.
          </p>
          <Link href="/" className="text-pulse-orange font-semibold text-sm hover:underline">
            Back to mytampapulse.com
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-5xl mb-6">😕</div>
          <h1 className="font-heading text-3xl font-black text-gray-900 mb-4">
            Something went wrong.
          </h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
            We couldn&apos;t process your unsubscribe request. The link may be invalid or expired.
          </p>
          <Link href="/" className="text-pulse-orange font-semibold text-sm hover:underline">
            Go to homepage
          </Link>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#FFFBF7]">
      <Suspense fallback={<p className="text-gray-500 text-sm">Loading...</p>}>
        <UnsubscribeForm />
      </Suspense>
    </div>
  );
}
