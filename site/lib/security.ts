/**
 * Tampa Pulse — shared security utilities
 * Applied from the 4-prompt vibe-coding security checklist:
 *   1. Rate limiting on all endpoints (max 5 auth attempts / 15 min)
 *   2. No hardcoded secrets, everything in env vars
 *   3. Sanitize every user input, reject oversized / malformed payloads
 *   4. Full security audit — see audit notes inline
 */

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── HTML escaping ────────────────────────────────────────────────────────────
// Prevents HTML/CSS injection in emails built from user input.
const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

export function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"'`=/]/g, (c) => HTML_ESCAPE[c] ?? c);
}

// ── Email validation ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && EMAIL_RE.test(email.trim()) && email.length <= 320;
}

// Strip characters that can be used for email header injection
export function sanitizeEmailSubject(str: string): string {
  return str.replace(/[\r\n\t]/g, " ").substring(0, 200);
}

// ── Payload size guard ───────────────────────────────────────────────────────
// Returns parsed body or a 413 response if the payload is too large / malformed.
export async function parseSafeJson(
  req: NextRequest,
  maxBytes = 10_000
): Promise<{ data: Record<string, unknown> } | { error: NextResponse }> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return { error: NextResponse.json({ error: "Payload too large" }, { status: 413 }) };
  }
  try {
    const text = await req.text();
    if (text.length > maxBytes) {
      return { error: NextResponse.json({ error: "Payload too large" }, { status: 413 }) };
    }
    const data = JSON.parse(text);
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return { error: NextResponse.json({ error: "Invalid request body" }, { status: 400 }) };
    }
    return { data: data as Record<string, unknown> };
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars.
// If those are not set, rate limiting is skipped (app still works, just unprotected).
// Set these up at: https://console.upstash.com/ (free tier is sufficient)

let _rateLimiters: Map<string, Ratelimit> | null = null;

function getRateLimiter(kind: "standard" | "auth" | "email"): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // gracefully disabled — add Upstash env vars to enable
  }

  if (!_rateLimiters) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    _rateLimiters = new Map([
      // Standard endpoints: 20 requests per minute per IP
      ["standard", new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60s"), prefix: "rl:std" })],
      // Auth routes: 5 attempts per 15 minutes per IP (prompt #1)
      ["auth",     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "900s"), prefix: "rl:auth" })],
      // Email-sending routes: 3 per minute per IP
      ["email",    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "60s"),  prefix: "rl:email" })],
    ]);
  }
  return _rateLimiters.get(kind) ?? null;
}

export async function rateLimit(
  req: NextRequest,
  kind: "standard" | "auth" | "email" = "standard"
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(kind);
  if (!limiter) return null; // not configured — skip

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}
