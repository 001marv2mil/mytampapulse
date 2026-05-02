# Tampa Pulse — Path A Ad Campaign: Events Guide Lead Magnet

**Goal:** Replace the failed "WIN $100" giveaway ad with a lead-magnet-led campaign offering the free 60-Day Tampa Events Guide PDF.
**Why:** Cold strangers convert on instant value, not future giveaways. McGarry's playbook + your existing assets.
**Created:** May 2, 2026

---

## The Offer

**Lead magnet:** 60-Day Tampa Events Guide (PDF, hosted at `mytampapulse.com/events-guide.pdf`)
**Hook:** "Locals' picks. Not tourist traps."
**Conversion:** Email signup → instant PDF download → drip into weekly newsletter
**Referral payoff:** First referral unlocks Neighborhoods Guide + First-Timer's Guide (the existing 1-referral milestone)

---

## Creative Assets

**UGC set — Nano Banana Pro** (May 2, 2026, 4:5 aspect, generated at higgsfield.ai/ai/image?model=nano-banana-pro). Saved in `growth/ad-assets/`:

- `events-guide-ugc-v1.png` — Hand holding iPhone at Tampa Riverwalk, palm trees + people walking in background, Apple Watch wrist, golden hour **(RECOMMENDED)**
- `events-guide-ugc-v2.png` — Hand holding iPhone at Riverwalk boardwalk, people walking behind, phone at eye level
- `events-guide-ugc-v3.png` — Hand holding iPhone with Tampa downtown skyline in background, wooden dock **(STRONG ALTERNATE)**
- `events-guide-ugc-v4.png` — iPhone held at boardwalk railing, water + palm trees, golden hour, no hand visible

All 4: **candid POV style, looks like an Instagram story or friend's text, NOT product photography. Tampa Riverwalk backgrounds throughout.**

**Product set — Nano Banana Pro** (May 2, 2026, kept for reference): `events-guide-v1.png` through `v4.png`. These are polished editorial product shots (iPhone flat on wood table). Clean brand rendering but look like ads — use only if UGC set underperforms.

**Backup set — Seedream 4.5** (initial generation, kept for reference): `events-guide-seedream-v1.png` through `seedream-v4.png`. These have AI-generated fake editorial captions at the top — do not use without cropping.

**Recommended:** Use `events-guide-ugc-v1.png` as primary creative. Run `events-guide-ugc-v3.png` as the strongest A/B variant (Tampa skyline is unmistakable). Use `ugc-v2.png` and `ugc-v4.png` as additional variants.

---

## Copy Variants (test all 4)

### Variant A — "Just moved" hook
**Headline:**
Just moved to Tampa? Or lived here forever?

**Body:**
The free 60-day Tampa events guide. Locals' picks, not tourist traps. Sent every Thursday in Tampa Pulse.

**CTA:** Get the guide free →
**Primary text (above creative):** Every Thursday I send Tampa's best-kept secrets to locals who actually go out. Tonight you get the next 60 days as a free PDF.

---

### Variant B — "Tonight" hook
**Headline:**
What's actually happening in Tampa this weekend?

**Body:**
60 days of events. Free PDF. No tourist trap recs. Subscribe to Tampa Pulse and it's in your inbox in 10 seconds.

**CTA:** Download free →
**Primary text:** I'm Marv. I write Tampa Pulse, the weekly newsletter Tampa locals actually open. Free 60-day events guide for new subscribers — instant download, no spam.

---

### Variant C — "Insider" hook
**Headline:**
The Tampa events calendar locals actually use.

**Body:**
60 days of concerts, openings, and weekend plans. Free PDF for new subscribers to Tampa Pulse.

**CTA:** Get the calendar →
**Primary text:** Free Tampa events calendar (60 days). Built from the same source I write the weekly newsletter from. Subscribe and download instantly.

---

### Variant D — "Avoid the tourist trap" hook
**Headline:**
Skip the tourist traps. Get the locals' calendar.

**Body:**
60 days of real Tampa events from Tampa Pulse. Free PDF on signup.

**CTA:** Download free →
**Primary text:** The Tampa events newsletter for people who actually live here. Subscribe and get the 60-day events PDF instantly. Free, no spam, unsubscribe anytime.

---

## Campaign Settings (Meta Ads Manager)

| Setting | Value | Why |
|---------|-------|-----|
| Campaign objective | **Leads** (or **Engagement → Conversions**) | Optimize for email signups |
| Conversion location | **Website** (NOT Instant Forms) | Send traffic to landing page, capture email there |
| Conversion event | **Lead** (custom event on form submit) | Match what Supabase logs |
| Daily budget | **$10/day minimum** | Lower budgets throttle delivery (was the killer last run) |
| Audience | **Broad Tampa** — Tampa MSA, age 25-45, no narrow interests | Avoid over-targeting |
| Placements | **IG Feed + IG Reels + FB Feed** only (no Audience Network) | Highest-quality placements only |
| Advantage+ creative enhancements | **OFF** (per memory) | Don't let Meta remix your creative |
| Optimize text per person | **OFF** (per memory) | Keep your copy intact |
| Frequency cap | **3-5 per person** | Cold strangers need 3-7 exposures to act |
| A/B test | **Variants A vs B vs C vs D** at $5/day each | Find the winning hook fast |

---

## Landing Page Requirements

The landing page (`mytampapulse.com` or a dedicated `/events-guide`) needs:

1. **Match the ad headline word-for-word** (scent matching, no surprise)
2. **Single email field + button** ("Get the guide" — not "Subscribe")
3. **Above-the-fold preview** of what's in the guide (3-4 event thumbnails)
4. **Instant PDF delivery** — auto-email the PDF on signup, also redirect to a thank-you page with download link
5. **No nav, no other CTAs** — single conversion goal
6. **Trust signals** — "Free. No spam. Unsubscribe anytime." + tiny privacy link

---

## Success Metrics — Read After 7 Days

| Metric | Threshold | If lower |
|--------|-----------|----------|
| **CPC** | <$0.80 | Creative is weak — swap Higgsfield variant |
| **CTR** | >1.5% | Hook isn't working — swap variant |
| **Landing page conv rate** | >15% | Landing page or offer broken — fix copy match |
| **Cost per lead** | <$2 | If higher, kill and rethink |
| **Total signups (7 days @ $10/day = $70)** | >35 | If lower, the offer isn't strong enough at this price point |

---

## Next Steps

1. ☐ Crop top ~15% of `events-guide-v4.png` (the gibberish header) — or overlay real headline
2. ☐ Build final ad creative with text overlay (Python/PIL or hand off to designer)
3. ☐ Confirm landing page exists and matches ad headline
4. ☐ Confirm `events-guide.pdf` is current (60 days from May 1)
5. ☐ Set up Meta Pixel `Lead` event firing on form submit
6. ☐ Launch in Ads Manager: campaign objective = Leads, daily budget = $10, audience = broad Tampa
7. ☐ Set 7-day calendar reminder to review metrics

---

*Tampa Pulse — Path A campaign blueprint. Updated May 2, 2026.*
