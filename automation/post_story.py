"""
post_story.py — Post a single-slide Tampa news story to IG Stories.

Scrapes the same news sources as go.py but creates ONE title slide
(headline + neighborhood + key fact) at 1080x1920 Story dimensions
and publishes it as an IG Story. Save to Highlights manually.

Runs 1x/day via GitHub Actions (12 PM Tampa time).
"""

import json, os, re, random, sys, time, requests
from io import BytesIO
from pathlib import Path
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Config ───────────────────────────────────────────────────────────
PX    = os.environ['PEXELS_API_KEY']
TOKEN = os.environ['INSTAGRAM_ACCESS_TOKEN']
ACCT  = os.environ['INSTAGRAM_BUSINESS_ACCOUNT_ID']

W, H = 1080, 1920  # Story dimensions (9:16)

LOG_FILE = Path(__file__).parent / 'story_posted_log.json'
REPOST_DAYS = 14

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

# ── Timezone gate ────────────────────────────────────────────────────
STORY_HOURS = {13}  # 1 PM Tampa time

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

if os.environ.get('GITHUB_ACTIONS') == 'true':
    h = _tampa_hour()
    if h not in STORY_HOURS:
        print(f"Tampa hour is {h}, story posts at {STORY_HOURS}. Skipping.")
        sys.exit(0)
    print(f"Tampa hour is {h} — posting story.")

# ── Content filters ──────────────────────────────────────────────────
EXCLUDED_WORDS = [
    'crime','politics','police','arrest','shooting','trump','biden','desantis',
    'republican','democrat','murder','killed','lawsuit','sued','robbery',
    'congressional','candidate','election','immigration','gun ',
    'missing person','dead body','indicted','convicted','abortion',
]

SKIP_TITLES = [
    'best tampa bay events','best live music','happening april','happening march',
    'happening may','happening june','save & get','tickets now','meet the chefs',
    'all the best','hunky jesus','foxy mary','sponsored','advertisement',
    "what's new in tampa","whats new in tampa",'new openings to start',
    'front desk','interview:','interview :','oracle',
    'finest','best restaurants','top steakhouse','top restaurant',
    'best brunch','best bar','best coffee','best pizza','best burger',
    'best taco','best sushi','best seafood','best food','best place',
    'things to do','where to eat','guide to','must-try','must try',
    'you need to try','top 10','top 5','top 20',
    'should i','advice column','ask the',
]

def clean(t):
    return re.sub(r'\s+', ' ', t).strip()

def is_excluded(text):
    t = text.lower().replace('\u2018',"'").replace('\u2019',"'").replace('\u201c','"').replace('\u201d','"')
    return any(x in t for x in EXCLUDED_WORDS) or any(x in t for x in SKIP_TITLES)


# ── Scrapers (same sources as go.py, simplified) ────────────────────

def scrape_tbbwmag():
    stories = []
    try:
        from bs4 import BeautifulSoup
        r = requests.get('https://tbbwmag.com/', headers=HEADERS, timeout=15)
        if r.status_code != 200: return stories
        soup = BeautifulSoup(r.text, 'html.parser')
        seen = set()
        for a in soup.select('a[href*="tbbwmag.com/20"]')[:60]:
            href = a.get('href', '')
            title = clean(a.get_text())
            if href in seen or not title or len(title) < 20 or len(title) > 120: continue
            if not re.search(r'tbbwmag\.com/\d{4}/\d{2}/\d{2}/', href): continue
            if is_excluded(title): continue
            seen.add(href)
            stories.append({'title': title, 'url': href, 'source': 'TBBW'})
            if len(stories) >= 8: break
        print(f'  [TBBW] {len(stories)} articles')
    except Exception as e:
        print(f'  [TBBW] Error: {e}')
    return stories

def scrape_google_news_tampa():
    stories = []
    try:
        from bs4 import BeautifulSoup
        url = 'https://news.google.com/rss/search?q=Tampa+Florida+when:3d&hl=en-US&gl=US&ceid=US:en'
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200: return stories
        soup = BeautifulSoup(r.text, 'xml')
        for item in soup.find_all('item')[:20]:
            title = clean(item.title.text if item.title else '')
            link = item.link.text if item.link else ''
            if not title or len(title) < 20 or is_excluded(title): continue
            stories.append({'title': title, 'url': link, 'source': 'Google News'})
            if len(stories) >= 8: break
        print(f'  [Google News] {len(stories)} articles')
    except Exception as e:
        print(f'  [Google News] Error: {e}')
    return stories

def scrape_article_text(url):
    try:
        time.sleep(3)
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200: return ''
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(r.text, 'html.parser')
        for tag in soup(['script','style','nav','header','footer','aside']): tag.decompose()
        paragraphs = soup.find_all('p')
        text = ' '.join(clean(p.get_text()) for p in paragraphs if len(p.get_text().strip()) > 40)
        return text[:3000]
    except Exception as e:
        print(f'  Article scrape error: {e}')
        return ''


# ── Tampa relevance + neighborhood detection ────────────────────────

NOT_TAMPA = ['clearwater','sarasota','bradenton','lakeland','naples',
             'fort myers','ocala','orlando','gainesville','daytona',
             'key west','miami','jacksonville','tallahassee','pensacola']

def is_tampa_relevant(title, article_text='', url=''):
    if 'tampa.gov' in url: return True
    combined = (title + ' ' + article_text[:500] + ' ' + url).lower()
    tampa_signals = ['tampa','hillsborough','ybor','seminole heights','channelside',
                     'soho tampa','hyde park','westshore','gasworx','water street',
                     'armature works','bayshore','davis islands','palma ceia',
                     'dale mabry','harbour island','tampa heights','west tampa',
                     'south tampa','new tampa','carrollwood','brandon']
    if not any(sig in combined for sig in tampa_signals):
        if 'tampa bay' not in combined: return False
    for city in NOT_TAMPA:
        if city in title.lower(): return False
    return True

def detect_neighborhood(text):
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
        'davis islands': 'Davis Islands', 'gasworx': 'Gasworx District',
        'armature works': 'Armature Works', 'north tampa': 'North Tampa',
    }
    t = text.lower()
    for key, name in neighborhoods.items():
        if key in t: return name
    return 'Tampa'


# ── Extract one key fact for the subtitle ────────────────────────────

def extract_key_fact(text):
    """Pull the single most interesting fact from article text."""
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 30]
    skip = ['subscribe','sign up','click here','read more','advertisement',
            'cookie','privacy','terms','copyright','follow us']
    good = []
    for s in sentences:
        sl = s.lower()
        if any(x in sl for x in skip): continue
        if is_excluded(s): continue
        if len(s) < 35: continue
        if ' said ' in sl[:80] or sl.startswith('according to'): continue
        good.append(s)

    if not good:
        return None

    # Score by specificity (numbers, dollar amounts, addresses)
    def score(s):
        w = 0
        if re.search(r'\$[\d,.]+', s): w += 5
        if re.search(r'(million|billion)', s, re.I): w += 8
        if re.search(r'\d{3,}', s): w += 2
        if re.search(r'(open|launch|debut|announce)', s, re.I): w += 3
        return w

    good.sort(key=score, reverse=True)
    # Pick the best fact that fits. Prefer complete sentences under 18 words.
    # Never cut mid-sentence — pick a shorter fact instead.
    for fact in good:
        words = fact.split()
        if len(words) <= 18:
            return fact.rstrip('.')  + '.'
    # All facts too long — find one that ends at a natural break
    for fact in good:
        sentences = re.split(r'(?<=[.!?])\s+', fact)
        if sentences and len(sentences[0].split()) <= 18:
            return sentences[0]
    # Last resort: use shortest fact, trim to complete clause
    fact = good[0]
    words = fact.split()
    if len(words) > 18:
        # Trim back to last period/comma in first 18 words
        trimmed = ' '.join(words[:18])
        for sep in ['. ', ', ', ' — ', ' - ']:
            idx = trimmed.rfind(sep)
            if idx > 20:
                return trimmed[:idx + 1].strip()
        return trimmed.rstrip('.,;:') + '.'
    return fact


# ── Photo + rendering (1080x1920 story format) ──────────────────────

def get_photo(query):
    r = requests.get('https://api.pexels.com/v1/search',
        headers={'Authorization': PX},
        params={'query': query, 'orientation': 'portrait', 'per_page': 15}, timeout=15)
    pics = r.json().get('photos', [])
    if not pics: return None
    pick = random.choice(pics[:8])
    url = pick['src']['large2x']
    img = Image.open(BytesIO(requests.get(url, timeout=30).content)).convert('RGBA')
    return img

def photo_query_for(text):
    t = text.lower()
    if any(w in t for w in ['restaurant','food','chef','bakery','brunch','taco','pizza']):
        return 'restaurant interior warm lighting tampa'
    if any(w in t for w in ['bar','cocktail','brewery','beer','nightlife']):
        return 'craft cocktail bar modern interior tampa'
    if any(w in t for w in ['construction','build','develop','million','project']):
        return 'construction crane city development modern'
    if any(w in t for w in ['concert','music','festival','band','venue']):
        return 'live music concert outdoor stage lights'
    if any(w in t for w in ['sport','stadium','rays','lightning','bucs']):
        return 'sports stadium crowd arena night game'
    if any(w in t for w in ['beach','pier','coast','gulf']):
        return 'florida beach sunset golden hour waves'
    if any(w in t for w in ['art','gallery','museum','mural']):
        return 'colorful mural urban street art building'
    return 'tampa florida skyline sunset aerial waterfront'

def ft(sz):
    for p in [
        '/usr/local/share/fonts/Oswald-Bold.ttf',
        '/usr/share/fonts/truetype/urw-base35/NimbusSans-Bold.otf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        'C:/Windows/Fonts/impact.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
    ]:
        try: return ImageFont.truetype(p, sz)
        except: pass
    return ImageFont.load_default()

def fitimg(img):
    """Crop and resize to 1080x1920 story dimensions."""
    pw, ph = img.size
    r = W / H
    if pw/ph > r:
        nw = int(ph * r); l = (pw - nw) // 2
        img = img.crop((l, 0, l + nw, ph))
    else:
        nh = int(pw / r); t = (ph - nh) // 4
        img = img.crop((0, t, pw, t + nh))
    return img.resize((W, H), Image.LANCZOS)

def auto_wrap(text, font_func, max_width, start_size=72, min_size=40):
    for sz in range(start_size, min_size - 1, -4):
        f = font_func(sz)
        words = text.replace('\n', ' ').split()
        lines, current = [], ''
        for word in words:
            test = (current + ' ' + word).strip()
            bb = f.getbbox(test)
            if bb[2] - bb[0] > max_width and current:
                lines.append(current)
                current = word
            else:
                current = test
        if current: lines.append(current)
        if len(lines) <= 4:
            return lines, sz
    return lines, min_size

def draw_story(photo, headline, neighborhood, fact=None):
    """Draw a single story slide: background photo + gradient + headline + fact."""
    img = fitimg(photo.copy())
    ov = Image.new('RGBA', (W, H), (0,0,0,0))
    d_ov = ImageDraw.Draw(ov)

    # Gradient from center down
    for y in range(int(H * 0.40), H):
        p = (y - H * 0.40) / (H * 0.60)
        a = min(int((p ** 1.1) * 220), 220)
        d_ov.line([(0, y), (W, y)], fill=(0, 0, 0, a))

    img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)

    MARGIN = 60
    ACCENT = (255, 90, 54)
    WHITE  = (255, 255, 255)
    max_text_w = W - MARGIN * 2

    # Neighborhood tag
    y_pos = H - 500
    d.text((MARGIN, y_pos), '\U0001f4cd ' + neighborhood.upper(), font=ft(26), fill=(*ACCENT, 240))
    y_pos += 40

    # Headline
    lines, font_sz = auto_wrap(headline, ft, max_text_w, start_size=72, min_size=44)
    line_h = font_sz + 10
    for line in lines:
        d.text((MARGIN, y_pos), line, font=ft(font_sz), fill=(*WHITE, 255))
        y_pos += line_h

    # Key fact subtitle (if available)
    if fact:
        y_pos += 20
        fact_lines, fact_sz = auto_wrap(fact, ft, max_text_w, start_size=32, min_size=22)
        for line in fact_lines:
            d.text((MARGIN, y_pos), line, font=ft(fact_sz), fill=(*WHITE, 180))
            y_pos += fact_sz + 6

    # Branding
    d.text((MARGIN, H - 100), '@thetampapulse', font=ft(24), fill=(*WHITE, 160))
    wm = 'TAMPAPULSE'
    bb = ft(20).getbbox(wm)
    d.text((W - MARGIN - (bb[2] - bb[0]), H - 60), wm, font=ft(20), fill=(*WHITE, 120))

    out_path = Path(__file__).parent / 'story_slide.png'
    img.convert('RGB').save(out_path, quality=95)
    print(f'  Story slide: {out_path.stat().st_size} bytes')
    return out_path

def upload_image(filepath):
    """Upload to a public host. Tries catbox first, then uguu.se."""
    hosts = [
        ('catbox', lambda f: requests.post('https://catbox.moe/user/api.php',
            data={'reqtype': 'fileupload'}, files={'fileToUpload': f}, timeout=90)),
        ('uguu.se', lambda f: requests.post('https://uguu.se/upload',
            files={'files[]': f}, timeout=90)),
    ]
    for host_name, upload_fn in hosts:
        for attempt in range(3):
            try:
                with open(filepath, 'rb') as f:
                    r = upload_fn(f)
                if host_name == 'uguu.se':
                    data = r.json()
                    if data.get('success') and data.get('files'):
                        url = data['files'][0]['url']
                    else:
                        print(f'  [{host_name}] Attempt {attempt+1}: {r.text[:80]}')
                        continue
                else:
                    url = r.text.strip()
                if r.status_code == 200 and url.startswith('https://'):
                    check = requests.head(url, timeout=15, allow_redirects=True)
                    if 'image' in check.headers.get('Content-Type', ''):
                        print(f'  [{host_name}] {url}')
                        return url
                    print(f'  [{host_name}] Attempt {attempt+1}: bad content-type')
                else:
                    print(f'  [{host_name}] Attempt {attempt+1}: {r.status_code} {r.text[:80]}')
            except Exception as e:
                print(f'  [{host_name}] Attempt {attempt+1}: {e}')
            time.sleep(5)
        print(f'  [{host_name}] All attempts failed, trying next...')
    return None


# ── Post log ─────────────────────────────────────────────────────────

def load_log():
    if LOG_FILE.exists():
        try: return json.loads(LOG_FILE.read_text())
        except: pass
    return []

def save_log(log, topic, ig_id):
    log.append({'topic': topic, 'timestamp': datetime.utcnow().isoformat(), 'ig_id': str(ig_id)})
    cutoff = (datetime.utcnow() - timedelta(days=90)).isoformat()
    log = [e for e in log if e.get('timestamp', '') > cutoff]
    LOG_FILE.write_text(json.dumps(log, indent=2))

def recently_posted(log):
    cutoff = (datetime.utcnow() - timedelta(days=REPOST_DAYS)).isoformat()
    return {e['topic'] for e in log if e.get('timestamp', '') > cutoff}


# ── Main ─────────────────────────────────────────────────────────────

if __name__ == '__main__':
    log = load_log()
    recent = recently_posted(log)
    print(f'Recently posted: {len(recent)} stories')

    print('\n=== SCRAPING NEWS ===')
    all_stories = []
    all_stories.extend(scrape_tbbwmag())
    all_stories.extend(scrape_google_news_tampa())

    fresh = [s for s in all_stories if f'story:{s["title"][:60]}' not in recent]
    print(f'Total: {len(all_stories)}, Fresh: {len(fresh)}')

    selected = None
    for story in fresh:
        print(f'\nTrying: {story["title"][:60]}...')
        if not is_tampa_relevant(story['title'], '', story.get('url', '')):
            print('  Not Tampa-relevant')
            continue

        article_text = ''
        if story.get('url'):
            time.sleep(2)
            article_text = scrape_article_text(story['url'])

        if not is_tampa_relevant(story['title'], article_text, story.get('url', '')):
            print('  Article not about Tampa')
            continue

        fact = extract_key_fact(article_text) if article_text else None
        neighborhood = detect_neighborhood(story['title'] + ' ' + article_text[:500])

        selected = {
            'title': story['title'],
            'neighborhood': neighborhood,
            'fact': fact,
            'topic': f'story:{story["title"][:60]}',
        }
        print(f'  SELECTED! {neighborhood}')
        break

    if not selected:
        print('\nNo stories found — skipping.')
        sys.exit(0)

    # Generate story slide
    print('\n=== GENERATING STORY SLIDE ===')
    query = photo_query_for(selected['title'])
    photo = get_photo(query)
    if not photo:
        photo = get_photo('tampa florida city urban modern')
    if not photo:
        print('No photo available')
        sys.exit(1)

    slide_path = draw_story(photo, selected['title'], selected['neighborhood'], selected['fact'])

    # Upload and publish as Story
    print('\n=== POSTING STORY ===')
    url = upload_image(slide_path)
    if not url:
        print('Upload failed')
        sys.exit(1)
    print(f'  Uploaded: {url}')

    IG = f'https://graph.facebook.com/v25.0/{ACCT}'

    # Create story container
    r = requests.post(f'{IG}/media', data={
        'image_url': url,
        'media_type': 'STORIES',
        'access_token': TOKEN,
    }, timeout=30)
    print(f'  Container: {r.text[:120]}')
    r.raise_for_status()
    container_id = r.json()['id']

    time.sleep(10)

    # Publish
    pub = requests.post(f'{IG}/media_publish', data={
        'creation_id': container_id,
        'access_token': TOKEN,
    }, timeout=30)
    print(f'  Publish: {pub.text[:120]}')
    pub.raise_for_status()
    ig_id = pub.json()['id']
    print(f'\nSTORY POSTED! ID: {ig_id}')

    save_log(log, selected['topic'], ig_id)
    print('DONE.')
