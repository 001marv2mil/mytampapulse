import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking (SAMEORIGIN so our own pages can iframe /venue-map.html)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://www.youtube.com https://s.ytimg.com https://connect.facebook.net", // unpkg=Leaflet; youtube+ytimg=IFrame API; facebook=pixel
      "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
      "img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com https://server.arcgisonline.com https://randomuser.me https://www.facebook.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.resend.com https://graph.facebook.com https://www.facebook.com https://connect.facebook.net",
      // 'self' for venue-map.html, YouTube for audio player, Google for the ticket-page map embed
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com",
      "frame-ancestors 'self'",
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
  async redirects() {
    return [
      // No-hyphen alias for the guest-list-lobby group chat link
      { source: "/guestlistlobby", destination: "/guestlist-lobby", permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Ticket page is the static site cloned from cyphr10/all-white-rnb
      { source: "/all-white-party", destination: "/all-white-rnb/index.html" },
    ];
  },
};

export default nextConfig;
