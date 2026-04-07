"""
Tampa Pulse Instagram Auto-Poster
Posts 3x/day via GitHub Actions.

APPROACH: Scrape real Tampa news articles. Follow the link. Pull the actual
article text. Break it into 5 slides of real facts. Always fresh content.

Sources scraped:
  - Creative Loafing Tampa (cltampa.com)
  - Patch Tampa (patch.com/florida/tampa)
  - Tampa Bay Business Journal headlines
  - Reddit r/tampa (high-engagement local posts)
"""

import os, json, re, random, time, requests
from io import BytesIO
from pathlib import Path
from datetime import datetime, timedelta
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

W, H = 1080, 1350
PX    = os.environ['PEXELS_API_KEY']
TOKEN = os.environ['INSTAGRAM_ACCESS_TOKEN']
ACCT  = os.environ['INSTAGRAM_BUSINESS_ACCOUNT_ID']
OUT = Path('CAROUSEL_READY_TO_POST')
OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'): old.unlink()

LOG_FILE = Path(__file__).parent / 'posted_log.json'
PHOTO_LOG = Path(__file__).parent / 'used_photos.json'
REPOST_DAYS = 30  # never repeat a story within 30 days

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

EXCLUDED_WORDS = [
    'crime','politics','police','arrest','shooting','trump','biden','desantis',
    'republican','democrat','murder','killed','lawsuit','sued','robbery',
    'congressional','candidate','election','rnc','dnc','immigration',
    'gun ','missing person','missing woman','missing man','dead body',
    'indicted','convicted','attorney general','governor','senator',
    'border','abortion','religious','church','charter school',
]

SKIP_TITLES = [
    'best tampa bay events','best live music','happening april','happening march',
    'happening may','happening june','save & get','tickets now','meet the chefs',
    'all the best','hunky jesus','foxy mary','sponsored','advertisement',
]

# ═══════════════════════════════════════════════════════════════════
# POST TRACKER
# ═══════════════════════════════════════════════════════════════════

def load_log():
    if LOG_FILE.exists():
        try: return json.loads(LOG_FILE.read_text())
        except: pass
    return []

def save_log(log, topic, ig_id, photo_ids=None):
    log.append({'topic': topic, 'timestamp': datetime.utcnow().isoformat(), 'ig_id': str(ig_id)})
    cutoff = (datetime.utcnow() - timedelta(days=90)).isoformat()
    log = [e for e in log if e.get('timestamp', '') > cutoff]
    LOG_FILE.write_text(json.dumps(log, indent=2))
    # Track used photo IDs so we never reuse the same image
    if photo_ids:
        used = load_used_photos()
        for pid in photo_ids:
            used.append({'id': pid, 'timestamp': datetime.utcnow().isoformat()})
        # Keep 90 days of photo history
        used = [p for p in used if p.get('timestamp', '') > cutoff]
        PHOTO_LOG.write_text(json.dumps(used, indent=2))

def load_used_photos():
    if PHOTO_LOG.exists():
        try: return json.loads(PHOTO_LOG.read_text())
        except: pass
    return []

def get_used_photo_ids():
    return {p['id'] for p in load_used_photos()}

def recently_posted(log):
    cutoff = (datetime.utcnow() - timedelta(days=REPOST_DAYS)).isoformat()
    return {e['topic'] for e in log if e.get('timestamp', '') > cutoff}

# ═══════════════════════════════════════════════════════════════════
# SCRAPE NEWS ARTICLES — get title + link, then follow link for full text
# ═══════════════════════════════════════════════════════════════════

def clean(t):
    return re.sub(r'\s+', ' ', t).strip()

def is_excluded(text):
    t = text.lower()
    return any(x in t for x in EXCLUDED_WORDS) or any(x in t for x in SKIP_TITLES)

def scrape_article_text(url):
    """Follow an article link and extract the main body text."""
    try:
        time.sleep(3)  # respect rate limits between article fetches
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code == 429:
            print(f'    Rate limited, waiting 10s...')
            time.sleep(10)
            r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f'    HTTP {r.status_code}')
            return ''
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(r.text, 'html.parser')

        # Remove nav, header, footer, sidebar, scripts
        for tag in soup.select('nav, header, footer, aside, script, style, .ad, .sidebar, .comment'):
            tag.decompose()

        # Try common article body selectors
        body = None
        for sel in ['.article-body', '.entry-content', '.post-content', '.story-body',
                    'article .content', '.field-body', '[itemprop="articleBody"]',
                    '.post-body', 'article p', '.article p']:
            body = soup.select(sel)
            if body:
                break

        if not body:
            # Fallback: grab all paragraphs
            body = soup.select('p')

        paragraphs = []
        for p in body:
            text = clean(p.get_text())
            if len(text) > 40 and not is_excluded(text):
                paragraphs.append(text)

        return ' '.join(paragraphs[:10])  # first 10 paragraphs
    except Exception as e:
        print(f'    Article scrape error: {e}')
        return ''

def scrape_creative_loafing():
    """Get story titles + links from CL Tampa."""
    stories = []
    try:
        time.sleep(2)  # respect rate limits
        r = requests.get('https://www.cltampa.com/', headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f'  [CL Tampa] HTTP {r.status_code}')
            return stories
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(r.text, 'html.parser')
        seen = set()

        for el in soup.select('article a[href], h2 a[href], h3 a[href], .card a[href]')[:30]:
            title = clean(el.get_text())
            href = el.get('href', '')

            if not title or title in seen or len(title) < 15: continue
            if is_excluded(title): continue
            seen.add(title)

            if href and not href.startswith('http'):
                href = 'https://www.cltampa.com' + href

            stories.append({'title': title, 'url': href, 'source': 'Creative Loafing'})
            if len(stories) >= 8: break

        print(f'  [CL Tampa] {len(stories)} article links found')
    except Exception as e:
        print(f'  [CL Tampa] Error: {e}')
    return stories

def scrape_stpete_catalyst():
    """Get stories from St Pete Catalyst — reliable, rich local content."""
    stories = []
    try:
        r = requests.get('https://stpetecatalyst.com/', headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return stories
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(r.text, 'html.parser')
        seen = set()

        for a in soup.select('a[href]')[:80]:
            href = a.get('href', '')
            title = clean(a.get_text())
            if href in seen or not title or len(title) < 20 or len(title) > 120: continue
            if 'stpetecatalyst.com' not in href: continue
            if any(x in href for x in ['/category/', '/tag/', '/author/', '/events/', '/market-property/',
                                        '/hustle/', '/partner/', '/podcast', '/start-supporting', '/zaps/']): continue
            # Strip Catalyst prefixes like "Thrive2 days ago", "Know5 hours ago"
            title = re.sub(r'^(Thrive|Know|Create|Comm Voice|The Market|Impact|Venture|Partner Stor\w*)\s*\d*\s*(hours?|days?|weeks?|months?|years?)\s*ago\s*', '', title).strip()
            # Keep only the main headline (first sentence), strip subtitles
            # Protect abbreviations first
            _t = title
            for abbr in ['St.', 'Dr.', 'Ave.', 'Blvd.', 'Jr.', 'Sr.', 'Mr.', 'Mrs.', 'Inc.', 'U.S.']:
                _t = _t.replace(abbr, abbr.replace('.', '\x00'))
            if '. ' in _t and len(title) > 60:
                cut = _t.index('. ')
                title = title[:cut].strip()
            # Also try splitting on " The " or " A " mid-title (common subtitle pattern)
            for sep in [' The ', ' A new ', ' This ']:
                if sep in title and title.index(sep) > 25:
                    title = title[:title.index(sep)].strip()
                    break
            if not title or len(title) < 20: continue
            skip_titles = ['promote your', 'advertise', 'partner stor', 'subscribe', 'newsletter',
                          'about us', 'contact', 'support the', 'sponsor', 'pitch us']
            if any(x in title.lower() for x in skip_titles): continue
            if is_excluded(title): continue
            seen.add(href)
            stories.append({'title': title, 'url': href, 'source': 'St Pete Catalyst'})
            if len(stories) >= 10: break

        print(f'  [St Pete Catalyst] {len(stories)} article links found')
    except Exception as e:
        print(f'  [St Pete Catalyst] Error: {e}')
    return stories

def find_article_on_site(domain, title_fragment):
    """Visit a source's homepage and find the link matching a story title."""
    try:
        from bs4 import BeautifulSoup
        r = requests.get(domain, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, 'html.parser')
        # Match links whose text overlaps with the title
        title_words = set(title_fragment.lower().split()[:6])
        for a in soup.select('a[href]')[:80]:
            link_text = clean(a.get_text()).lower()
            link_words = set(link_text.split())
            overlap = len(title_words & link_words)
            if overlap >= 3 and len(link_text) > 15:
                href = a.get('href', '')
                if not href.startswith('http'):
                    href = domain.rstrip('/') + '/' + href.lstrip('/')
                if len(href) > len(domain) + 5:  # must be more than just the domain
                    return href
    except:
        pass
    return None

def scrape_google_news_tampa():
    """Get Tampa stories from Google News RSS — resolves actual article URLs."""
    stories = []
    try:
        import xml.etree.ElementTree as ET
        r = requests.get(
            'https://news.google.com/rss/search?q=Tampa+Florida+development+OR+opening+OR+restaurant+OR+project+OR+million+OR+rezoning+OR+permit+OR+construction&hl=en-US&gl=US&ceid=US:en',
            headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return stories

        root = ET.fromstring(r.text)
        for item in root.findall('.//item')[:40]:
            title_el = item.find('title')
            source_el = item.find('source')
            if title_el is None or source_el is None: continue

            title = clean(title_el.text or '')
            source_url = source_el.get('url', '')
            source_name = source_el.text or ''

            # Strip " - Source Name" from title
            if ' - ' in title:
                title = title.rsplit(' - ', 1)[0].strip()

            if len(title) < 20 or len(title) > 120: continue
            if is_excluded(title): continue
            # Skip paywalled sources we can't scrape
            if any(x in source_url for x in ['tampabay.com', 'nytimes.com', 'wsj.com']): continue

            # Try to find the actual article URL on the source site
            article_url = find_article_on_site(source_url, title)
            if article_url:
                print(f'    Resolved: {article_url[:80]}')

            stories.append({
                'title': title,
                'url': article_url or source_url,
                'source': f'Google News ({source_name})',
            })
            if len(stories) >= 12: break

        print(f'  [Google News] {len(stories)} Tampa stories found')
    except Exception as e:
        print(f'  [Google News] Error: {e}')
    return stories

def scrape_reddit_tampa():
    """Get high-engagement r/tampa posts with actual content."""
    stories = []
    try:
        r = requests.get('https://www.reddit.com/r/tampa/hot.json?limit=25',
            headers={**HEADERS, 'User-Agent': 'TampaPulse/1.0'}, timeout=15)
        if r.status_code != 200:
            return stories

        for post in r.json().get('data', {}).get('children', []):
            d = post['data']
            title = d.get('title', '')
            score = d.get('score', 0)
            selftext = clean(d.get('selftext', ''))

            if d.get('stickied') or score < 50: continue
            if is_excluded(title) or is_excluded(selftext): continue
            skip = ['moving to','thinking of moving','is tampa safe','visiting tampa',
                    'road rage','rant','unpopular opinion','does anyone','what do you think',
                    'rehome','adopt','foster','lost cat','lost dog','found cat','found dog',
                    'roommate','room for rent','sublease','anyone know','anyone have',
                    'looking for','recommend','suggestion','where can i','help me',
                    'selling','for sale','free to','giving away','ISO ','in search of',
                    'saw this','spotted','TIL ','til ','today i learned']
            if any(x in title.lower() for x in skip): continue

            url = d.get('url', '')
            if not url.startswith('http'): url = ''

            stories.append({
                'title': title,
                'url': url,
                'source': 'Reddit r/tampa',
                'desc': selftext,
                'score': score,
            })

        print(f'  [Reddit] {len(stories)} posts found')
    except Exception as e:
        print(f'  [Reddit] Error: {e}')
    return stories

# ═══════════════════════════════════════════════════════════════════
# BUILD POST FROM ARTICLE — the core logic
# ═══════════════════════════════════════════════════════════════════

def extract_facts(text, n=8):
    """Pull the most interesting, UNIQUE sentences from article text."""
    # Protect abbreviations from being split
    protected = text
    for abbr in ['Dr.', 'St.', 'Ave.', 'Blvd.', 'Rd.', 'Jr.', 'Sr.', 'Mr.', 'Mrs.', 'Ms.',
                 'Inc.', 'Corp.', 'Ltd.', 'Co.', 'vs.', 'U.S.', 'a.m.', 'p.m.', 'No.', 'approx.']:
        protected = protected.replace(abbr, abbr.replace('.', '\x00'))
    sentences = [s.replace('\x00', '.').strip() for s in re.split(r'(?<=[.!?])\s+', protected) if len(s.strip()) > 30]
    # Filter out generic/boilerplate/fragment sentences
    skip = ['subscribe','sign up','click here','read more','advertisement',
            'cookie','privacy','terms','copyright','follow us','share this',
            'related:','also read','share on','tweet this','email this',
            'however,','but ','although ','meanwhile','nonetheless']
    frag_starts = [',', ';', 'and ', 'or ', 'but ', 'so ', 'yet ']
    good = []
    for s in sentences:
        sl = s.lower().strip()
        if any(x in sl for x in skip): continue
        if is_excluded(s): continue
        if any(sl.startswith(x) for x in frag_starts): continue  # skip fragments
        if len(s) < 35: continue  # too short to be a real fact
        good.append(s)

    # Deduplicate: skip sentences that share >50% of words with one already picked
    unique = []
    for s in good:
        s_words = set(s.lower().split())
        is_dup = False
        for picked in unique:
            p_words = set(picked.lower().split())
            overlap = len(s_words & p_words)
            if overlap / max(len(s_words), 1) > 0.4:
                is_dup = True
                break
        if not is_dup:
            unique.append(s)
        if len(unique) >= n:
            break

    # Prioritize sentences with numbers/specifics (dollar amounts, dates, addresses)
    scored = []
    for s in unique:
        score = 0
        if re.search(r'\$[\d,.]+', s): score += 3  # dollar amounts
        if re.search(r'\d{3,}', s): score += 2     # big numbers
        if re.search(r'\d+[,-]\d+', s): score += 1 # addresses, ranges
        if re.search(r'(million|billion|thousand)', s.lower()): score += 3
        if re.search(r'(street|avenue|boulevard|drive|road|blvd|ave|st\.)', s.lower()): score += 2
        if re.search(r'(open|launch|debut|announce|approve|build)', s.lower()): score += 1
        scored.append((score, s))
    scored.sort(key=lambda x: -x[0])

    return [s for _, s in scored[:n]]

def shorten_fact(text):
    """Turn a full article sentence into a punchy slide headline (max ~12 words).
    Keeps the most important part — numbers, names, addresses."""
    # Already short enough
    words = text.split()
    if len(words) <= 12:
        return text

    # Try to find a natural break point (comma, dash, period)
    for sep in [', ', ' — ', ' - ', '; ']:
        if sep in text:
            parts = text.split(sep)
            # Take the part with the most numbers/specifics
            best = max(parts, key=lambda p: len(re.findall(r'\d', p)) + len(p.split()) * 0.1)
            if 4 <= len(best.split()) <= 14:
                return best.strip().rstrip('.,;')

    # Fallback: just take first 12 words
    return ' '.join(words[:12]).rstrip('.,;')

def wrap_text(text, max_words=14):
    """Wrap text into 2-3 lines for slide headline."""
    words = text.split()
    if len(words) > max_words:
        words = words[:max_words]
    if len(words) <= 4:
        return ' '.join(words)
    if len(words) <= 8:
        h = len(words) // 2
        return ' '.join(words[:h]) + '\n' + ' '.join(words[h:])
    t = len(words) // 3
    t2 = t * 2
    return ' '.join(words[:t]) + '\n' + ' '.join(words[t:t2]) + '\n' + ' '.join(words[t2:])

def photo_query_for(text, slide_num=0):
    """Photo query based on content keywords. Each slide_num gets variety."""
    t = text.lower()
    # Each category has multiple queries so consecutive slides don't get the same photo
    food_queries = [
        'restaurant interior warm lighting dining',
        'fresh bakery bread pastries display counter',
        'chef kitchen cooking preparation food',
        'outdoor patio dining cafe warm evening',
        'deli counter fresh ingredients market display',
    ]
    hotel_queries = [
        'luxury hotel lobby modern architecture interior',
        'hotel rooftop pool city skyline view',
        'boutique hotel room modern design',
    ]
    beach_queries = [
        'florida beach sunset golden hour waves',
        'pier ocean sunrise coastal boardwalk',
        'gulf coast beach palm trees tropical',
    ]
    construction_queries = [
        'construction crane city development modern building',
        'architectural rendering modern mixed use building',
        'urban development cityscape progress aerial',
        'modern building exterior glass steel architecture',
    ]
    bar_queries = [
        'craft cocktail bar modern interior dim lighting',
        'brewery taproom industrial interior beer flight',
        'rooftop bar city view evening nightlife',
    ]
    art_queries = [
        'art gallery modern exhibit white walls paintings',
        'colorful mural urban street art building wall',
        'museum interior exhibit contemporary art space',
    ]
    music_queries = [
        'live music concert outdoor stage crowd lights',
        'music venue interior stage neon atmospheric',
        'outdoor festival crowd sunset entertainment',
    ]
    sports_queries = [
        'sports stadium crowd arena night game lights',
        'baseball stadium field game crowd',
        'football stadium aerial view urban sports',
    ]
    realestate_queries = [
        'modern luxury condo building exterior architecture',
        'residential neighborhood houses aerial view',
        'waterfront property modern design city view',
    ]
    park_queries = [
        'city park green trees walking path people',
        'botanical garden tropical plants sunshine',
        'waterfront park boardwalk skyline view',
    ]
    retail_queries = [
        'new store grand opening modern storefront',
        'retail shop interior design modern display',
        'commercial building exterior new business sign',
    ]

    idx = slide_num % 5  # rotate through options

    if any(w in t for w in ['restaurant','food','chef','menu','bakery','bread','brunch','taco','pizza','sushi','deli','cuban']):
        return food_queries[idx % len(food_queries)]
    if any(w in t for w in ['hotel','resort','hospitality','lodging']):
        return hotel_queries[idx % len(hotel_queries)]
    if any(w in t for w in ['beach','sand','pier','coast','gulf','clearwater']):
        return beach_queries[idx % len(beach_queries)]
    if any(w in t for w in ['construction','build','develop','million','billion','project','approved']):
        return construction_queries[idx % len(construction_queries)]
    if any(w in t for w in ['bar','cocktail','brewery','beer','drink','nightlife','club']):
        return bar_queries[idx % len(bar_queries)]
    if any(w in t for w in ['art','gallery','museum','exhibit','mural','paint']):
        return art_queries[idx % len(art_queries)]
    if any(w in t for w in ['concert','music','festival','band','dj','live']):
        return music_queries[idx % len(music_queries)]
    if any(w in t for w in ['sport','stadium','rays','lightning','bucs','game','arena']):
        return sports_queries[idx % len(sports_queries)]
    if any(w in t for w in ['home','house','real estate','market','property','condo']):
        return realestate_queries[idx % len(realestate_queries)]
    if any(w in t for w in ['park','garden','trail','outdoor','nature','tree']):
        return park_queries[idx % len(park_queries)]
    if any(w in t for w in ['shop','store','retail','open','business','new']):
        return retail_queries[idx % len(retail_queries)]

    fallback = [
        'tampa florida skyline sunset aerial waterfront',
        'tampa bay riverwalk city urban modern',
        'downtown tampa street view buildings palms',
        'tampa city lights evening urban scenic',
        'florida city aerial view modern development',
    ]
    return fallback[idx % len(fallback)]

def detect_neighborhood(text):
    """Detect Tampa neighborhood from article text."""
    neighborhoods = {
        'downtown tampa': 'Downtown Tampa', 'downtown': 'Downtown Tampa',
        'ybor city': 'Ybor City', 'ybor': 'Ybor City',
        'south tampa': 'South Tampa', 'soho': 'South Tampa',
        'hyde park': 'Hyde Park', 'bayshore': 'Bayshore',
        'channelside': 'Channelside', 'harbour island': 'Harbour Island',
        'westshore': 'Westshore', 'dale mabry': 'Dale Mabry',
        'seminole heights': 'Seminole Heights', 'tampa heights': 'Tampa Heights',
        'water street': 'Water Street', 'riverwalk': 'Riverwalk',
        'west tampa': 'West Tampa', 'palma ceia': 'Palma Ceia',
        'davis islands': 'Davis Islands', 'brandon': 'Brandon',
        'temple terrace': 'Temple Terrace', 'town n country': 'Town N Country',
        'carrollwood': 'Carrollwood', 'new tampa': 'New Tampa',
        'lutz': 'Lutz', 'usf': 'USF Area', 'busch gardens': 'Busch Gardens Area',
        'gasworx': 'Gasworx District', 'armature works': 'Armature Works',
        'north tampa': 'North Tampa', 'east tampa': 'East Tampa',
        'n ashley': 'Downtown Tampa', 'kennedy': 'Downtown Tampa',
    }
    t = text.lower()
    for key, name in neighborhoods.items():
        if key in t:
            return name
    return 'Tampa'

def build_post_from_article(story, article_text):
    """Build a 3-6 slide post in Tampa Tomorrow style.
    Format: | Name - Neighborhood | with escalating facts."""
    title = story['title']
    facts = extract_facts(article_text, n=8)
    neighborhood = detect_neighborhood(title + ' ' + article_text[:500])

    slides = []

    # Slide 1: Hook headline — Tampa Tomorrow style "| Name - Neighborhood |"
    slides.append({
        'headline': wrap_text(title),
        'photo_query': photo_query_for(title, 0),
        'is_last': False,
    })

    # Sort facts so they ESCALATE: smaller details first, big numbers last
    def fact_weight(f):
        w = 0
        if re.search(r'\$[\d,.]+\s*(million|billion)', f, re.I): w += 10
        elif re.search(r'\$[\d,.]+', f): w += 5
        if re.search(r'(million|billion)', f, re.I): w += 8
        if re.search(r'\d{4,}', f): w += 3  # big numbers
        if re.search(r'(acre|square.?f)', f, re.I): w += 4
        return w
    facts_sorted = sorted(facts, key=fact_weight)

    # Add fact slides — shorten to punchy headlines, escalate to big reveal
    max_fact_slides = min(len(facts_sorted), 5)
    for i, fact in enumerate(facts_sorted[:max_fact_slides]):
        headline = shorten_fact(fact)
        slides.append({
            'headline': wrap_text(headline),
            'photo_query': photo_query_for(fact, i + 1),
            'is_last': False,
        })

    # Cap at 6, floor at 3
    slides = slides[:6]
    slides[-1]['is_last'] = True

    # Topic key for dedup
    topic = f'news:{title[:60]}'

    # Caption — Tampa Tomorrow style: storytelling with bullet points
    caption = f"| {title[:60]} - {neighborhood} |\n\n"
    for f in facts_sorted[:max_fact_slides]:
        caption += f"\u2022 {f}\n"
    caption += "\nThis is what's happening in Tampa right now.\n"
    caption += "Save this. Tag someone who needs to see it.\n\n"
    caption += "Follow @thetampapulse for more.\n\n"
    caption += "#tampa #tampabay #tampalife #TampaPulse #tampaflorida #tampadevelopment"

    return {
        'location': neighborhood,
        'slides': slides,
        'caption': caption,
        'topic': topic,
    }

# ═══════════════════════════════════════════════════════════════════
# FONTS + PHOTO + RENDERER
# ═══════════════════════════════════════════════════════════════════

def ft(sz):
    for p in [
        '/usr/local/share/fonts/Oswald-Bold.ttf',
        '/usr/share/fonts/truetype/urw-base35/NimbusSans-Bold.otf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        'C:/Windows/Fonts/impact.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
    ]:
        try: return ImageFont.truetype(p, sz)
        except: pass
    return ImageFont.load_default()

_used_ids = get_used_photo_ids()
_session_ids = set()  # also track within this run so slides don't share photos

def get_photo(q):
    """Get a portrait photo from Pexels, never reusing one we've posted before."""
    r = requests.get('https://api.pexels.com/v1/search',
        headers={'Authorization': PX},
        params={'query': q, 'orientation': 'portrait', 'per_page': 30}, timeout=15)
    pics = r.json().get('photos', [])
    if not pics: return None
    # Filter out any photo we've used before (globally or this session)
    fresh = [p for p in pics if p['id'] not in _used_ids and p['id'] not in _session_ids]
    if not fresh:
        fresh = [p for p in pics if p['id'] not in _session_ids]  # at least avoid same session
    if not fresh:
        fresh = pics  # absolute fallback
    pick = random.choice(fresh[:10])
    _session_ids.add(pick['id'])
    url = pick['src']['large2x']
    img = Image.open(BytesIO(requests.get(url, timeout=30).content)).convert('RGBA')
    img.info['pexels_id'] = pick['id']  # store ID on the image for logging later
    return img

def fitimg(img):
    pw, ph = img.size
    r = W / H
    if pw/ph > r:
        nw = int(ph * r); l = (pw - nw) // 2
        img = img.crop((l, 0, l + nw, ph))
    else:
        nh = int(pw / r); t = (ph - nh) // 4
        img = img.crop((0, t, pw, t + nh))
    return img.resize((W, H), Image.LANCZOS)

def auto_wrap(text, font_func, max_width, start_size=68, min_size=36):
    """Auto-size and wrap text to fit within max_width pixels.
    Returns (lines, font_size)."""
    for sz in range(start_size, min_size - 1, -4):
        f = font_func(sz)
        words = text.replace('\n', ' ').split()
        lines = []
        current = ''
        for word in words:
            test = (current + ' ' + word).strip()
            bb = f.getbbox(test)
            if bb[2] - bb[0] > max_width and current:
                lines.append(current)
                current = word
            else:
                current = test
        if current:
            lines.append(current)
        # Accept if 4 lines or fewer
        if len(lines) <= 4:
            return lines, sz
    # Last resort: return what we have at min size
    return lines, min_size

def draw_slide(photo, headline, location, slide_num, is_last=False):
    img = fitimg(photo.copy())
    ov = Image.new('RGBA', (W, H), (0,0,0,0))
    d_ov = ImageDraw.Draw(ov)
    for y in range(int(H*0.50), H):
        p = (y - H*0.50) / (H*0.50)
        a = min(int((p**1.1)*210), 210)
        d_ov.line([(0,y),(W,y)], fill=(0,0,0,a))
    img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)

    MARGIN, ACCENT, WHITE = 48, (255,90,54), (255,255,255)
    max_text_w = W - MARGIN * 2

    # Auto-wrap headline to fit within slide width
    lines, font_sz = auto_wrap(headline, ft, max_text_w)
    line_h = font_sz + 8

    # If last slide, leave room for small CTA at bottom
    cta_space = 50 if is_last else 0

    # Position text from bottom up
    text_block_h = len(lines) * line_h
    d.text((MARGIN, H - text_block_h - 60 - cta_space), '\U0001f4cd ' + location.upper(), font=ft(24), fill=(*ACCENT, 240))
    y = H - text_block_h - 30 - cta_space
    for line in lines:
        d.text((MARGIN, y), line, font=ft(font_sz), fill=(*WHITE, 255))
        y += line_h

    # Small CTA on last slide only
    if is_last:
        cta = 'Follow @thetampapulse for more'
        d.text((MARGIN, H - 70), cta, font=ft(22), fill=(*WHITE, 160))

    wm = 'TAMPAPULSE'; bb = ft(20).getbbox(wm)
    d.text((W - MARGIN - (bb[2] - bb[0]), H - 44), wm, font=ft(20), fill=(*WHITE, 140))

    path = OUT / f'slide_{slide_num}.png'
    img.convert('RGB').save(path, quality=95)
    print(f'  {path.name}: {path.stat().st_size} bytes')
    return path

def upload_to_catbox(filepath, retries=3):
    for attempt in range(1, retries+1):
        try:
            with open(filepath, 'rb') as f:
                r = requests.post('https://catbox.moe/user/api.php',
                    data={'reqtype':'fileupload'}, files={'fileToUpload':f}, timeout=90)
                if r.status_code == 200 and r.text.strip().startswith('https://'):
                    return r.text.strip()
            print(f'  Attempt {attempt} failed: {r.status_code} {r.text[:80]}')
        except Exception as e:
            print(f'  Attempt {attempt} error: {e}')
        if attempt < retries:
            time.sleep(5)
    return None

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

# Stories must be about TAMPA — not Clearwater, Sarasota, Bradenton, etc.
NOT_TAMPA = ['clearwater', 'sarasota', 'bradenton', 'lakeland', 'naples',
             'fort myers', 'ocala', 'orlando', 'gainesville', 'daytona',
             'key west', 'miami', 'jacksonville', 'tallahassee', 'pensacola']

def is_tampa_relevant(title, article_text='', url=''):
    """Return True only if the story is about Tampa (not other FL cities)."""
    # tampa.gov stories are always Tampa-relevant
    if 'tampa.gov' in url:
        return True
    combined = (title + ' ' + article_text[:500]).lower()
    # Must mention tampa somewhere
    if 'tampa' not in combined and 'hillsborough' not in combined and 'ybor' not in combined and 'seminole heights' not in combined and 'channelside' not in combined and 'soho tampa' not in combined and 'hyde park' not in combined and 'westshore' not in combined:
        # Allow Tampa Bay-wide stories if they mention Tampa Bay explicitly
        if 'tampa bay' not in combined:
            return False
    # Reject if primarily about another city
    for city in NOT_TAMPA:
        if city in title.lower():
            return False
    return True

def scrape_and_select():
    """Scrape sources, find a good TAMPA story, build a post. Returns (post, log) or (None, log)."""
    log = load_log()
    recent = recently_posted(log)
    print(f'Recently posted ({REPOST_DAYS}d): {len(recent)} topics')

    print('\n=== SCRAPING NEWS SOURCES ===')
    all_stories = []
    all_stories.extend(scrape_stpete_catalyst())
    all_stories.extend(scrape_creative_loafing())
    all_stories.extend(scrape_reddit_tampa())
    all_stories.extend(scrape_google_news_tampa())

    fresh = [s for s in all_stories if f'news:{s["title"][:60]}' not in recent]
    print(f'\nTotal stories: {len(all_stories)}, Fresh: {len(fresh)}')

    for story in fresh:
        print(f'\nTrying: {story["title"][:60]}...')

        # Quick title check — skip obviously non-Tampa stories
        if not is_tampa_relevant(story['title'], story.get('desc', ''), story.get('url', '')):
            print(f'  Skipping — not Tampa-relevant')
            continue

        article_text = story.get('desc', '')
        if story.get('url') and len(article_text) < 100:
            time.sleep(2)  # be polite to sources
            print(f'  Scraping article: {story["url"][:60]}...')
            article_text = scrape_article_text(story['url'])

        # Verify Tampa relevance with full article text
        if not is_tampa_relevant(story['title'], article_text, story.get('url', '')):
            print(f'  Skipping — article not about Tampa')
            continue

        facts = extract_facts(article_text)
        print(f'  Facts extracted: {len(facts)}')
        for f in facts[:3]:
            print(f'    - {f[:90]}')

        if len(facts) >= 3:
            post = build_post_from_article(story, article_text)
            print(f'  SELECTED!')
            return post, log
        else:
            print(f'  Skipping — not enough detail')

    return None, log


if __name__ == '__main__':
    print('=== LOADING POST LOG ===')
    post, log = scrape_and_select()

    if not post:
        print('\nNo scraped stories had enough detail — this run skipped.')
        print('Will try again at next scheduled time.')
        exit(0)

    # Generate slides
    print(f'\n=== FETCHING PHOTOS ({len(post["slides"])} slides) ===')
    photos = []
    for i, s in enumerate(post['slides']):
        print(f'Slide {i+1}: {s["photo_query"]}')
        photo = get_photo(s['photo_query'])
        if not photo:
            photo = get_photo('tampa florida city urban modern')
        if not photo:
            print('FATAL: no photo'); exit(1)
        photos.append(photo)

    print('\n=== GENERATING SLIDES ===')
    slide_paths = []
    for i, s in enumerate(post['slides'], 1):
        slide_paths.append(draw_slide(photos[i-1], s['headline'], post['location'], i, is_last=s.get('is_last', False)))

    print('\n=== CHECKING FILES ===')
    for s in slide_paths:
        sz = s.stat().st_size
        print(f'  {s.name}: {sz} bytes')
        if sz < 50000: print('WARNING: too small'); exit(1)

    print('\n=== POSTING TO INSTAGRAM ===')
    IG = 'https://graph.facebook.com/v25.0/' + ACCT
    urls = []
    for s in slide_paths:
        print(f'Uploading {s.name}...')
        url = upload_to_catbox(s)
        if url: urls.append(url); print(f'  {url}')
        else: print('UPLOAD FAILED after 3 attempts'); exit(1)

    children = []
    for u in urls:
        r = requests.post(IG+'/media', json={'image_url':u,'is_carousel_item':True,'access_token':TOKEN}, timeout=30)
        print(f'  Container: {r.text[:120]}')
        r.raise_for_status()
        children.append(r.json()['id'])

    print('Waiting 15s...')
    time.sleep(15)
    cr = requests.post(IG+'/media', json={'media_type':'CAROUSEL','children':','.join(children),'caption':post['caption'],'access_token':TOKEN}, timeout=30)
    print(f'Carousel: {cr.text[:120]}')
    cr.raise_for_status()
    cid = cr.json()['id']

    print('Waiting 15s...')
    time.sleep(15)
    pub = requests.post(IG+'/media_publish', json={'creation_id':cid,'access_token':TOKEN}, timeout=30)
    print(f'Publish: {pub.text[:120]}')
    pub.raise_for_status()
    ig_id = pub.json()['id']
    print(f'\nPOSTED! ID: {ig_id}')

    # Track which Pexels photos we used so they never repeat
    photo_ids = [p.info.get('pexels_id') for p in photos if p.info.get('pexels_id')]
    save_log(log, post['topic'], ig_id, photo_ids=photo_ids)
    print('DONE.')
