// Creates the All White R&B Rooftop ticket products + prices in Stripe,
// then writes their Price IDs into lib/stripe-price-ids.json.
// Run from the `site` folder:   node scripts/create-stripe-products.mjs
import Stripe from "stripe";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env.local");
const idsPath = join(here, "..", "lib", "stripe-price-ids.json");

function readKey() {
  let env = "";
  try { env = readFileSync(envPath, "utf8"); } catch { throw new Error(`Could not read ${envPath}`); }
  const m = env.match(/^STRIPE_SECRET_KEY=(.+)$/m);
  const key = m && m[1].trim();
  if (!key || key.startsWith("your_")) throw new Error("Set a real STRIPE_SECRET_KEY in site/.env.local first.");
  return key;
}

const EVENT = "Sat Jul 25, 2026 · 5 PM to 9 PM · Hyatt Place Downtown Tampa, 325 N Florida Ave, Tampa FL";

const TIERS = [
  { id: "earlybird", name: "All White R&B Rooftop · Early Bird GA",  amount: 2500,  desc: `First in · only 15 available · ${EVENT}` },
  { id: "ga",        name: "All White R&B Rooftop · General Admission", amount: 4000, desc: `The Pulse Experience · ${EVENT}` },
  { id: "vip",       name: "All White R&B Rooftop · VIP Lounge",     amount: 7500,  desc: `Priority entry + welcome drink · ${EVENT}` },
  { id: "founder",   name: "All White R&B Rooftop · Founder's Seat", amount: 15000, desc: `Only 5 available · seat at the DJ table · ${EVENT}` },
];

async function main() {
  const stripe = new Stripe(readKey());
  const mode = readKey().startsWith("sk_live_") ? "LIVE" : "TEST";
  console.log(`Creating products in Stripe (${mode} mode)...\n`);

  const ids = {};
  for (const t of TIERS) {
    const product = await stripe.products.create({
      name: t.name,
      description: t.desc,
      default_price_data: { currency: "usd", unit_amount: t.amount },
      metadata: { event: "All White R&B Rooftop", tier: t.id },
    });
    const priceId = typeof product.default_price === "string" ? product.default_price : product.default_price?.id;
    ids[t.id] = priceId;
    console.log(`  ✓ ${t.name}`);
    console.log(`      product ${product.id}  price ${priceId}  ($${(t.amount / 100).toFixed(2)})`);
  }

  writeFileSync(idsPath, JSON.stringify(ids, null, 2) + "\n");
  console.log(`\nWrote Price IDs to lib/stripe-price-ids.json`);
  console.log("Restart the dev server (or redeploy) to pick them up.");
}

main().catch((err) => { console.error("\n✗ Failed:", err.message); process.exit(1); });
