import { getArchiveIssues } from "@/lib/newsletter-parser";
import NewsletterGrid from "./NewsletterGrid";

export const metadata = {
  title: "Newsletter | Tampa Pulse",
  description: "Every issue of Tampa Pulse. Tampa's best weekly picks, events, and hidden gems delivered every Thursday.",
};

export default function NewsletterDashboard() {
  const issues = getArchiveIssues();
  return <NewsletterGrid issues={issues} />;
}
