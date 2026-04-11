import HeroSection from "@/components/HeroSection";
import TextTicker from "@/components/TextTicker";
import WhatYouGet from "@/components/WhatYouGet";
import SampleIssue from "@/components/SampleIssue";
import TestimonialsSection from "@/components/TestimonialsSection";
import NewsletterCTA from "@/components/NewsletterCTA";
import SponsorTeaser from "@/components/SponsorTeaser";
import InstagramGrid from "@/components/InstagramGrid";
import ExploreNeighborhoods from "@/components/ExploreNeighborhoods";
import BrowseByCategory from "@/components/BrowseByCategory";
import FinalCTA from "@/components/FinalCTA";
import StickyEmailBar from "@/components/StickyEmailBar";
import { getArchiveIssues } from "@/lib/newsletter-parser";

export default function Home() {
  const latest = getArchiveIssues()[0];
  return (
    <>
      {/* 1. HERO — email capture above fold, issue preview, proof */}
      <HeroSection latestIssue={latest ? { number: latest.number, date: latest.date } : undefined} />

      {/* 2. TICKER — category signal, energy */}
      <TextTicker />

      {/* 3. WHAT YOU GET — reduce friction, show the value */}
      <WhatYouGet />

      {/* 4. SAMPLE ISSUE — see it before you subscribe */}
      <SampleIssue latestIssueNumber={latest?.number} />

      {/* 5. SOCIAL PROOF */}
      <TestimonialsSection />

      {/* 6. MID-PAGE CTA — catch people who are convinced */}
      <NewsletterCTA />

      {/* 7. SPONSOR TEASER — drive business revenue */}
      <SponsorTeaser />

      {/* 8. INSTAGRAM — content is alive and real */}
      <InstagramGrid />

      {/* 9. EXPLORE NEIGHBORHOODS */}
      <ExploreNeighborhoods />

      {/* 10. BROWSE BY CATEGORY */}
      <BrowseByCategory />

      {/* 11. FINAL CTA */}
      <FinalCTA />

      {/* 12. STICKY EMAIL BAR */}
      <StickyEmailBar />
    </>
  );
}
