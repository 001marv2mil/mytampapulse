import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Stop MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Force HTTPS for 1 year
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Disable browser features not needed
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Referrer policy — don't leak full URL in referrer headers
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Content Security Policy — allow Unsplash images, block inline scripts from unknown sources
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline for hydration
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://api.resend.com https://graph.facebook.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Bundle the newsletter markdown files into the serverless deployment.
  outputFileTracingIncludes: {
    "/api/send-newsletter": ["./content/newsletters/**/*"],
    "/newsletter/**": ["./content/newsletters/**/*"],
    "/api/**": ["./content/newsletters/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
