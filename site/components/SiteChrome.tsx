"use client";

import { usePathname } from "next/navigation";
import FloatingNav from "@/components/FloatingNav";
import FooterWrapper from "@/components/FooterWrapper";

// Routes that render standalone — no global nav or footer (e.g. event/checkout pages).
const STANDALONE_PREFIXES = ["/all-white-party"];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const standalone = STANDALONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  return (
    <>
      {!standalone && <FloatingNav />}
      <main>{children}</main>
      {!standalone && <FooterWrapper />}
    </>
  );
}
