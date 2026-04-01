import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import FloatingNav from "@/components/FloatingNav";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-heading", weight: ["700", "800", "900"], display: "swap" });

export const metadata: Metadata = {
  title: "mytampapulse — Tampa's Weekly Insider Guide",
  description: "The best events, hidden gems, food drops, and weekend plans in Tampa Bay. Free newsletter every Thursday. Follow @mytampapulse.",
  keywords: ["Tampa", "Tampa Bay", "events", "nightlife", "hidden gems", "things to do", "Tampa newsletter", "mytampapulse"],
  openGraph: {
    title: "mytampapulse — Tampa's Weekly Insider Guide",
    description: "The best events, hidden gems, food drops, and weekend plans in Tampa Bay. Free newsletter every Thursday.",
    type: "website",
    siteName: "mytampapulse",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="antialiased bg-[#FFFBF7]">
        <FloatingNav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
