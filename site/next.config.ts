import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the newsletter markdown files into the serverless deployment.
  // Without this, Next.js's file-tracing analysis doesn't see the dynamic
  // fs.readFileSync(...) call in lib/newsletter-parser.ts and the route
  // handler ships without any newsletter content. That's why /api/send-newsletter
  // returned "Issue #16 not found" even after the file was on main.
  outputFileTracingIncludes: {
    "/api/send-newsletter": ["./content/newsletters/**/*"],
    "/newsletter/**": ["./content/newsletters/**/*"],
    "/api/**": ["./content/newsletters/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
