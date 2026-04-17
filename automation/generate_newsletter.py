"""
Tampa Pulse Newsletter Auto-Generator
Runs Wednesday 7PM — gathers content from 10+ sources, generates
the full weekly newsletter markdown in Marv's voice.

Sources:
  - Ticketmaster API (concerts, sports, family events)
  - Eventbrite API (community events, food festivals)
  - Creative Loafing Tampa (local arts, nightlife, culture)
  - Visit Tampa Bay (tourism events, official listings)
  - Tampa Bay Times (life & culture news)
  - Reddit r/tampa (community buzz, what people are talking about)
  - Reddit r/StPetersburgFL (St. Pete crossover content)
  - OpenWeather API (7-day forecast)

Output: content/newsletters/issue-{N}-{YYYY-MM-DD}.md
"""

import os, json, re, random, requests
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

# ── CONFIG ──────────────────────────────────────────────────────────

TM_KEY    = os.environ.get('TICKETMASTER_API_KEY', '')
EB_TOKEN  = os.environ.get('EVENTBRITE_API_TOKEN', '')
WEATHER_KEY = os.environ.get('OPENWEATHER_API_KEY', '')

NEWSLETTERS_DIR = Path(__file__).parent.parent / 'site' / 'content' / 'newsletters'
NEWSLETTERS_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

# ────────────────────────────────────────────────────────────────
# TOPIC BLOCKLIST — things we never cover (crime / politics / news)
# Per memory/feedback_marv_voice.md: "Never cover crime or politics — EVER"
#
# Two-tier matching:
#   1. EXCLUDED_SUBSTRINGS: case-insensitive substring match. Safe for
#      long/distinctive terms ("epstein", "desantis", "councilman").
#   2. EXCLUDED_WORD_REGEX: word-boundary match for short/ambiguous
#      tokens that would over-match as substrings — e.g. "ice" matches
#      "pr-ice", "serv-ice"; "elect" matches "Tampa Electric", "select".
#
# Real headlines that slipped past the previous list and drove this
# expansion (Issue 16, hand-cleaned):
#   • Jeffrey Epstein …
#   • Tampa City Councilman Carlson mayoral run
#   • Mayor Chopper Davis reelection
#   • Graham Nash ICE song
# ────────────────────────────────────────────────────────────────

EXCLUDED_SUBSTRINGS = [
    # People
    'trump', 'biden', 'obama', 'desantis', 'epstein',
    # Political roles
    'governor', 'senator', 'congressional', 'congressman', 'congresswoman',
    'councilman', 'councilwoman', 'councilmember', 'council member',
    'mayoral', 'attorney general', 'sheriff', 'deputy',
    # Political topics
    'politics', 'political', 'republican', 'democrat', 'rnc', 'dnc',
    'reelection', 'reelect', 're-elect', 'reelected', 're-election',
    'incumbent', 'campaign trail',
    'bill passes', 'bill signed', 'legislature', 'legislative',
    # Hot-button issues
    'immigration', 'abortion', 'religious', 'church',
    'charter school', 'canopy mitigation', 'tree canopy',
    # Crime & legal
    'crime', 'criminal', 'police', 'arrest',
    'shooting', 'shot dead', 'murder', 'murdered',
    'killed', 'dead body', 'homicide',
    'lawsuit', 'sued', 'indicted', 'convicted',
    'charged with', 'testify', 'testified', 'subpoena',
    'robbery', 'robbed', 'burglary', 'assault',
    'missing woman', 'missing person', 'missing man', 'missing child',
    # Disasters
    'fatal', 'accident', 'crash',
    # Meta
    'newsletter',
]

# Short/ambiguous tokens — substring match would over-fire, so use \b
EXCLUDED_WORD_REGEX = re.compile(
    r'\b(?:'
    r'ice|'                                          # ICE (agency); skips price/service
    r'(?:re-?)?elect(?:s|ed|ing|ion|ions)?|'         # elect/election/reelect; skips electric/select
    r'vote(?:s|d|r|rs)?|voting|'                     # vote/voting; skips devote
    r'candidates?|'
    r'running for|'                                  # phrase
    r'mayor(?:s)?|'                                  # standalone Mayor/Mayors
    r'gun(?:s|fire|man|men|shot)?|'                  # gun/gunfire; skips begun
    r'gop|'
    r'news\w*|'                                      # news/newscast/newsroom; skips renews
    r'deport(?:ed|ation|ations|ing)?|'
    r'border patrol'
    r')\b',
    re.IGNORECASE,
)

# Backwards-compat alias in case anything else imports it
EXCLUDED = EXCLUDED_SUBSTRINGS

def is_excluded(text):
    """True if ``text`` contains any blocklisted crime/politics/news term.

    Used as a single chokepoint at every source filter (events, Reddit,
    scraped pages) AND defensively when assembling the Digest, Hidden
    Gems, and Pro Tips sections — belt-and-suspenders against leaks.
    """
    if not text:
        return False
    low = text.lower()
    if any(term in low for term in EXCLUDED_SUBSTRINGS):
        return True
    if EXCLUDED_WORD_REGEX.search(text):
        return True
    return False

def clean(text):
    return re.sub(r'\s+', ' ', text).strip()

# ────────────────────────────────────────────────────────────────
# EVERGREEN TAMPA FALLBACK POOL
# Used when source filters strip a section under its target count
# (e.g. a politics-heavy news week guts the Digest). Rotates
# neighborhoods per memory/feedback_newsletter_variety.md so each
# issue still feels fresh — sampled randomly, not picked top-down.
# These are curated and trusted; they bypass is_excluded().
# ────────────────────────────────────────────────────────────────

EVERGREEN_FALLBACKS = [
    {'title': 'Bayshore Boulevard sunrise walk',
     'description': "Longest continuous sidewalk in the world. Get out before 7AM and you'll see why it's the city's favorite morning ritual."},
    {'title': 'Tampa Riverwalk by bike',
     'description': 'Rent a Coast Bike from any station and loop the 2.6 miles. Curtis Hixon to Water Works and back. Free parking at Curtis Hixon garage after 5PM.'},
    {'title': 'Seminole Heights food crawl',
     'description': "Hair of the Dog, Ella's, Rooster & The Till, The Independent. Three blocks, four food vibes, zero tourists."},
    {'title': 'Davis Islands village afternoon',
     'description': "1920s Mediterranean architecture, low-key cafés, the seaplane basin. One of Tampa's most overlooked neighborhoods."},
    {'title': 'Ybor City coffee tuck at Brew Bus',
     'description': 'Tucked into the brewery space — old Tampa charm with espresso that actually hits. Quietest morning spot in Ybor.'},
    {'title': 'Westshore Saturday farmers market',
     'description': 'Smaller and more local than Hyde Park — actual Tampa farmers, no tourist scene. 9AM to 1PM on Himes.'},
    {'title': 'Channelside public skate session',
     'description': "Tampa Bay Lightning's practice rink opens for public skate most afternoons. Yes, ice in Tampa. Weirdly fun."},
    {'title': 'Dunedin downtown weekend',
     'description': 'Easiest day trip from Tampa. Walkable downtown, three breweries within blocks, the Pinellas Trail running right through.'},
    {'title': 'St. Pete Pier at golden hour',
     'description': "Walk the pier, drink at Doc Ford's on the second floor, watch the sun drop behind downtown St. Pete."},
    {'title': 'Tarpon Springs sponge docks',
     'description': 'Real Greek food, real working boats, zero kitsch once you go two streets back from the water. Worth the drive.'},
    {'title': 'West Tampa Sandwich Shop',
     'description': 'The Cuban sandwich Tampa natives swear by. West Columbus Dr. Order it pressed and plain — nothing fancy.'},
    {'title': 'Carrollwood Village Park boardwalk',
     'description': 'Hidden boardwalk through the wetlands, playground the kids actually like. Under-the-radar weekend move for North Tampa.'},
    {'title': 'Howard Avenue restaurant block',
     'description': 'Old Meridian, Datz, On Swann, Ocean Prime. Four spots that define South Tampa dining, one walkable block.'},
    {'title': 'Hyde Park Village patio night',
     'description': "Timpano's patio, Buddy Brew espresso, Goody Goody for late-night burgers. Village vibe without the Wharf crowd."},
    {'title': 'Oldsmar Sunday flea market',
     'description': "The real one — not the tourist trap. Tampa old-timers shop here for plants, produce, weird vintage finds."},
    {'title': 'Safety Harbor pier at sunset',
     'description': 'Quiet little waterfront town a hop from Tampa. The pier, Bar Fly for cocktails, then back across the causeway as it gets dark.'},
]

def pad_with_evergreen(items, target, used_titles, formatter, source_label='evergreen'):
    """Top up an under-populated section with curated Tampa fallbacks.

    ``items`` is the in-progress list (already populated from real sources).
    ``formatter(item)`` shapes each evergreen dict into the section's line.
    ``used_titles`` tracks dedupe across the whole newsletter so the same
    fallback never appears twice in one issue.
    Picks randomly so two consecutive weeks don't pull the same fallbacks.
    """
    if len(items) >= target:
        return items
    pool = [e for e in EVERGREEN_FALLBACKS if e['title'] not in used_titles]
    if not pool:
        return items
    needed = target - len(items)
    picks = random.sample(pool, min(needed, len(pool)))
    for ev in picks:
        items.append(formatter(ev))
        used_titles.add(ev['title'])
        print(f'  [fallback] padded {source_label} with: {ev["title"]}')
    return items

# ═══════════════════════════════════════════════════════════════════
# SOURCE 1: TICKETMASTER — concerts, sports, family events
# ═══════════════════════════════════════════════════════════════════

def fetch_ticketmaster():
    if not TM_KEY:
        print('  [Ticketmaster] No API key — skipping')
        return []

    now = datetime.utcnow()
    # Get events for THIS Thursday through NEXT Wednesday
    start = now.strftime('%Y-%m-%dT00:00:00Z')
    end = (now + timedelta(days=8)).strftime('%Y-%m-%dT23:59:59Z')

    try:
        r = requests.get('https://app.ticketmaster.com/discovery/v2/events.json', params={
            'city': 'Tampa',
            'stateCode': 'FL',
            'apikey': TM_KEY,
            'size': 30,
            'sort': 'date,asc',
            'startDateTime': start,
            'endDateTime': end,
        }, timeout=15)

        if r.status_code != 200:
            print(f'  [Ticketmaster] Error: {r.status_code}')
            return []

        events = r.json().get('_embedded', {}).get('events', [])
        results = []

        for ev in events:
            name = ev.get('name', '')
            if not name or is_excluded(name):
                continue

            venues = ev.get('_embedded', {}).get('venues', [{}])
            venue = venues[0].get('name', '') if venues else ''
            date_str = ev.get('dates', {}).get('start', {}).get('localDate', '')
            time_str = ev.get('dates', {}).get('start', {}).get('localTime', '')

            friendly_date = ''
            friendly_time = ''
            day_of_week = ''
            if date_str:
                try:
                    dt = datetime.strptime(date_str, '%Y-%m-%d')
                    friendly_date = dt.strftime('%B %d')
                    day_of_week = dt.strftime('%A')
                except: friendly_date = date_str
            if time_str:
                try:
                    t = datetime.strptime(time_str, '%H:%M:%S')
                    friendly_time = t.strftime('%I:%M %p').lstrip('0')
                except: friendly_time = time_str

            prices = ev.get('priceRanges', [])
            price = ''
            if prices:
                low = prices[0].get('min', 0)
                high = prices[0].get('max', 0)
                if low and high: price = f'${int(low)}-${int(high)}'
                elif low: price = f'from ${int(low)}'

            genre = ''
            cls = ev.get('classifications', [{}])
            if cls:
                genre = cls[0].get('segment', {}).get('name', '')

            results.append({
                'source': 'Ticketmaster',
                'title': name,
                'venue': venue,
                'date': f'{day_of_week} {friendly_date}',
                'time': friendly_time,
                'price': price,
                'genre': genre,
                'category': 'events',
            })

        print(f'  [Ticketmaster] Found {len(results)} events')
        return results

    except Exception as e:
        print(f'  [Ticketmaster] Error: {e}')
        return []

# ═══════════════════════════════════════════════════════════════════
# SOURCE 2: EVENTBRITE — community events, food festivals
# ═══════════════════════════════════════════════════════════════════

def fetch_eventbrite():
    if not EB_TOKEN:
        print('  [Eventbrite] No API token — skipping')
        return []

    now = datetime.utcnow()
    start = now.strftime('%Y-%m-%dT00:00:00')
    end = (now + timedelta(days=8)).strftime('%Y-%m-%dT23:59:59')

    try:
        r = requests.get('https://www.eventbriteapi.com/v3/events/search/', params={
            'location.address': 'Tampa, FL',
            'location.within': '25mi',
            'start_date.range_start': start,
            'start_date.range_end': end,
            'sort_by': 'date',
            'expand': 'venue',
        }, headers={'Authorization': f'Bearer {EB_TOKEN}'}, timeout=15)

        if r.status_code != 200:
            print(f'  [Eventbrite] Error: {r.status_code}')
            return []

        events = r.json().get('events', [])
        results = []

        for ev in events[:20]:
            name = ev.get('name', {}).get('text', '')
            if not name or is_excluded(name):
                continue

            venue_name = ''
            venue_data = ev.get('venue', {})
            if venue_data:
                venue_name = venue_data.get('name', '')

            start_data = ev.get('start', {})
            date_str = start_data.get('local', '')[:10] if start_data else ''
            friendly_date = ''
            day_of_week = ''
            if date_str:
                try:
                    dt = datetime.strptime(date_str, '%Y-%m-%d')
                    friendly_date = dt.strftime('%B %d')
                    day_of_week = dt.strftime('%A')
                except: pass

            desc = clean(ev.get('description', {}).get('text', ''))[:150]

            results.append({
                'source': 'Eventbrite',
                'title': name,
                'venue': venue_name,
                'date': f'{day_of_week} {friendly_date}'.strip(),
                'description': desc,
                'category': 'events',
            })

        print(f'  [Eventbrite] Found {len(results)} events')
        return results

    except Exception as e:
        print(f'  [Eventbrite] Error: {e}')
        return []

# ═══════════════════════════════════════════════════════════════════
# SOURCE 3: REDDIT r/tampa + r/StPetersburgFL
# ═══════════════════════════════════════════════════════════════════

def fetch_reddit(subreddit='tampa'):
    try:
        r = requests.get(
            f'https://www.reddit.com/r/{subreddit}/hot.json?limit=25',
            headers={**HEADERS, 'User-Agent': 'TampaPulse/1.0'},
            timeout=15
        )
        if r.status_code != 200:
            print(f'  [Reddit r/{subreddit}] Error: {r.status_code}')
            return []

        posts = r.json().get('data', {}).get('children', [])
        results = []

        for post in posts:
            d = post.get('data', {})
            title = d.get('title', '')
            score = d.get('score', 0)
            num_comments = d.get('num_comments', 0)
            flair = d.get('link_flair_text', '')

            selftext = clean(d.get('selftext', ''))[:200]

            # Skip low engagement, stickied, excluded, or low-quality content
            if d.get('stickied'): continue
            if score < 30: continue
            if is_excluded(title): continue
            if is_excluded(selftext): continue
            if is_excluded(flair): continue
            # Skip generic questions, moving posts, rants
            skip_words = ['moving to tampa', 'thinking of moving', 'is tampa safe',
                         'how is tampa', 'visiting tampa', 'road rage', 'rant',
                         'unpopular opinion', 'does anyone else']
            if any(x in title.lower() for x in skip_words): continue

            results.append({
                'source': f'Reddit r/{subreddit}',
                'title': title,
                'description': selftext,
                'score': score,
                'comments': num_comments,
                'flair': flair or '',
                'category': 'community',
            })

        # Sort by engagement
        results.sort(key=lambda x: x['score'] + x['comments'], reverse=True)
        print(f'  [Reddit r/{subreddit}] Found {len(results)} hot posts')
        return results[:10]

    except Exception as e:
        print(f'  [Reddit r/{subreddit}] Error: {e}')
        return []

# ═══════════════════════════════════════════════════════════════════
# SOURCE 4: WEB SCRAPING — Creative Loafing, Visit TB, TB Times
# ═══════════════════════════════════════════════════════════════════

def scrape_page(url, name, selectors):
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f'  [{name}] Error: {r.status_code}')
            return []
    except Exception as e:
        print(f'  [{name}] Error: {e}')
        return []

    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print(f'  [{name}] beautifulsoup4 not installed — skipping')
        return []

    soup = BeautifulSoup(r.text, 'html.parser')
    results = []
    seen = set()

    for selector in selectors:
        for el in soup.select(selector)[:20]:
            title_el = el.find(['h1','h2','h3','h4']) if el.name not in ('a',) else el
            title = clean(title_el.get_text()) if title_el else ''
            if not title or title in seen or len(title) < 8: continue
            if is_excluded(title): continue
            seen.add(title)

            link_el = el.find('a') if el.name != 'a' else el
            href = link_el.get('href', '') if link_el else ''
            if href and not href.startswith('http'):
                from urllib.parse import urljoin
                href = urljoin(url, href)

            desc_el = el.find('p')
            desc = clean(desc_el.get_text())[:150] if desc_el else ''
            if is_excluded(desc): continue

            results.append({
                'source': name,
                'title': title,
                'description': desc,
                'url': href,
                'category': 'local',
            })
            if len(results) >= 8: break
        if len(results) >= 8: break

    print(f'  [{name}] Found {len(results)} items')
    return results

def fetch_creative_loafing():
    return scrape_page('https://www.cltampa.com/', 'Creative Loafing',
        ['article', '.story', '.card', 'h2 a', 'h3 a'])

def fetch_visit_tampa_bay():
    return scrape_page('https://www.visittampabay.com/events/', 'Visit Tampa Bay',
        ['.event', '.event-card', '.listing', 'article', '.item'])

def fetch_tampa_bay_times():
    return scrape_page('https://www.tampabay.com/life-culture/', 'Tampa Bay Times',
        ['article', '.story', '.card', 'h2 a', 'h3 a'])

# Venue + lifestyle scrapers — fill the gap when Ticketmaster/Eventbrite
# keys aren't set. Each hits a public events/calendar page using the same
# generic scrape_page() helper. Selectors are best-effort + fall through.

def fetch_tampa_theatre():
    return scrape_page('https://tampatheatre.org/calendar/', 'Tampa Theatre',
        ['.tribe-events-calendar-list__event', '.event', 'article',
         '.tribe-event', 'h3 a', 'h2 a'])

def fetch_straz_center():
    return scrape_page('https://www.strazcenter.org/Events', 'Straz Center',
        ['.event-card', '.event', 'article', '.show-card', 'h3 a', 'h2 a'])

def fetch_amalie_arena():
    return scrape_page('https://www.amaliearena.com/events', 'Amalie Arena',
        ['.event', '.eventItem', '.event-listing', 'article', 'h3 a', 'h2 a'])

def fetch_sparkman_wharf():
    return scrape_page('https://sparkmanwharf.com/events/', 'Sparkman Wharf',
        ['.event', '.event-card', 'article', '.tribe-events-calendar-list__event', 'h3 a', 'h2 a'])

def fetch_armature_works():
    return scrape_page('https://armatureworks.com/events/', 'Armature Works',
        ['.event', '.event-card', 'article', '.tribe-events-calendar-list__event', 'h3 a', 'h2 a'])

def fetch_hillsborough_arts():
    return scrape_page('https://hillsborougharts.org/events/', 'Hillsborough Arts',
        ['.event', '.event-card', 'article', '.tribe-events-calendar-list__event', 'h3 a', 'h2 a'])

def fetch_thats_so_tampa():
    return scrape_page('https://thatssotampa.com/', 'Thats So Tampa',
        ['article', '.post', '.story', 'h2 a', 'h3 a'])

def fetch_813_area():
    return scrape_page('https://www.813area.com/', '813area',
        ['article', '.event', '.story', 'h2 a', 'h3 a'])

def fetch_tampa_downtown():
    return scrape_page('https://www.tampasdowntown.com/all-events/', 'Tampa Downtown',
        ['.event', '.event-card', 'article', '.tribe-events-calendar-list__event', 'h3 a', 'h2 a'])

def fetch_tampa_bay_markets():
    return scrape_page('https://tampabaymarkets.com/', 'Tampa Bay Markets',
        ['.market', '.market-card', 'article', '.location', 'h2 a', 'h3 a'])

def fetch_unation():
    return scrape_page('https://www.unation.com/cities/tampa', 'UNATION',
        ['.event', '.event-card', 'article', 'h2 a', 'h3 a'])

# Aggregator that runs all venue scrapers and dedupes by title
def fetch_all_venues():
    """Hit every venue scraper and return a deduped event-shaped list."""
    venue_fns = [
        ('Tampa Theatre',     fetch_tampa_theatre),
        ('Straz Center',      fetch_straz_center),
        ('Amalie Arena',      fetch_amalie_arena),
        ('Sparkman Wharf',    fetch_sparkman_wharf),
        ('Armature Works',    fetch_armature_works),
        ('Hillsborough Arts', fetch_hillsborough_arts),
        ('Tampa Downtown',    fetch_tampa_downtown),
    ]
    seen, out = set(), []
    for name, fn in venue_fns:
        try:
            for item in fn():
                key = item['title'].strip().lower()
                if key in seen:
                    continue
                seen.add(key)
                # Reshape into the same dict the events pipeline expects.
                out.append({
                    'source':   item['source'],
                    'title':    item['title'],
                    'venue':    name,
                    'date':     '',
                    'time':     '',
                    'price':    '',
                    'genre':    '',
                    'category': 'events',
                    'url':      item.get('url', ''),
                })
        except Exception as e:
            print(f'  [{name}] aggregator error: {e}')
    print(f'  [Venues] aggregated {len(out)} unique items across {len(venue_fns)} sources')
    return out

# ═══════════════════════════════════════════════════════════════════
# SOURCE 5: WEATHER — OpenWeather 7-day forecast (or fallback)
# ═══════════════════════════════════════════════════════════════════

WEATHER_EMOJIS = {
    'clear': '☀️', 'clouds': '⛅', 'rain': '🌧️', 'drizzle': '🌦️',
    'thunderstorm': '⛈️', 'snow': '❄️', 'mist': '🌫️', 'fog': '🌫️',
}

def fetch_weather():
    if not WEATHER_KEY:
        print('  [Weather] No API key — using placeholder')
        return generate_placeholder_weather()

    try:
        r = requests.get('https://api.openweathermap.org/data/2.5/forecast/daily', params={
            'q': 'Tampa,FL,US',
            'cnt': 7,
            'units': 'imperial',
            'appid': WEATHER_KEY,
        }, timeout=10)

        if r.status_code != 200:
            print(f'  [Weather] Error: {r.status_code} — using placeholder')
            return generate_placeholder_weather()

        days = r.json().get('list', [])
        results = []
        for day in days:
            dt = datetime.fromtimestamp(day['dt'])
            main = day.get('weather', [{}])[0].get('main', 'Clear').lower()
            emoji = WEATHER_EMOJIS.get(main, '☀️')
            high = round(day.get('temp', {}).get('max', 85))
            low = round(day.get('temp', {}).get('min', 65))
            desc = day.get('weather', [{}])[0].get('description', 'sunny').capitalize()
            results.append({
                'day': dt.strftime('%a'),
                'emoji': emoji,
                'high': high,
                'low': low,
                'desc': desc,
            })

        print(f'  [Weather] Got {len(results)} day forecast')
        return results

    except Exception as e:
        print(f'  [Weather] Error: {e} — using placeholder')
        return generate_placeholder_weather()

def generate_placeholder_weather():
    """Generate realistic Tampa weather when API isn't available."""
    now = datetime.now()
    month = now.month
    # Seasonal Tampa temps
    if month in (12, 1, 2): base_high, base_low = 72, 54
    elif month in (3, 4, 5): base_high, base_low = 84, 65
    elif month in (6, 7, 8, 9): base_high, base_low = 91, 76
    else: base_high, base_low = 82, 63

    conditions = ['Sunny', 'Mostly sunny', 'Partly cloudy', 'Sunny, breezy',
                  'Morning fog, then sunny', '20% chance PM showers', 'Sunny']

    results = []
    for i in range(7):
        dt = now + timedelta(days=i+1)
        h = base_high + random.randint(-3, 3)
        l = base_low + random.randint(-3, 3)
        c = conditions[i % len(conditions)]
        emoji = '🌧️' if 'shower' in c.lower() else '⛅' if 'cloud' in c.lower() else '🌤️' if 'fog' in c.lower() else '☀️'
        results.append({'day': dt.strftime('%a'), 'emoji': emoji, 'high': h, 'low': l, 'desc': c})
    return results

# ═══════════════════════════════════════════════════════════════════
# NEWSLETTER GENERATOR — Marv's voice
# ═══════════════════════════════════════════════════════════════════

MARV_OPENERS = [
    "Alright Tampa, here's the deal.",
    "Tampa. Let's talk about this week.",
    "OK here's what's happening in the Bay this week.",
    "This week is stacked. Let me break it down.",
    "Tampa's got a lot going on this week. Here's what you need to know.",
    "Another week, another reason to love this city.",
    "The Bay is buzzing this week. Let's get into it.",
]

MARV_CLOSERS = [
    "That's the week. Pick your lane and go. Don't just scroll this and put your phone down. Actually go do something.\n\nSee you next Thursday.\n\nMarv 🚀",
    "Alright, that's everything. This city keeps delivering. Get out there and do something worth talking about.\n\nSee you next Thursday.\n\nMarv 🚀",
    "That's the rundown. Tampa doesn't slow down and neither should you. Go explore.\n\nSee you next Thursday.\n\nMarv 🚀",
    "That's the week, Tampa. Stop reading, start going. I'll be back Thursday with more.\n\nMarv 🚀",
]

PRO_TIPS_TEMPLATES = [
    "If you're going to {event}, get there early. It fills up fast.",
    "Pro move: park at {place} and walk. Skip the lot chaos.",
    "The {food_spot} is the sleeper pick this week. No line yet. That won't last.",
    "If you haven't been to the {area} in a while, this is the week to go back.",
]

def determine_issue_number():
    """Find the next issue number based on existing files."""
    existing = list(NEWSLETTERS_DIR.glob('issue-*.md'))
    if not existing:
        return 14  # default start
    nums = []
    for f in existing:
        m = re.search(r'issue-(\d+)', f.name)
        if m: nums.append(int(m.group(1)))
    return max(nums) + 1 if nums else 14

def generate_newsletter(events, reddit_posts, local_items, weather):
    """Generate the full newsletter markdown."""

    issue_num = determine_issue_number()
    now = datetime.now()
    # Thursday (publish date) to next Wednesday (coverage end)
    thu = now + timedelta(days=(3 - now.weekday()) % 7 + 1)  # next Thursday
    wed = thu + timedelta(days=6)
    date_range = f'{thu.strftime("%B %dth")} to {wed.strftime("%B %dth, %Y")}'
    issue_date = thu.strftime('%Y-%m-%d')

    # ── Combine all content ──
    # Defensive second-pass filter: source filters already strip the bulk,
    # but this guarantees nothing politics/crime touches downstream sections
    # even if a new scraper adds an unfiltered source later.
    def _clean(items):
        return [
            it for it in items
            if not is_excluded(it.get('title', ''))
            and not is_excluded(it.get('description', ''))
            and not is_excluded(it.get('venue', ''))
        ]
    all_events = _clean(events)[:12]
    top_reddit = _clean(reddit_posts)[:5]
    top_local = _clean(local_items)[:8]

    # ── Pick highlights for "This Week at a Glance" (top 7) ──
    glance_items = []
    for ev in all_events[:5]:
        line = ev['title']
        if ev.get('venue'): line += f' at {ev["venue"]}'
        if ev.get('date'): line += f'. {ev["date"]}'
        glance_items.append(line)
    for item in top_local[:2]:
        glance_items.append(item['title'])
    glance_items = glance_items[:7]

    # ── Pro Tip ──
    pro_tip = ''
    if all_events:
        top = all_events[0]
        pro_tip = f'The {top["title"]} is the big one this week. '
        if top.get('venue'):
            pro_tip += f'{top["venue"]} gets packed. '
        pro_tip += 'Get there early and grab your spot. Trust me on this one.'

    # ── Weather table ──
    weather_intro = "Classic Tampa week. Here's the breakdown."
    weather_table = '| Day | | High/Low | Conditions |\n|-----|---|----------|------------|\n'
    for w in weather[:7]:
        weather_table += f'| {w["day"]} | {w["emoji"]} | {w["high"]}°/{w["low"]}° | {w["desc"]} |\n'

    # Track every title used in the newsletter so evergreen padding never
    # collides with a real source item or duplicates across sections.
    used_titles = set()

    # ── Marv's Pro Tips (6 specific actionable tips) ──
    # Defensive is_excluded() pass: events/local items already filtered at
    # source, but this is the section that landed Issue 16's 4 bad picks.
    tips = []
    for ev in all_events[:6]:
        if is_excluded(ev.get('title', '')) or is_excluded(ev.get('venue', '')):
            continue
        tip = f'**{ev["title"]}**'
        if ev.get('venue'): tip += f' at {ev["venue"]}'
        if ev.get('date'): tip += f', {ev["date"]}'
        if ev.get('time'): tip += f' at {ev["time"]}'
        if ev.get('price'): tip += f'. {ev["price"]}'
        tip += '. Worth your time.'
        tips.append(tip)
        used_titles.add(ev['title'])
        if len([t for t in tips if 'Worth your time' in t]) >= 3: break
    for item in top_local[:6]:
        if is_excluded(item.get('title', '')) or is_excluded(item.get('description', '')):
            continue
        tip = f'**{item["title"]}**'
        if item.get('description'): tip += f'. {item["description"][:100]}'
        tips.append(tip)
        used_titles.add(item['title'])
        if len(tips) >= 6: break
    # Pad to ~5 tips minimum if politics/crime week wiped the local pool
    pad_with_evergreen(
        tips, target=5, used_titles=used_titles,
        formatter=lambda ev: f'**{ev["title"]}**. {ev["description"]}',
        source_label='pro tips',
    )

    # ── Digest (quick hits from all sources) ──
    digest_emojis = ['🔥', '🍽️', '🎵', '🎨', '🌟', '📍', '🎉', '🏟️']
    digest = []
    for i, item in enumerate(top_local + top_reddit):
        if item['title'] in used_titles: continue
        if is_excluded(item.get('title', '')): continue
        if is_excluded(item.get('description', '')): continue
        used_titles.add(item['title'])
        emoji = digest_emojis[len(digest) % len(digest_emojis)]
        line = f'{emoji} **{item["title"]}**'
        if item.get('description'):
            line += f'. {item["description"][:120]}'
        digest.append(line)
        if len(digest) >= 7: break
    # Pad to 5 minimum so Digest never goes hollow on a heavy-news week
    pad_with_evergreen(
        digest, target=5, used_titles=used_titles,
        formatter=lambda ev, _emojis=digest_emojis: (
            f'{_emojis[(len(digest)) % len(_emojis)]} **{ev["title"]}**. {ev["description"]}'
        ),
        source_label='digest',
    )

    # ── Hidden Gems (from Reddit buzz + local items) ──
    gems = []
    gem_emojis = ['🗝️', '🍳', '🛍️', '🎨', '🍕']
    gem_sources = [r for r in reddit_posts if r.get('score', 0) > 30][:5] + local_items[4:9]
    for item in gem_sources:
        if item['title'] in used_titles: continue
        if is_excluded(item.get('title', '')): continue
        if is_excluded(item.get('description', '')): continue
        used_titles.add(item['title'])
        emoji = gem_emojis[len(gems) % len(gem_emojis)]
        line = f'{emoji} **{item["title"]}**'
        if item.get('description'):
            line += f'. {item["description"][:120]}'
        gems.append(line)
        if len(gems) >= 5: break
    # Pad to 3 minimum — Hidden Gems is the section that most needs to feel full
    pad_with_evergreen(
        gems, target=3, used_titles=used_titles,
        formatter=lambda ev, _emojis=gem_emojis: (
            f'{_emojis[(len(gems)) % len(_emojis)]} **{ev["title"]}**. {ev["description"]}'
        ),
        source_label='hidden gems',
    )

    # ── Community Pick (from highest Reddit engagement) ──
    # Walk the list to find the first post that survives the blocklist —
    # belt-and-suspenders against a politics post slipping through r/tampa.
    community_pick = ''
    top_post = next(
        (p for p in reddit_posts
         if not is_excluded(p.get('title', ''))
         and not is_excluded(p.get('description', ''))),
        None,
    )
    if top_post:
        community_pick = f'''> This week's Community Pick comes from r/tampa where **{top_post["title"]}** is getting a lot of buzz ({top_post.get("score", 0)} upvotes, {top_post.get("comments", 0)} comments). {top_post.get("description", "")[:200]}
>
> *The kind of thing that reminds you Tampa's got a real community behind the scenes.*'''

    # ── Event Roundup (deduplicated) ──
    event_lines = []
    seen_events = set()
    for ev in all_events[:12]:
        if ev['title'] in seen_events: continue
        seen_events.add(ev['title'])
        line = f'📅 **{ev["title"]}**'
        if ev.get('date'): line += f', {ev["date"]}'
        if ev.get('time'): line += f', {ev["time"]}'
        if ev.get('venue'): line += f' @ {ev["venue"]}'
        if ev.get('price'): line += f'. {ev["price"]}'
        event_lines.append(line)
        if len(event_lines) >= 8: break

    # ── Build the newsletter ──
    opener = random.choice(MARV_OPENERS)
    closer = random.choice(MARV_CLOSERS)

    opening_para = f'''{opener} This week is {"stacked" if len(all_events) > 5 else "solid"}. '''
    if all_events:
        opening_para += f'We\'ve got {all_events[0]["title"]}'
        if len(all_events) > 1:
            opening_para += f', {all_events[1]["title"]}'
        if len(all_events) > 2:
            opening_para += f', and {all_events[2]["title"]}'
        opening_para += ' all happening in the next 7 days. '
    opening_para += 'Let me walk you through it.'

    md = f'''# Tampa Pulse
## The Bay, Simplified
### {date_range}

---

{opening_para}

---

### 💡 Pro Tip

> *{pro_tip}*

---

### This Week at a Glance

'''
    for i, item in enumerate(glance_items, 1):
        md += f'{i}. {item}\n'

    md += f'''
---

### 🌤️ Tampa's 7-Day Weather Whisper

{weather_intro}

{weather_table}
---

### 🎯 Marv's Tampa Pro Tips

'''
    for tip in tips:
        md += f'- {tip}\n'

    md += f'''
---

### 📋 Digest

'''
    for item in digest:
        md += f'- {item}\n'

    md += f'''
---

### 💎 Hidden Gems

'''
    for gem in gems:
        md += f'- {gem}\n'

    if community_pick:
        md += f'''
---

### ⭐ Community Pick

{community_pick}

'''

    md += f'''
---

### 🎉 What's Happenin'. Event Roundup

'''
    for ev in event_lines:
        md += f'- {ev}\n'

    md += f'''
---

{closer}

---

*Tampa Pulse. The Bay, Simplified.*
*Know someone who needs this? Share the Pulse: [your referral link]*
'''

    # Write to file
    filename = f'issue-{issue_num}-{issue_date}.md'
    filepath = NEWSLETTERS_DIR / filename
    filepath.write_text(md, encoding='utf-8')
    print(f'\n✅ Generated: {filename} ({len(md)} chars)')
    return filepath, issue_num

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def main():
    print('=' * 60)
    print('Tampa Pulse Newsletter Generator')
    print(f'Run at: {datetime.now().isoformat()}')
    print('=' * 60)

    # Gather from all sources
    print('\n── GATHERING CONTENT ──')

    print('\n[1/11] Ticketmaster events...')
    tm_events = fetch_ticketmaster()

    print('\n[2/11] Eventbrite events...')
    eb_events = fetch_eventbrite()

    print('\n[3/11] Venue scrapers (Tampa Theatre / Straz / Amalie / Sparkman / Armature / Hillsborough Arts / Tampa Downtown)...')
    venue_events = fetch_all_venues()

    print('\n[4/11] Reddit r/tampa...')
    reddit_tampa = fetch_reddit('tampa')

    print('\n[5/11] Reddit r/StPetersburgFL...')
    reddit_stpete = fetch_reddit('StPetersburgFL')

    print('\n[6/11] Creative Loafing Tampa...')
    cl_items = fetch_creative_loafing()

    print('\n[7/11] Visit Tampa Bay...')
    vtb_items = fetch_visit_tampa_bay()

    print('\n[8/11] Tampa Bay Times life & culture...')
    tbt_items = fetch_tampa_bay_times()

    print('\n[9/11] ThatsSoTampa lifestyle...')
    tst_items = fetch_thats_so_tampa()

    print('\n[10/11] 813area weekend guide...')
    a813_items = fetch_813_area()

    print('\n[11/11] Weather forecast...')
    weather = fetch_weather()

    # Combine events — paid APIs first (richer metadata), then venue scrapes
    all_events = tm_events + eb_events + venue_events
    all_reddit = reddit_tampa + reddit_stpete
    all_local = cl_items + vtb_items + tbt_items + tst_items + a813_items

    total = len(all_events) + len(all_reddit) + len(all_local)
    print(f'\n── TOTAL CONTENT: {total} items ──')
    print(f'  Events: {len(all_events)}  (TM:{len(tm_events)} EB:{len(eb_events)} Venues:{len(venue_events)})')
    print(f'  Reddit: {len(all_reddit)}')
    print(f'  Local:  {len(all_local)}  (CL:{len(cl_items)} VTB:{len(vtb_items)} TBT:{len(tbt_items)} TST:{len(tst_items)} 813:{len(a813_items)})')

    # Generate the newsletter
    print('\n── GENERATING NEWSLETTER ──')
    filepath, issue_num = generate_newsletter(all_events, all_reddit, all_local, weather)

    print(f'\n✅ Issue #{issue_num} ready at: {filepath}')
    print('Newsletter will be sent Thursday 8AM via Vercel cron.')
    print('DONE.')

if __name__ == '__main__':
    main()
