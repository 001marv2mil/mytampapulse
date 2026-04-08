import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import FloatingNav from "@/components/FloatingNav";
import FooterWrapper from "@/components/FooterWrapper";

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
      <head>
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1272183185072628');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1272183185072628&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className="antialiased bg-[#FFFBF7]">
        <FloatingNav />
        <main>{children}</main>
        <FooterWrapper />
      </body>
    </html>
  );
}
