"""
repost_reel.py — Curate and repost viral Tampa reels to @thetampapulse.

Two modes:
  --scrape   Run Apify once (10 AM), cache results to tampa_reel_cache.json
  (default)  Read cache, pick top unused reel, post it (2 PM, 4 PM, 7 PM)

One Apify scrape per day (~$0.25) instead of three (~$1.50). Cache is
read 3x to pick a fresh reel each time.
"""

import argparse
import json
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# ── Config ───────────────────────────────────────────────────────────
TOKEN      = os.getenv("INSTAGRAM_ACCESS_TOKEN")
ACCT       = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")

GRAPH      = "https://graph.facebook.com/v25.0"
APIFY_ACTOR = "apify~instagram-scraper"
APIFY_BASE  = "https://api.apify.com/v2"

LOG_FILE          = Path(__file__).parent / "tampa_repost_log.json"
CACHE_FILE        = Path(__file__).parent / "tampa_reel_cache.json"
ACCOUNTS_FILE     = Path(__file__).parent / "tampa_ig_accounts.json"
RETENTION_DAYS    = 90
REPOST_WINDOW_DAYS = 30

# ── Timezone gate ────────────────────────────────────────────────────
POST_HOURS  = {10, 19}  # 10 AM, 7 PM EST — scrape + post each run

def _tampa_hour():
    utc_now = datetime.now(timezone.utc)
    year = utc_now.year
    mar1 = datetime(year, 3, 1, tzinfo=timezone.utc)
    dst_start = mar1 + timedelta(days=(6 - mar1.weekday()) % 7 + 7)
    dst_start = dst_start.replace(hour=7)
    nov1 = datetime(year, 11, 1, tzinfo=timezone.utc)
    dst_end = nov1 + timedelta(days=(6 - nov1.weekday()) % 7)
    dst_end = dst_end.replace(hour=6)
    is_dst = dst_start <= utc_now < dst_end
    offset = timedelta(hours=-4 if is_dst else -5)
    return (utc_now + offset).hour

# Timezone gate is checked inside main() based on --scrape flag

# ── Load Tampa accounts from JSON ────────────────────────────────────
def load_accounts() -> list[str]:
    data = json.loads(ACCOUNTS_FILE.read_text())
    handles = []
    for entry in data:
        handle = entry["handle"].lstrip("@")
        handles.append(handle)
    return handles

TARGET_ACCOUNTS = load_accounts()
print(f"Loaded {len(TARGET_ACCOUNTS)} Tampa accounts")

# ── Content filters — keep content on-brand for Tampa Pulse ───────────
# Tampa Pulse is a local lifestyle/discovery brand. We only repost reels
# that showcase Tampa places, food, events, scenery, activities, etc.
# Filter out: politics, crime, personal drama, rants, gossip, talking-head
# commentary, relationship content, and anything not about Tampa itself.
EXCLUDED_WORDS = [
    # politics / crime
    'crime','politics','police','arrest','shooting','trump','biden','desantis',
    'republican','democrat','murder','killed','lawsuit','sued','robbery',
    'congressional','candidate','election','immigration','gun ',
    'missing person','dead body','indicted','convicted','abortion',
    # drama / gossip / rants / personal
    'drama','tea','rant','gossip','expose','toxic','cheating','situationship',
    'narcissist','red flag','storytime','story time','caught him','caught her',
    'he said','she said','no cap','fr fr','real talk','unpopular opinion',
    'hot take','controversial','receipts','spill','ick','delulu',
    'baby mama','baby daddy','side chick','side piece',
    # relationship / dating content
    'boyfriend','girlfriend','dating','breakup','broke up','my ex',
    'talking stage','roster','body count',
    # off-topic formats
    'grwm','get ready with me','outfit of the day','ootd','haul',
    'unboxing','asmr','mukbang','pov:',
]

def is_excluded(text: str) -> bool:
    t = text.lower()
    return any(x in t for x in EXCLUDED_WORDS)

# ── Positive filter — reel caption must reference a Tampa PLACE ────────
# We check CAPTION TEXT ONLY (not hashtags — every Tampa account tags
# #tampa on everything, even off-topic posts). Generic "tampa" alone
# doesn't count; the caption must mention a specific neighborhood,
# venue, landmark, or area to prove the video is actually about Tampa.
TAMPA_PLACE_KEYWORDS = [
    # neighborhoods / districts
    'ybor','ybor city','seminole heights','hyde park','south tampa',
    'channelside','water street','soho','palma ceia','davis island',
    'harbour island','new tampa','temple terrace','town n country',
    'westchase','carrollwood','citrus park','westshore','downtown tampa',
    'east tampa','west tampa','north tampa',
    # venues / landmarks
    'armature works','sparkman wharf','international plaza','oxford exchange',
    'raymond james','amalie arena','busch gardens','adventure island',
    'lowry park','curtis hixon','riverwalk','bayshore','gasparilla',
    'florida aquarium','mosi','tampa theatre','columbia restaurant',
    'berns steak','ulele','datz','jotoro','heights public market',
    'salt shack','whiskey joe','ricks on the river',
    # greater tampa bay area
    'st pete','st. pete','saint pete','clearwater','dunedin',
    'safety harbor','indian rocks','treasure island','madeira beach',
    'wesley chapel','lutz','land o lakes','oldsmar','palm harbor',
    'tarpon springs','apollo beach','ruskin','riverview','valrico',
    'plant city','lakeland','brandon','tampa bay','tampa fl',
    'hillsborough county','pinellas county','pasco county',
]

def is_tampa_related(caption_text: str) -> bool:
    """Check caption text only (NOT hashtags) for Tampa place references."""
    t = caption_text.lower()
    return any(kw in t for kw in TAMPA_PLACE_KEYWORDS)

# ── Caption templates — casual Tampa vibe with creator credit ────────
CAPTION_TEMPLATES = [
    # Clean & informational
    "Tampa Bay never disappoints.\n\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    "Another reason to love this city.\n\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    "This is what Tampa is all about.\n\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    "Tampa, through and through.\n\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    # Warm & conversational
    "Love seeing Tampa through local eyes.\n\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    "Moments like this are why we're here.\n\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    "The Bay Area at its finest.\n\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    "Hard to beat this city.\n\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    # Minimal — just credit + tags
    "\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
    "\U0001F3A5 @{username}\n\n#tampa #tampabay #tampaflorida #tampalife #thingstodointampa #TampaPulse",
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


def recently_used_accounts(log: list[dict], days: int = 7) -> set[str]:
    """Get accounts we reposted from in the last N days to space out reposts."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    return {
        e.get("username", "")
        for e in log
        if e.get("timestamp", "") > cutoff
    }


# ═══════════════════════════════════════════════════════════════════
# APIFY SCRAPING
# ═══════════════════════════════════════════════════════════════════

def scrape_reels(accounts: list[str]) -> list[dict]:
    """Run the Apify Instagram Scraper on account reels pages."""
    direct_urls = [f"https://www.instagram.com/{a}/reels/" for a in accounts]

    run_url = (
        f"{APIFY_BASE}/acts/{APIFY_ACTOR}/runs"
        f"?token={APIFY_TOKEN}&waitForFinish=300"
    )
    payload = {
        "directUrls": direct_urls,
        "resultsType": "posts",
        "resultsLimit": 200,
    }

    print(f"Starting Apify run for {len(accounts)} accounts...")
    resp = requests.post(run_url, json=payload, timeout=330)
    if not resp.ok:
        print(f"Apify error {resp.status_code}: {resp.text[:500]}")
    resp.raise_for_status()
    run_data = resp.json().get("data", {})

    dataset_id = run_data.get("defaultDatasetId")
    if not dataset_id:
        print("No dataset ID returned from Apify run.")
        return []

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
                return []

    items_url = (
        f"{APIFY_BASE}/datasets/{dataset_id}/items"
        f"?token={APIFY_TOKEN}&format=json"
    )
    items_resp = requests.get(items_url, timeout=60)
    items_resp.raise_for_status()
    items = items_resp.json()
    print(f"Fetched {len(items)} items from Apify dataset.")
    return items


# ═══════════════════════════════════════════════════════════════════
# FILTER & RANK CANDIDATES
# ═══════════════════════════════════════════════════════════════════

MAX_AGE_HOURS = 48   # prefer reels from last 2 days
MIN_LIKES     = 50   # higher bar than pet content — skip low-engagement stuff

def filter_candidates(items: list[dict], log: list[dict]) -> list[dict]:
    """Keep only fresh, high-engagement video reels not yet posted."""
    candidates = []
    now = datetime.now(timezone.utc)
    age_cutoff = now - timedelta(hours=MAX_AGE_HOURS)
    recent_accounts = recently_used_accounts(log)

    for item in items:
        if item.get("type") != "Video":
            continue

        video_url = item.get("videoUrl")
        if not video_url:
            continue

        # Caption content filter — skip politics, crime, drama, etc.
        caption = item.get("caption") or ""
        if is_excluded(caption):
            continue

        # Positive filter — caption text must mention a Tampa place
        # (hashtags excluded — every Tampa account tags #tampa on everything)
        if not is_tampa_related(caption):
            continue

        # Freshness check
        posted_at = item.get("timestamp") or item.get("postedAt") or ""
        if posted_at:
            try:
                post_time = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                if post_time < age_cutoff:
                    continue
            except (ValueError, TypeError):
                pass

        post_id = item.get("shortCode") or item.get("id") or ""
        if not post_id:
            continue

        post_key = f"reel:{post_id}"
        if already_posted(log, post_key):
            continue

        username = item.get("ownerUsername", "unknown")

        likes    = item.get("likesCount", 0) or 0
        comments = item.get("commentsCount", 0) or 0
        plays    = item.get("videoPlayCount", 0) or 0

        if likes < MIN_LIKES:
            continue

        raw_engagement = likes + comments * 3

        # Velocity score — engagement per hour since posting
        age_hours = 1
        if posted_at:
            try:
                post_time = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                age_hours = max((now - post_time).total_seconds() / 3600, 0.5)
            except (ValueError, TypeError):
                pass
        velocity = raw_engagement / age_hours

        # Penalize accounts we reposted recently — spread the love
        if username in recent_accounts:
            velocity *= 0.3

        candidates.append({
            "post_id":    post_id,
            "post_key":   post_key,
            "video_url":  video_url,
            "username":   username,
            "engagement": raw_engagement,
            "velocity":   round(velocity, 1),
            "age_hours":  round(age_hours, 1),
            "likes":      likes,
            "comments":   comments,
            "plays":      plays,
            "caption":    caption[:100],
        })

    candidates.sort(key=lambda c: c["velocity"], reverse=True)
    print(f"  Fresh reels (< {MAX_AGE_HOURS}h, >= {MIN_LIKES} likes): {len(candidates)}")
    return candidates[:10]


# ═══════════════════════════════════════════════════════════════════
# INSTAGRAM GRAPH API — PUBLISH REEL
# ═══════════════════════════════════════════════════════════════════

def sanitize_caption(text: str) -> str:
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
    return video_url


def create_reel_container(video_url: str, caption: str) -> str | None:
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

def do_scrape(args):
    """Mode 1: Scrape Apify, cache ranked candidates to JSON."""
    if not APIFY_TOKEN:
        print("Missing APIFY_API_TOKEN in env.")
        sys.exit(1)

    sample = random.sample(TARGET_ACCOUNTS, min(args.sample_size, len(TARGET_ACCOUNTS)))
    print(f"\n=== SCRAPE MODE ===")
    print(f"Sampling {len(sample)} of {len(TARGET_ACCOUNTS)} accounts")

    items = scrape_reels(sample)
    if not items:
        print("No items returned from Apify — skipping")
        sys.exit(0)

    log = prune_log(load_log())
    candidates = filter_candidates(items, log)
    print(f"Caching {len(candidates)} candidates to {CACHE_FILE.name}")
    CACHE_FILE.write_text(json.dumps(candidates, indent=2))
    print("Scrape done.")


def do_post(args):
    """Mode 2: Read cache, pick top unused reel, publish."""
    if not TOKEN:
        print("Missing INSTAGRAM_ACCESS_TOKEN in env.")
        sys.exit(1)

    if not CACHE_FILE.exists():
        print(f"No cache file ({CACHE_FILE.name}) — run with --scrape first.")
        sys.exit(0)

    candidates = json.loads(CACHE_FILE.read_text())
    if not candidates:
        print("Cache is empty — no reels to post.")
        sys.exit(0)

    # Re-filter against the log so we don't repost something posted earlier today
    log = prune_log(load_log())
    posted_keys = {e["topic"] for e in log}
    fresh = [c for c in candidates if c["post_key"] not in posted_keys]
    if not fresh:
        print("All cached reels already posted — skipping.")
        sys.exit(0)

    pick = fresh[0]
    caption = random.choice(CAPTION_TEMPLATES).format(username=pick["username"])

    print(f"\n--- Selected reel ---")
    print(f"  Account:    @{pick['username']}")
    print(f"  Post ID:    {pick['post_id']}")
    print(f"  Velocity:   {pick['velocity']} eng/hr ({pick['age_hours']}h old)")
    print(f"  Engagement: {pick['engagement']} "
          f"(likes={pick['likes']}, comments={pick['comments']}, plays={pick['plays']})")
    print(f"  Video URL:  {pick['video_url'][:80]}...")
    print(f"  Caption:    {caption[:80]}...")

    if args.preview:
        print("\n[preview mode] Would publish the reel above. Exiting.")
        sys.exit(0)

    # Rehost and publish
    public_url = rehost_video(pick["video_url"])
    container_id = create_reel_container(public_url, caption)
    if not container_id:
        print("Failed to create media container.")
        sys.exit(1)

    if not wait_for_processing(container_id):
        print("Reel processing failed. Aborting.")
        sys.exit(1)

    ig_id = publish_reel(container_id)
    if not ig_id:
        print("Failed to publish reel.")
        sys.exit(1)

    log.append({
        "topic":     pick["post_key"],
        "username":  pick["username"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ig_id":     ig_id,
    })
    save_log(log)
    print(f"\nDone. Reel from @{pick['username']} published and logged.")


def main():
    parser = argparse.ArgumentParser(
        description="Repost trending Tampa reels to @thetampapulse"
    )
    parser.add_argument(
        "--scrape", action="store_true",
        help="Scrape mode: run Apify and cache results (no posting)",
    )
    parser.add_argument(
        "--preview", action="store_true",
        help="Print what would be posted without publishing",
    )
    parser.add_argument(
        "--max-age", type=int, default=None,
        help="Override MAX_AGE_HOURS (e.g. --max-age 168 for 7 days)",
    )
    parser.add_argument(
        "--sample-size", type=int, default=10,
        help="Number of accounts to sample per scrape (default 10)",
    )
    args = parser.parse_args()

    if args.max_age:
        global MAX_AGE_HOURS
        MAX_AGE_HOURS = args.max_age
        print(f"[override] MAX_AGE_HOURS = {MAX_AGE_HOURS}")

    # Timezone gate on GitHub Actions
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        h = _tampa_hour()
        if h not in POST_HOURS:
            print(f"Tampa hour is {h}, not a post hour {POST_HOURS}. Skipping.")
            sys.exit(0)
        print(f"Tampa hour is {h} — running {'scrape' if args.scrape else 'post'}.")

    if args.scrape:
        do_scrape(args)
    else:
        do_post(args)


if __name__ == "__main__":
    main()
