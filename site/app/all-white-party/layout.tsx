import type { Metadata } from "next";

// This page is invite-only / link-only. Keep it off search engines entirely.
export const metadata: Metadata = {
  title: "All White R&B Night · Tampa",
  description: "Tampa's premier All White R&B Night. July 11, 2026 at Social Club.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: {
    title: "All White R&B Night · Tampa",
    description: "Tampa's premier All White R&B Night. July 11, 2026 · Social Club, Downtown Tampa.",
    type: "website",
  },
};

export default function AllWhitePartyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
