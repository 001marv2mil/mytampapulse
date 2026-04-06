import os, json, logging
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("event_aggregator")

SUPABASE_URL = "https://kxwhwlzvddgfjpzxnfso.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

log.info("?? Tampa Pulse Event Aggregation Starting")
log.info("?? Fetching Ticketmaster events...")

try:
    resp = requests.get("https://app.ticketmaster.com/discovery/v2/events.json", 
        params={"city": "Tampa", "apikey": os.getenv("TICKETMASTER_API_KEY"), "size": 50},
        timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        events = data.get("_embedded", {}).get("events", [])
        log.info(f"  ? Found {len(events)} Ticketmaster events")
    else:
        log.warning(f"  ?? Status {resp.status_code}")
except Exception as e:
    log.error(f"  ? Error: {str(e)}")

log.info("? Test complete")
