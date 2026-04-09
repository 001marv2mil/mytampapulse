"""
petos_post.py — Repost viral pet reels from personality IG accounts
to @petoshealth using Apify scraping + Instagram Graph API.

Same pipeline as petosb_post.py but for the @petoshealth account.
Posts cute, funny, wholesome pet moments (dogs, cats, turtles, etc.)
with credit to the original creator.
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
TOKEN       = os.getenv("PETOS_PAGE_ACCESS_TOKEN")
ACCT        = os.getenv("PETOS_IG_ACCOUNT_ID", "17841477725823500")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN")

GRAPH       = "https://graph.facebook.com/v25.0"
APIFY_ACTOR = "apify~instagram-reel-scraper"
APIFY_BASE  = "https://api.apify.com/v2"

LOG_FILE           = Path(__file__).parent / "petos_posted_log.json"
CACHE_FILE         = Path(__file__).parent / "petos_reel_cache.json"
CACHE_MAX_AGE_H    = 24
RETENTION_DAYS     = 90
REPOST_WINDOW_DAYS = 30

# ── Target accounts — cute, funny, wholesome pet creators ───────────
TARGET_ACCOUNTS = list(set([
    # ── Dogs ──
    "jelenavoegeli", "tuckerbudzyn", "reagandoodle",
    "mayapolarbear", "huskyx4", "bfrenchieworld",
    "goldenmalkiesmile", "samoyedbart", "coconutricebear",
    "mikithefrenchie", "crusoe_dachshund", "itsdougthepug",
    "louboutinanyc", "corgnelius", "mensweardog",
    "henrythecoloradodog", "goldenbearollie",
    "tuna_the_dog", "harlowandsage", "maboroshi_shiba",
    "sterlingd.archer", "winstonthewhitedog",
    "dalmatiantrail", "norbert", "oakleythedachshund",
    # ── Cats ──
    "smoothiethecat", "cobythecat", "sukiicat",
    "pumpkinthecoon", "hosaborthecat", "naborthecat",
    "hosico_cat", "albertbabycat", "nala_cat",
    "venmengwong", "juniperfoxx",
    # ── Exotic / Mixed cute ──
    "juniper.foxx", "loki_the_wolfdog", "mr.pokee",
    "marutaro", "bobaandco", "hedgehog_azuki",
    "jill.dill", "whatabirb", "the_blueboys",
    "peachycomet22", "trioverse_tales",
]))

# ── Caption templates ────────────────────────────────────────────────
CAPTION_TEMPLATES = [
    "This just made our whole day \u2764\ufe0f\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "We can't stop watching this \U0001F602\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "Tag someone who needs to see this \U0001F447\n\U0001F3A5 Credit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "POV: pure serotonin \u2728\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "How is this even real \U0001F979\n\U0001F3A5 Credit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "Protect this precious baby at all costs \U0001F62D\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "If this doesn't make you smile, nothing will \U0001F60D\n\U0001F3A5 Credit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "We did NOT expect that ending \U0001F633\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "Main character energy \U0001F451\n\U0001F3A5 Credit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
    "Literally the cutest thing on the internet today \U0001FAE0\nCredit: @{username}\n\n#petoshealth #cutepets #adorable #petsofinstagram #animallover #wholesome #funnypets",
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
    cached_items, is_fresh = load_cache()
    if is_fresh:
        return cached_items

    run_url = (
        f"{APIFY_BASE}/acts/{APIFY_ACTOR}/runs"
        f"?token={APIFY_TOKEN}&waitForFinish=300"
    )
    payload = {
        "username": accounts,
        "resultsLimit": 15,
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
        return cached_items

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

MAX_AGE_HOURS = 168
MIN_LIKES = 10

def filter_candidates(items: list[dict], log: list[dict]) -> list[dict]:
    candidates = []
    now = datetime.now(timezone.utc)
    age_cutoff = now - timedelta(hours=MAX_AGE_HOURS)

    for item in items:
        if item.get("type") != "Video":
            continue

        video_url = item.get("videoUrl")
        if not video_url:
            continue

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

        likes    = item.get("likesCount", 0) or 0
        comments = item.get("commentsCount", 0) or 0

        if likes < MIN_LIKES:
            continue

        raw_engagement = likes + comments * 3

        age_hours = 1
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
            "caption":    (item.get("caption") or "")[:100],
        })

    candidates.sort(key=lambda c: c["velocity"], reverse=True)
    print(f"  Fresh reels (< {MAX_AGE_HOURS}h old): {len(candidates)}")
    return candidates[:5]


# ═══════════════════════════════════════════════════════════════════
# INSTAGRAM GRAPH API — PUBLISH REEL
# ═══════════════════════════════════════════════════════════════════

def sanitize_caption(text: str) -> str:
    return text.encode("utf-8", errors="surrogatepass").decode("utf-8", errors="replace")


def rehost_video(video_url: str) -> str:
    import tempfile
    print("Downloading video from CDN...")
    resp = requests.get(video_url, timeout=120, stream=True)
    resp.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        for chunk in resp.iter_content(chunk_size=8192):
            tmp.write(chunk)
        tmp_path = tmp.name

    size_mb = Path(tmp_path).stat().st_size / (1024 * 1024)
    print(f"  Downloaded {size_mb:.1f} MB -> {tmp_path}")

    hosts = [
        ("catbox", lambda f: requests.post("https://catbox.moe/user/api.php",
            data={"reqtype": "fileupload"},
            files={"fileToUpload": ("reel.mp4", f, "video/mp4")}, timeout=120)),
        ("uguu.se", lambda f: requests.post("https://uguu.se/upload",
            files={"files[]": ("reel.mp4", f, "video/mp4")}, timeout=120)),
    ]

    for host_name, upload_fn in hosts:
        try:
            print(f"Uploading to {host_name}...")
            with open(tmp_path, "rb") as f:
                r = upload_fn(f)
            if host_name == "uguu.se":
                data = r.json()
                if data.get("success") and data.get("files"):
                    url = data["files"][0]["url"]
                    if url.startswith("https://"):
                        print(f"  Rehosted: {url}")
                        Path(tmp_path).unlink(missing_ok=True)
                        return url
                print(f"  [{host_name}] failed: {r.text[:120]}")
            else:
                if r.status_code == 200 and r.text.startswith("https://"):
                    url = r.text.strip()
                    print(f"  Rehosted: {url}")
                    Path(tmp_path).unlink(missing_ok=True)
                    return url
                print(f"  [{host_name}] failed: {r.status_code} {r.text[:120]}")
        except Exception as e:
            print(f"  [{host_name}] error: {e}")

    Path(tmp_path).unlink(missing_ok=True)
    print("  All upload hosts failed, using original CDN URL")
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

def main():
    parser = argparse.ArgumentParser(
        description="Repost viral pet reels to @petoshealth"
    )
    parser.add_argument("--preview", action="store_true",
                        help="Print what would be posted without publishing")
    parser.add_argument("--max-age", type=int, default=None,
                        help="Override MAX_AGE_HOURS")
    args = parser.parse_args()

    if args.max_age:
        global MAX_AGE_HOURS
        MAX_AGE_HOURS = args.max_age
        print(f"[override] MAX_AGE_HOURS = {MAX_AGE_HOURS}")

    if not TOKEN or not APIFY_TOKEN:
        print("Missing PETOS_PAGE_ACCESS_TOKEN or APIFY_API_TOKEN in env.")
        exit(1)

    sample = random.sample(TARGET_ACCOUNTS, min(12, len(TARGET_ACCOUNTS)))
    print("=== PETOSHEALTH REEL REPOSTER ===")
    print(f"Selected accounts: {', '.join('@'+a for a in sample)}")

    items = scrape_reels(sample)
    if not items:
        print("No fresh reels found -- skipping")
        exit(0)

    log = prune_log(load_log())
    candidates = filter_candidates(items, log)
    if not candidates:
        print("No fresh reels found -- skipping")
        exit(0)

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

    log.append({
        "topic":     pick["post_key"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ig_id":     ig_id,
    })
    save_log(log)
    print("\nDone. Reel published and logged.")


if __name__ == "__main__":
    main()
