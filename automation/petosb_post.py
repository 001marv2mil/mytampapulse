"""
petosb_post.py — Repost viral pet reels from personality IG accounts
to @petoshealthyb using Apify scraping + Instagram Graph API.
"""

import argparse
import json
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Fix Windows console encoding for emoji
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# ── Config ───────────────────────────────────────────────────────────
TOKEN      = os.getenv("PETOSB_PAGE_ACCESS_TOKEN")
ACCT       = os.getenv("PETOSB_IG_ACCOUNT_ID", "17841452172388421")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")

GRAPH      = "https://graph.facebook.com/v25.0"
APIFY_ACTOR = "apify~instagram-reel-scraper"   # FREE actor (~0.003 CU vs $1/run)
APIFY_BASE  = "https://api.apify.com/v2"

LOG_FILE          = Path(__file__).parent / "petosb_posted_log.json"
CACHE_FILE        = Path(__file__).parent / "petosb_reel_cache.json"
CACHE_MAX_AGE_H   = 24   # scrape fresh only if cache is older than this
RETENTION_DAYS    = 90
REPOST_WINDOW_DAYS = 30

# ── Target accounts — big rotating pool so content never repeats ────
# Mix of HIGH-VOLUME aggregators (post 3-10x/day, always have fresh reels)
# and active personality accounts. Each run picks 5 random.
TARGET_ACCOUNTS = list(set([
    # ── Aggregators / theme pages (post multiple reels daily) ──
    "dogsofinstagram", "puppies", "dogs",
    "goldenretrievers", "doglovers", "puppiesofinstagram",
    "dogsbeingbasic", "barked", "weratedogs",
    "catsofinstagram", "cats_of_instagram", "catloversclub",
    "kittens", "cats_of_world", "bestmeow", "meowed",
    "animalsdoingthings", "cute", "dailyfluff",
    "petsofinstagram", "cutepetclub", "cuteemergency",
    "fluffyoverload", "animals_video", "9gag.cute",
    "funnyanimals", "animalsco", "bestanimalvideos",
    # ── Dogs — active personality accounts ──
    "tuckerbudzyn", "reagandoodle", "crusoe_dachshund",
    "itsdougthepug", "mayapolarbear", "huskyx4",
    "bfrenchieworld", "goldenmalkiesmile", "samoyedbart",
    "coconutricebear", "mikithefrenchie",
    # ── Cats — active personality accounts ──
    "smoothiethecat", "cobythecat", "sukiicat",
    "pumpkinthecoon", "hosaborthecat",
    # ── Exotic / Wildlife / Mixed ──
    "juniper.foxx", "loki_the_wolfdog", "mr.pokee",
    "marutaro", "whatabirb", "bobaandco",
]))

# ── Caption templates (use \U escapes to avoid surrogate-pair bugs) ──
CAPTION_TEMPLATES = [
    "This just made our whole day \u2764\ufe0f\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "We can't stop watching this \U0001F602\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "Tag someone who needs to see this \U0001F447\n\U0001F3A5 Credit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "POV: pure serotonin \u2728\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "How is this even real \U0001F979\n\U0001F3A5 Credit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "Protect this precious baby at all costs \U0001F62D\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "If this doesn't make you smile, nothing will \U0001F60D\n\U0001F3A5 Credit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "We did NOT expect that ending \U0001F633\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "Main character energy \U0001F451\n\U0001F3A5 Credit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
    "Literally the cutest thing on the internet today \U0001FAE0\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #petoshealthyb",
]


# ═══════════════════════════════════════════════════════════════════
# POST LOG
# ═══════════════════════════════════════════════════════════════════

def load_log() -> list[dict]:
    if LOG_FILE.exists():
        try:
            return json.loads(LOG_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return []


def save_log(log: list[dict]):
    LOG_FILE.write_text(json.dumps(log, indent=2))


def prune_log(log: list[dict]) -> list[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
    return [e for e in log if e.get("timestamp", "") > cutoff]


def already_posted(log: list[dict], post_key: str) -> bool:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=REPOST_WINDOW_DAYS)).isoformat()
    return any(
        e["topic"] == post_key and e.get("timestamp", "") > cutoff
        for e in log
    )


# ═══════════════════════════════════════════════════════════════════
# APIFY SCRAPING
# ═══════════════════════════════════════════════════════════════════

def load_cache() -> tuple[list[dict], bool]:
    """Load cached reels. Returns (items, is_fresh)."""
    if CACHE_FILE.exists():
        try:
            data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
            cached_at = data.get("cached_at", "")
            items = data.get("items", [])
            if cached_at:
                age_h = (datetime.now(timezone.utc) - datetime.fromisoformat(cached_at)).total_seconds() / 3600
                if age_h < CACHE_MAX_AGE_H:
                    print(f"Using cached reels ({len(items)} items, {age_h:.1f}h old)")
                    return items, True
                print(f"Cache is {age_h:.1f}h old (limit {CACHE_MAX_AGE_H}h) — will scrape fresh")
            return items, False
        except (json.JSONDecodeError, OSError):
            pass
    return [], False


def save_cache(items: list[dict]):
    CACHE_FILE.write_text(json.dumps({
        "cached_at": datetime.now(timezone.utc).isoformat(),
        "items": items,
    }, ensure_ascii=False), encoding="utf-8")
    print(f"Cached {len(items)} reels to {CACHE_FILE.name}")


def scrape_reels(accounts: list[str]) -> list[dict]:
    """Scrape reels using free apify/instagram-reel-scraper. Uses cache if fresh."""
    cached_items, is_fresh = load_cache()
    if is_fresh:
        return cached_items

    all_items = []
    # Free actor takes one username array — scrape all at once
    run_url = (
        f"{APIFY_BASE}/acts/{APIFY_ACTOR}/runs"
        f"?token={APIFY_TOKEN}&waitForFinish=300"
    )
    payload = {
        "username": accounts,
        "resultsLimit": 15,  # per account
    }

    print(f"Starting Apify run for {len(accounts)} accounts: {', '.join(accounts)}...")
    resp = requests.post(run_url, json=payload, timeout=330)
    if not resp.ok:
        print(f"Apify error {resp.status_code}: {resp.text[:500]}")
    resp.raise_for_status()
    run_data = resp.json().get("data", {})

    dataset_id = run_data.get("defaultDatasetId")
    if not dataset_id:
        print("No dataset ID returned from Apify run.")
        return cached_items  # fallback to stale cache

    status = run_data.get("status")
    run_id = run_data.get("id")
    print(f"Apify run status: {status} | dataset: {dataset_id}")

    if status not in ("SUCCEEDED", "FINISHED") and run_id:
        for _ in range(60):
            time.sleep(10)
            check = requests.get(
                f"{APIFY_BASE}/actor-runs/{run_id}?token={APIFY_TOKEN}",
                timeout=30,
            )
            check.raise_for_status()
            status = check.json().get("data", {}).get("status")
            print(f"  polling... status: {status}")
            if status in ("SUCCEEDED", "FINISHED"):
                break
            if status in ("FAILED", "ABORTED", "TIMED-OUT"):
                print(f"Apify run ended with status: {status}")
                return cached_items

    items_url = (
        f"{APIFY_BASE}/datasets/{dataset_id}/items"
        f"?token={APIFY_TOKEN}&format=json"
    )
    items_resp = requests.get(items_url, timeout=60)
    items_resp.raise_for_status()
    all_items = items_resp.json()
    print(f"Fetched {len(all_items)} items from Apify dataset.")

    if all_items:
        save_cache(all_items)
    return all_items


# ═══════════════════════════════════════════════════════════════════
# FILTER & RANK CANDIDATES
# ═══════════════════════════════════════════════════════════════════

MAX_AGE_HOURS = 168  # repost reels from the last ~7 days (velocity scoring still favors freshest)
MIN_LIKES = 10       # skip reels with less than this — no dead content

def filter_candidates(items: list[dict], log: list[dict]) -> list[dict]:
    """Keep only fresh, high-engagement video reels not yet posted."""
    candidates = []
    now = datetime.now(timezone.utc)
    age_cutoff = now - timedelta(hours=MAX_AGE_HOURS)

    for item in items:
        # Only video (reel) posts
        if item.get("type") != "Video":
            continue

        video_url = item.get("videoUrl")
        if not video_url:
            continue

        # Note: dimensionsWidth/Height are thumbnail sizes, not video resolution.
        # Actual reel videos are typically 1080x1920 at the CDN URL.
        vid_w = item.get("dimensionsWidth", 0) or 0
        vid_h = item.get("dimensionsHeight", 0) or 0

        # Freshness check — skip reels older than MAX_AGE_HOURS
        posted_at = item.get("timestamp") or item.get("postedAt") or ""
        if posted_at:
            try:
                post_time = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                if post_time < age_cutoff:
                    continue
            except (ValueError, TypeError):
                pass  # if timestamp can't be parsed, allow it through

        post_id = item.get("shortCode") or item.get("id") or ""
        if not post_id:
            continue

        post_key = f"reel:{post_id}"
        if already_posted(log, post_key):
            continue

        likes    = item.get("likesCount", 0) or 0
        comments = item.get("commentsCount", 0) or 0

        # Skip low-engagement content — only repost stuff that's popping
        if likes < MIN_LIKES:
            continue

        raw_engagement = likes + comments * 3

        # Velocity score — engagement per hour since posting
        # Rewards reels that blew up fast (signals going viral)
        age_hours = 1  # default floor
        if posted_at:
            try:
                post_time = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                age_hours = max((now - post_time).total_seconds() / 3600, 0.5)
            except (ValueError, TypeError):
                pass
        velocity = raw_engagement / age_hours

        candidates.append({
            "post_id":    post_id,
            "post_key":   post_key,
            "video_url":  video_url,
            "username":   item.get("ownerUsername", "unknown"),
            "engagement": raw_engagement,
            "velocity":   round(velocity, 1),
            "age_hours":  round(age_hours, 1),
            "likes":      likes,
            "comments":   comments,
            "resolution": f"{vid_w}x{vid_h}" if vid_w and vid_h else "unknown",
            "caption":    (item.get("caption") or "")[:100],
        })

    # Sort by velocity (engagement per hour) — catches what's blowing up NOW
    candidates.sort(key=lambda c: c["velocity"], reverse=True)
    print(f"  Fresh reels (< {MAX_AGE_HOURS}h old): {len(candidates)}")
    return candidates[:5]


# ═══════════════════════════════════════════════════════════════════
# INSTAGRAM GRAPH API — PUBLISH REEL
# ═══════════════════════════════════════════════════════════════════

def sanitize_caption(text: str) -> str:
    """Strip surrogate characters that break UTF-8 encoding."""
    return text.encode("utf-8", errors="surrogatepass").decode("utf-8", errors="replace")


def rehost_video(video_url: str) -> str:
    """Download video from IG CDN and re-upload to catbox.moe for a public URL."""
    import tempfile
    print(f"Downloading video from CDN...")
    resp = requests.get(video_url, timeout=120, stream=True)
    resp.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        for chunk in resp.iter_content(chunk_size=8192):
            tmp.write(chunk)
        tmp_path = tmp.name

    size_mb = Path(tmp_path).stat().st_size / (1024 * 1024)
    print(f"  Downloaded {size_mb:.1f} MB -> {tmp_path}")

    print("Uploading to catbox.moe...")
    with open(tmp_path, "rb") as f:
        r = requests.post(
            "https://catbox.moe/user/api.php",
            data={"reqtype": "fileupload"},
            files={"fileToUpload": ("reel.mp4", f, "video/mp4")},
            timeout=120,
        )
    Path(tmp_path).unlink(missing_ok=True)

    if r.status_code == 200 and r.text.startswith("https://"):
        public_url = r.text.strip()
        print(f"  Rehosted: {public_url}")
        return public_url

    print(f"  Catbox upload failed: {r.status_code} {r.text[:200]}")
    return video_url  # fallback to original


def create_reel_container(video_url: str, caption: str) -> str | None:
    """Step 1: create a media container for the reel."""
    caption = sanitize_caption(caption)
    resp = requests.post(
        f"{GRAPH}/{ACCT}/media",
        data={
            "media_type": "REELS",
            "video_url": video_url,
            "caption": caption,
            "share_to_feed": "true",
            "access_token": TOKEN,
        },
        timeout=30,
    )
    if not resp.ok:
        print(f"IG API error {resp.status_code}: {resp.text[:500]}")
    resp.raise_for_status()
    container_id = resp.json().get("id")
    print(f"Created container: {container_id}")
    return container_id


def wait_for_processing(container_id: str, max_attempts: int = 30,
                        interval: int = 10) -> bool:
    """Step 2: poll until the container finishes processing."""
    for attempt in range(1, max_attempts + 1):
        time.sleep(interval)
        resp = requests.get(
            f"{GRAPH}/{container_id}",
            params={"fields": "status_code", "access_token": TOKEN},
            timeout=30,
        )
        resp.raise_for_status()
        status = resp.json().get("status_code")
        print(f"  poll {attempt}/{max_attempts}: {status}")
        if status == "FINISHED":
            return True
        if status == "ERROR":
            print("Container processing failed with ERROR status.")
            return False
    print("Timed out waiting for container to finish processing.")
    return False


def publish_reel(container_id: str) -> str | None:
    """Step 3: publish the processed reel."""
    resp = requests.post(
        f"{GRAPH}/{ACCT}/media_publish",
        data={
            "creation_id": container_id,
            "access_token": TOKEN,
        },
        timeout=30,
    )
    resp.raise_for_status()
    ig_id = resp.json().get("id")
    print(f"Published reel: {ig_id}")
    return ig_id


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Repost viral pet reels to @petoshealthyb"
    )
    parser.add_argument(
        "--preview", action="store_true",
        help="Print what would be posted without publishing",
    )
    parser.add_argument(
        "--max-age", type=int, default=None,
        help="Override MAX_AGE_HOURS (e.g. --max-age 168 for 7 days)",
    )
    args = parser.parse_args()

    if args.max_age:
        global MAX_AGE_HOURS
        MAX_AGE_HOURS = args.max_age
        print(f"[override] MAX_AGE_HOURS = {MAX_AGE_HOURS}")

    if not TOKEN or not APIFY_TOKEN:
        print("Missing PETOSB_PAGE_ACCESS_TOKEN or APIFY_API_TOKEN in env.")
        exit(1)

    # Pick 12 random accounts per run for reliable coverage
    sample = random.sample(TARGET_ACCOUNTS, min(12, len(TARGET_ACCOUNTS)))
    print(f"=== PETOSHEALTHYB REEL REPOSTER ===")
    print(f"Selected accounts: {', '.join('@'+a for a in sample)}")

    # Scrape reels via Apify (one run, all accounts)
    items = scrape_reels(sample)
    if not items:
        print("No fresh reels found -- skipping")
        exit(0)

    # Filter and rank by engagement
    log = prune_log(load_log())
    candidates = filter_candidates(items, log)
    if not candidates:
        print("No fresh reels found -- skipping")
        exit(0)

    # Pick the top candidate
    pick = candidates[0]
    caption = random.choice(CAPTION_TEMPLATES).format(username=pick["username"])

    print(f"\n--- Selected reel ---")
    print(f"  Account:    @{pick['username']}")
    print(f"  Post ID:    {pick['post_id']}")
    print(f"  Velocity:   {pick['velocity']} eng/hr (posted {pick['age_hours']}h ago)")
    print(f"  Engagement: {pick['engagement']} "
          f"(likes={pick['likes']}, comments={pick['comments']})")
    print(f"  Video URL:  {pick['video_url'][:80]}...")
    print(f"  Caption:    {caption[:80]}...")

    if args.preview:
        print("\n[preview mode] Would publish the reel above. Exiting.")
        exit(0)

    # ── Publish via IG Graph API ─────────────────────────────────────
    # IG CDN URLs are signed/restricted — rehost so Graph API can fetch
    public_url = rehost_video(pick["video_url"])
    container_id = create_reel_container(public_url, caption)
    if not container_id:
        print("Failed to create media container.")
        exit(1)

    if not wait_for_processing(container_id):
        print("Reel processing failed. Aborting.")
        exit(1)

    ig_id = publish_reel(container_id)
    if not ig_id:
        print("Failed to publish reel.")
        exit(1)

    # Log the post
    log.append({
        "topic":     pick["post_key"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ig_id":     ig_id,
    })
    save_log(log)
    print(f"\nDone. Reel published and logged.")


if __name__ == "__main__":
    main()
