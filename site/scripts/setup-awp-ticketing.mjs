// One-time setup for All White Party ticketing:
//   1. Creates the Stripe webhook endpoint (checkout.session.completed)
//   2. Generates a door-staff PIN
//   3. Saves STRIPE_WEBHOOK_SECRET + AWP_DOOR_PIN to Vercel (production) and .env.local
//
// Prereq: run `npx vercel env pull .env.local --environment production --yes` first
// so STRIPE_SECRET_KEY is available locally. Then:  node scripts/setup-awp-ticketing.mjs
import Stripe from "stripe";
import { readFileSync, appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env.local");

const WEBHOOK_URL = "https://mytampapulse.com/api/awp-stripe-webhook";

function readEnv(name) {
  const env = readFileSync(envPath, "utf8");
  const m = env.match(new RegExp(`^${name}="?([^"\\r\\n]+)"?$`, "m"));
  return m ? m[1].trim() : null;
}

function vercelEnvAdd(name, value) {
  // Remove any stale copy first (ignore failure if it doesn't exist)
  spawnSync("npx", ["vercel", "env", "rm", name, "production", "--yes"], {
    cwd: join(here, ".."),
    shell: true,
    input: "",
    stdio: ["pipe", "ignore", "ignore"],
  });
  const res = spawnSync("npx", ["vercel", "env", "add", name, "production"], {
    cwd: join(here, ".."),
    shell: true,
    input: value,
    stdio: ["pipe", "ignore", "pipe"],
  });
  if (res.status !== 0) {
    throw new Error(`vercel env add ${name} failed: ${res.stderr?.toString().slice(0, 300)}`);
  }
}

async function main() {
  const key = readEnv("STRIPE_SECRET_KEY");
  if (!key || key.length < 20) {
    throw new Error(
      "STRIPE_SECRET_KEY missing from .env.local — run `npx vercel env pull .env.local --environment production --yes` first."
    );
  }
  const stripe = new Stripe(key);
  const mode = key.startsWith("sk_live_") ? "LIVE" : "TEST";
  console.log(`Stripe mode: ${mode}`);

  // Replace any previous endpoint for this URL (secret is only shown on create)
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const ep of existing.data) {
    if (ep.url === WEBHOOK_URL) {
      await stripe.webhookEndpoints.del(ep.id);
      console.log(`Removed old webhook ${ep.id}`);
    }
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: ["checkout.session.completed"],
    description: "All White R&B Rooftop — e-ticket issuing",
  });
  console.log(`Created webhook ${endpoint.id} -> ${WEBHOOK_URL}`);

  const doorPin = String(randomInt(100000, 999999));

  console.log("Saving STRIPE_WEBHOOK_SECRET to Vercel (production)...");
  vercelEnvAdd("STRIPE_WEBHOOK_SECRET", endpoint.secret);
  console.log("Saving AWP_DOOR_PIN to Vercel (production)...");
  vercelEnvAdd("AWP_DOOR_PIN", doorPin);

  appendFileSync(envPath, `\nSTRIPE_WEBHOOK_SECRET="${endpoint.secret}"\nAWP_DOOR_PIN="${doorPin}"\n`);

  console.log("\n✓ Done. Redeploy to pick up the new env vars.");
  console.log(`\n  DOOR PIN (give this to door staff): ${doorPin}\n`);
}

main().catch((err) => {
  console.error("\n✗ Failed:", err.message);
  process.exit(1);
});
