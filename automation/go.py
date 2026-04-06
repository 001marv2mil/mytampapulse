"""
Tampa Pulse Instagram Auto-Poster
Posts 3x/day via GitHub Actions.

Content approach: Each post = ONE newsworthy Tampa story, 5 slides of escalating facts.
Sources: Tampa Bay Times, Creative Loafing, Reddit r/tampa (real news, not concert listings).
Fallback: Curated evergreen news stories with real details.

Style: Tampa Tomorrow — full-bleed photo, subtle bottom gradient, white headline,
orange location tag, TAMPAPULSE watermark.
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
REPOST_DAYS = 14

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
}

EXCLUDED = ['crime','politics','police','arrest','shooting','trump','biden',
            'desantis','republican','democrat','governor','senator','murder',
            'killed','dead body','lawsuit','sued','indicted','robbery',
            'congressional','candidate','election','rnc','dnc','immigration',
            'gun ','missing person','missing woman','missing man']

# ═══════════════════════════════════════════════════════════════════
# POST TRACKER
# ═══════════════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════════════
# TIER 1: SCRAPE REAL TAMPA NEWS
# ═══════════════════════════════════════════════════════════════════

def clean(text):
    return re.sub(r'\s+', ' ', text).strip()

def scrape_tampa_news():
    """Scrape Tampa Bay Times and Creative Loafing for real news stories."""
    stories = []

    # Tampa Bay Times
    for url, name in [
        ('https://www.tampabay.com/life-culture/', 'Tampa Bay Times'),
        ('https://www.cltampa.com/', 'Creative Loafing'),
    ]:
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code != 200: continue
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(r.text, 'html.parser')
            seen = set()
            for el in soup.select('article, .story, .card, h2 a, h3 a')[:20]:
                title_el = el.find(['h1','h2','h3','h4']) if el.name not in ('a',) else el
                title = clean(title_el.get_text()) if title_el else ''
                if not title or title in seen or len(title) < 15: continue
                if any(x in title.lower() for x in EXCLUDED): continue
                seen.add(title)
                desc_el = el.find('p')
                desc = clean(desc_el.get_text())[:300] if desc_el else ''
                if any(x in desc.lower() for x in EXCLUDED): continue
                stories.append({'source': name, 'title': title, 'desc': desc})
                if len(stories) >= 15: break
        except Exception as e:
            print(f'  [{name}] Error: {e}')

    # Reddit r/tampa — high engagement posts about real local stuff
    try:
        r = requests.get('https://www.reddit.com/r/tampa/hot.json?limit=25',
            headers={**HEADERS, 'User-Agent': 'TampaPulse/1.0'}, timeout=15)
        if r.status_code == 200:
            for post in r.json().get('data',{}).get('children',[]):
                d = post['data']
                title = d.get('title','')
                score = d.get('score',0)
                selftext = clean(d.get('selftext',''))[:300]
                if d.get('stickied') or score < 50: continue
                if any(x in title.lower() for x in EXCLUDED): continue
                if any(x in selftext.lower() for x in EXCLUDED): continue
                skip = ['moving to','thinking of moving','is tampa safe','visiting tampa',
                        'road rage','rant','unpopular opinion','does anyone']
                if any(x in title.lower() for x in skip): continue
                stories.append({'source': 'Reddit r/tampa', 'title': title, 'desc': selftext, 'score': score})
    except Exception as e:
        print(f'  [Reddit] Error: {e}')

    print(f'  Scraped {len(stories)} news stories')
    return stories

def build_news_post(story):
    """Turn a real news story into a 5-slide post with escalating facts.
    Uses the headline + description to generate detail slides."""

    title = story['title']
    desc = story.get('desc', '')
    source = story['source']

    # Extract key details from description for slide content
    # Each slide should add a new fact
    sentences = [s.strip() for s in re.split(r'[.!?]+', desc) if len(s.strip()) > 20]

    # Build 5 slides from the story
    slides = []

    # Slide 1: Main headline (shortened for visual impact)
    words = title.split()
    if len(words) > 9:
        # Split into 3 lines of ~3 words
        third = len(words) // 3
        h1 = ' '.join(words[:third])
        h2 = ' '.join(words[third:third*2])
        h3 = ' '.join(words[third*2:])
        headline = f'{h1}\n{h2}\n{h3}'
    elif len(words) > 6:
        half = len(words) // 2
        headline = ' '.join(words[:half]) + '\n' + ' '.join(words[half:])
    else:
        headline = title

    slides.append({
        'headline': headline,
        'photo_query': _photo_query_for(title),
    })

    # Slides 2-4: Detail slides from description
    if len(sentences) >= 3:
        for s in sentences[:3]:
            words = s.split()
            if len(words) > 9:
                third = len(words) // 3
                h = ' '.join(words[:third]) + '\n' + ' '.join(words[third:third*2]) + '\n' + ' '.join(words[third*2:])
            elif len(words) > 5:
                half = len(words) // 2
                h = ' '.join(words[:half]) + '\n' + ' '.join(words[half:])
            else:
                h = s
            slides.append({
                'headline': h[:90],
                'photo_query': _photo_query_for(s),
            })
    elif len(sentences) >= 1:
        slides.append({
            'headline': sentences[0][:90].replace('. ','\n'),
            'photo_query': _photo_query_for(sentences[0]),
        })
        slides.append({
            'headline': f'This Is Happening\nin Tampa Bay\nRight Now.',
            'photo_query': 'tampa florida downtown skyline waterfront',
        })
        slides.append({
            'headline': f'Save This Post.\nShare It with\nSomeone Local.',
            'photo_query': 'tampa bay city people community outdoor',
        })
    else:
        # No description — generate context slides
        slides.append({
            'headline': f'Here\'s What\nYou Need\nto Know.',
            'photo_query': _photo_query_for(title),
        })
        slides.append({
            'headline': f'This Is Happening\nin Tampa Bay\nRight Now.',
            'photo_query': 'tampa florida downtown skyline waterfront',
        })
        slides.append({
            'headline': f'Developing Story.\nMore Details\nComing Soon.',
            'photo_query': 'city development urban news modern',
        })

    # Slide 5: Impact/closing fact
    slides.append({
        'headline': f'Tampa Keeps\nGrowing. Stay\nInformed.',
        'photo_query': 'tampa skyline sunset growth city aerial',
    })

    # Trim to exactly 5 slides
    slides = slides[:5]

    # Build caption
    caption = f"| {title[:60]} — Tampa Bay |\n\n"
    if desc:
        caption += f"{desc[:200]}\n\n"
    caption += "Save this. Share it with someone local.\n\n"
    caption += "Follow @thetampapulse — your weekly cheat code to Tampa.\n\n"
    caption += "#tampa #tampabay #tampalife #TampaPulse #tampaflorida #tambanews"

    return {
        'location': 'Tampa Bay',
        'slides': slides,
        'caption': caption,
        'topic': f'news:{title[:50]}',
    }

def _photo_query_for(text):
    """Generate a Pexels search query based on story content."""
    t = text.lower()
    if any(w in t for w in ['restaurant','food','chef','menu','dining','brunch','taco']):
        return 'restaurant food dining interior upscale'
    if any(w in t for w in ['hotel','resort','hospitality']):
        return 'luxury hotel modern building architecture'
    if any(w in t for w in ['park','green','tree','outdoor','nature']):
        return 'city park green outdoor nature people'
    if any(w in t for w in ['beach','sand','water','pier','coast']):
        return 'beach sunset ocean sand tropical florida'
    if any(w in t for w in ['construction','build','develop','project','million','billion']):
        return 'construction development building modern urban crane'
    if any(w in t for w in ['bar','cocktail','brewery','drink','nightlife']):
        return 'bar cocktails nightlife drinks modern interior'
    if any(w in t for w in ['art','gallery','museum','exhibit','show']):
        return 'art gallery museum modern exhibit interior'
    if any(w in t for w in ['concert','music','festival','live','band']):
        return 'live music concert stage outdoor festival'
    if any(w in t for w in ['sport','stadium','rays','lightning','bucs','game']):
        return 'sports stadium arena crowd game'
    if any(w in t for w in ['school','university','campus','student']):
        return 'university campus modern education building'
    return 'tampa florida city urban skyline modern'

# ═══════════════════════════════════════════════════════════════════
# TIER 2: CURATED EVERGREEN NEWS (real stories with real details)
# ═══════════════════════════════════════════════════════════════════

EVERGREEN = [
    {
        'location': 'Downtown Tampa', 'topic': 'news:ybor-harbor-800m',
        'slides': [
            {'headline': 'Ybor Harbor:\n$800M Waterfront\nDevelopment Approved', 'photo_query': 'modern waterfront development urban skyline aerial'},
            {'headline': '2,000+ Residential\nUnits. Ground-Floor\nRetail Throughout.', 'photo_query': 'luxury apartment modern architecture waterfront'},
            {'headline': 'New Public\nWaterfront Park\nConnects to Riverwalk.', 'photo_query': 'waterfront park green space city promenade'},
            {'headline': 'Biggest Development\nEast Tampa Has\nEver Seen.', 'photo_query': 'construction crane building development urban'},
            {'headline': 'Expected to Break\nGround Within\nthe Year.', 'photo_query': 'city skyline sunset growth development aerial'},
        ],
        'caption': "| Ybor Harbor — $800M Waterfront Development |\n\nYbor City is about to change. An $800M waterfront development just got approved — the biggest East Tampa has ever seen.\n\n• 2,000+ residential units\n• Ground-floor retail and restaurants\n• New public waterfront park\n• Direct Riverwalk connection\n• Breaks ground this year\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #yborcity #tampabay #development #realestate #TampaPulse",
    },
    {
        'location': 'South Tampa', 'topic': 'news:landon-soho-opening',
        'slides': [
            {'headline': 'The Landon Just\nOpened in SoHo.\nHell\'s Kitchen Chef.', 'photo_query': 'upscale restaurant interior elegant fine dining'},
            {'headline': 'Chef Robert Hesse.\nNew American.\nSeafood Focus.', 'photo_query': 'chef cooking kitchen professional restaurant plating'},
            {'headline': '717 South Howard.\nFormer 717 South\nSpace Revived.', 'photo_query': 'restaurant exterior evening south tampa street'},
            {'headline': 'Already Booking\nUp on Weekends.\nReservations Recommended.', 'photo_query': 'busy restaurant dining room full crowd evening'},
            {'headline': 'Biggest New\nRestaurant Opening\nin SoHo This Year.', 'photo_query': 'south tampa soho neighborhood restaurant row night'},
        ],
        'caption': "| The Landon — SoHo |\n\nSoHo just got a new restaurant from a Hell's Kitchen chef.\n\n• Chef Robert Hesse running the show\n• New American, seafood focus\n• 717 South Howard Ave (old 717 South space)\n• Already booking up on weekends\n• Make a reservation now\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #soho #tampaeats #tamparestaurants #tampabay #TampaPulse",
    },
    {
        'location': 'Ybor City', 'topic': 'news:rays-stadium-1.3b',
        'slides': [
            {'headline': 'Rays Stadium:\n$1.3 Billion Project\nMoving Forward', 'photo_query': 'modern baseball stadium rendering architecture'},
            {'headline': '30,000 Seats.\nNew Ybor City\nLocation.', 'photo_query': 'baseball stadium interior seats field crowd'},
            {'headline': 'Surrounding\nEntertainment District\nwith Shops + Dining.', 'photo_query': 'entertainment district shops restaurants urban walkable'},
            {'headline': 'Expected to Open\nby 2028. Largest\nSports Project in TB.', 'photo_query': 'stadium construction site progress building'},
            {'headline': 'This Will Transform\nEast Tampa\nCompletely.', 'photo_query': 'city development growth skyline aerial urban'},
        ],
        'caption': "| Rays Stadium — Ybor City |\n\nThe $1.3B Tampa Bay Rays stadium is moving forward.\n\n• 30,000 seats in Ybor City\n• Surrounding entertainment district\n• Opens by 2028\n• Largest sports project in Tampa Bay history\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #rays #tampabay #tampabayrays #yborcity #TampaPulse",
    },
    {
        'location': 'Channelside', 'topic': 'news:cruise-terminal-30m',
        'slides': [
            {'headline': 'Port Tampa Bay\nGetting $30M\nCruise Terminal Upgrade', 'photo_query': 'cruise ship port terminal harbor dock'},
            {'headline': 'Will Handle the\nLargest Ships\nin the World.', 'photo_query': 'large cruise ship vessel ocean luxury'},
            {'headline': 'Tampa Is Now\na Top 5 Cruise\nPort in the U.S.', 'photo_query': 'cruise ship deck ocean sunset vacation'},
            {'headline': 'Carnival, Royal\nCaribbean, Celebrity\nAll Sail from Tampa.', 'photo_query': 'cruise ship colorful port docked tropical'},
            {'headline': 'New Terminal\nExpected by 2027.\nDirect I-275 Access.', 'photo_query': 'modern terminal building architecture glass steel'},
        ],
        'caption': "| Port Tampa Bay — $30M Cruise Terminal |\n\n• Will handle the largest ships in the world\n• Tampa is now a top 5 cruise port in the U.S.\n• Carnival, Royal Caribbean, Celebrity — all from Tampa\n• New terminal by 2027\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #cruise #tampabay #travel #TampaPulse",
    },
    {
        'location': 'Bayshore Blvd', 'topic': 'news:flood-protection-70m',
        'slides': [
            {'headline': 'Hillsborough County\nApproves $70M\nFlood Protection Plan', 'photo_query': 'coastal infrastructure seawall construction waterfront'},
            {'headline': 'Bayshore Boulevard\nSeawall Getting\nMajor Upgrades.', 'photo_query': 'bayshore boulevard waterfront palm trees road'},
            {'headline': 'Davis Islands\nStorm Surge\nBarriers Planned.', 'photo_query': 'island neighborhood aerial waterfront homes coastal'},
            {'headline': 'South Tampa\nDrainage System\nFully Rebuilt.', 'photo_query': 'urban infrastructure construction pipes drainage city'},
            {'headline': 'Construction Starts\nThis Year.\n3-Year Timeline.', 'photo_query': 'construction workers crane building city infrastructure'},
        ],
        'caption': "| $70M Flood Protection — Hillsborough County |\n\n• Bayshore Boulevard seawall improvements\n• Davis Islands storm surge barriers\n• South Tampa drainage rebuilt\n• Construction starts this year, 3-year timeline\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabay #hillsborough #infrastructure #TampaPulse",
    },
    {
        'location': 'North Tampa', 'topic': 'news:busch-gardens-coaster',
        'slides': [
            {'headline': 'Busch Gardens\nAnnounces New\nRecord-Breaking Coaster', 'photo_query': 'roller coaster theme park tall ride exciting'},
            {'headline': '200+ Feet Tall.\nTallest Coaster\nin Florida.', 'photo_query': 'roller coaster tall steep drop blue sky'},
            {'headline': '70 MPH Top Speed.\nFaster Than Anything\nin Orlando.', 'photo_query': 'roller coaster speed motion fast amusement park'},
            {'headline': 'Opening 2027.\nBeats Every\nOrlando Theme Park.', 'photo_query': 'theme park aerial landscape florida sunny'},
            {'headline': 'Tampa > Orlando.\nYou Heard It\nHere First.', 'photo_query': 'amusement park entrance crowd fun family'},
        ],
        'caption': "| Busch Gardens — New Record-Breaking Coaster |\n\n• 200+ feet tall — tallest in Florida\n• 70 MPH — faster than anything in Orlando\n• Opens 2027\n• Tampa > Orlando\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #buschgardens #tampabay #rollercoaster #TampaPulse",
    },
    {
        'location': 'Tampa Bay', 'topic': 'news:riverwalk-best-us',
        'slides': [
            {'headline': 'Tampa Riverwalk\nNamed Best\nRiverwalk in the U.S.', 'photo_query': 'city riverwalk waterfront walkway sunset skyline'},
            {'headline': '3 Miles of\nWaterfront. Bars,\nParks, Museums.', 'photo_query': 'waterfront walkway park evening lights city'},
            {'headline': 'Armature Works\nto Florida Aquarium.\nAll Connected.', 'photo_query': 'food hall market interior industrial chic modern'},
            {'headline': 'Free to Explore.\nMost Locals Still\nHaven\'t Seen All of It.', 'photo_query': 'people walking waterfront park sunny outdoor'},
            {'headline': 'Tampa Bay\'s\nBiggest Flex.\nGo This Weekend.', 'photo_query': 'tampa riverwalk aerial waterfront downtown skyline'},
        ],
        'caption': "| Tampa Riverwalk — Named Best in the U.S. |\n\n• 3 miles of waterfront\n• Bars, parks, museums — all connected\n• Armature Works to Florida Aquarium\n• Free. Most locals haven't seen all of it.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #riverwalk #tampabay #downtown #TampaPulse",
    },
    {
        'location': 'Clearwater', 'topic': 'news:clearwater-1-beach',
        'slides': [
            {'headline': 'Clearwater Beach\nRanked #1 Beach\nin the U.S. Again', 'photo_query': 'clearwater beach white sand turquoise water sunny'},
            {'headline': 'TripAdvisor 2026\nTravelers\' Choice.\n5th Time Winning.', 'photo_query': 'beach sunset florida gulf coast waves sky'},
            {'headline': 'Pier 60 Sunset\nFestival. Every\nSingle Night.', 'photo_query': 'beach pier sunset festival vendors people'},
            {'headline': '30 Minutes\nfrom Downtown\nTampa.', 'photo_query': 'beach people swimming clear water tropical'},
            {'headline': 'Tampa Bay Has\nthe #1 Beach\nin America.', 'photo_query': 'florida beach aerial drone turquoise coastline'},
        ],
        'caption': "| Clearwater Beach — #1 Beach in the U.S. Again |\n\n• TripAdvisor 2026 Travelers' Choice, 5th time\n• Pier 60 sunset festival every night\n• 30 min from downtown Tampa\n• Tampa Bay has the #1 beach in America\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #clearwaterbeach #florida #beach #TampaPulse",
    },
    {
        'location': 'Seminole Heights', 'topic': 'news:seminole-heights-boom',
        'slides': [
            {'headline': 'Seminole Heights\nNow Has 30+\nRestaurants. 5 Years Ago\nIt Had 5.', 'photo_query': 'trendy restaurant food neighborhood dining'},
            {'headline': 'Ichicoro Ramen.\nAngry Chair Brewing.\nThe Refinery.', 'photo_query': 'ramen bowl japanese restaurant steam close up'},
            {'headline': 'Nationally Ranked\nBreweries. James Beard\nNominated Chefs.', 'photo_query': 'craft brewery taproom beer flights industrial'},
            {'headline': 'Home Prices Up\n40% in 3 Years.\nStill Undervalued.', 'photo_query': 'neighborhood houses bungalow residential street trees'},
            {'headline': 'Tampa\'s Next Big\nNeighborhood Is\nAlready Here.', 'photo_query': 'neighborhood street restaurants people outdoor walkable'},
        ],
        'caption': "| Seminole Heights — Tampa's Hottest Neighborhood |\n\n• 30+ restaurants now (had 5 five years ago)\n• Ichicoro, Angry Chair, The Refinery\n• Nationally ranked breweries, James Beard nominated chefs\n• Home prices up 40% in 3 years — still undervalued\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #seminoleheights #tampaeats #tampabay #TampaPulse",
    },
    {
        'location': 'Water Street', 'topic': 'news:water-street-2b',
        'slides': [
            {'headline': 'Water Street Tampa:\n$2B District That\nDidn\'t Exist 5 Years Ago', 'photo_query': 'modern urban district new buildings waterfront'},
            {'headline': 'Tampa Edition Hotel.\nJW Marriott.\nWhole Foods.', 'photo_query': 'luxury hotel modern building glass tower'},
            {'headline': 'University of South\nFlorida Morsani\nMedical Campus Here.', 'photo_query': 'modern university medical campus building'},
            {'headline': '9 Million Sq Ft\nof Mixed-Use.\nStill Expanding.', 'photo_query': 'aerial city development construction growth urban'},
            {'headline': 'Downtown Tampa\nLooks Nothing Like\nIt Did in 2020.', 'photo_query': 'tampa downtown skyline modern evening lights'},
        ],
        'caption': "| Water Street Tampa — $2B District |\n\nDidn't exist 5 years ago. Now it's one of the most ambitious developments in the Southeast.\n\n• Tampa Edition Hotel, JW Marriott, Whole Foods\n• USF Morsani Medical Campus\n• 9 million sq ft of mixed-use, still expanding\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #waterstreet #tampabay #development #TampaPulse",
    },
    {
        'location': 'Tampa Bay', 'topic': 'news:tampa-population-growth',
        'slides': [
            {'headline': 'Tampa Bay Is the\nFastest Growing\nMetro in Florida', 'photo_query': 'city skyline growth aerial urban development'},
            {'headline': '3.2 Million People.\n1,000 New Residents\nEvery Week.', 'photo_query': 'city people crowd diverse community urban'},
            {'headline': 'More People Moving\nHere Than Miami,\nOrlando, or Jax.', 'photo_query': 'moving trucks residential neighborhood houses'},
            {'headline': '$4.8B in New\nConstruction Permits\nFiled This Year.', 'photo_query': 'construction cranes skyline city building development'},
            {'headline': 'Tampa Bay Is\nHaving Its Moment.\nYou\'re Early.', 'photo_query': 'tampa sunset skyline waterfront beautiful aerial'},
        ],
        'caption': "| Tampa Bay — Fastest Growing Metro in Florida |\n\n• 3.2 million people, 1,000 new residents every week\n• More than Miami, Orlando, or Jacksonville\n• $4.8B in new construction permits this year\n• Tampa Bay is having its moment\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabay #growth #population #TampaPulse #florida",
    },
    {
        'location': 'Sparkman Wharf', 'topic': 'news:sparkman-wharf-expansion',
        'slides': [
            {'headline': 'Sparkman Wharf\nAdding 6 New\nRestaurant Concepts', 'photo_query': 'outdoor restaurant waterfront evening lights people'},
            {'headline': 'Waterfront Dining.\nBeer Garden.\nLive Music Stage.', 'photo_query': 'beer garden outdoor waterfront people drinks evening'},
            {'headline': 'Already One of\nTampa\'s Most Popular\nWaterfront Spots.', 'photo_query': 'waterfront dining crowd happy people outdoor'},
            {'headline': 'Directly on the\nRiverwalk. Walking\nDistance to Amalie.', 'photo_query': 'tampa riverwalk waterfront walkway evening'},
            {'headline': 'The Expansion\nOpens This\nSummer.', 'photo_query': 'restaurant opening celebration new modern interior'},
        ],
        'caption': "| Sparkman Wharf — 6 New Restaurant Concepts |\n\n• Waterfront dining, beer garden, live music stage\n• Already one of Tampa's most popular spots\n• Right on the Riverwalk\n• Expansion opens this summer\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #sparkmanwharf #tampaeats #tampabay #TampaPulse",
    },
]

# ═══════════════════════════════════════════════════════════════════
# FONTS + PHOTO + SLIDE RENDERER
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

def get_photo(q):
    r = requests.get('https://api.pexels.com/v1/search',
        headers={'Authorization': PX},
        params={'query': q, 'orientation': 'portrait', 'per_page': 15}, timeout=15)
    pics = r.json().get('photos', [])
    if not pics: return None
    url = random.choice(pics[:8])['src']['large2x']
    data = requests.get(url, timeout=30).content
    return Image.open(BytesIO(data)).convert('RGBA')

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

def draw_slide(photo, headline, location, slide_num):
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

    d.text((MARGIN, H-310), '📍 '+location.upper(), font=ft(24), fill=(*ACCENT,240))
    y = H - 275
    for line in headline.split('\n'):
        d.text((MARGIN, y), line, font=ft(68), fill=(*WHITE,255))
        y += 76

    wm = 'TAMPAPULSE'
    bb = ft(20).getbbox(wm)
    d.text((W-MARGIN-(bb[2]-bb[0]), H-44), wm, font=ft(20), fill=(*WHITE,140))

    path = OUT / f'slide_{slide_num}.png'
    img.convert('RGB').save(path, quality=95)
    print(f'  {path.name}: {path.stat().st_size} bytes')
    return path

# ═══════════════════════════════════════════════════════════════════
# UPLOAD + POST
# ═══════════════════════════════════════════════════════════════════

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

print('=== LOADING POST LOG ===')
log = load_log()
recent = recently_posted(log)
print(f'Recently posted ({REPOST_DAYS}d): {len(recent)} topics')

# Tier 1: Scrape real Tampa news
print('\n=== TIER 1: SCRAPING TAMPA NEWS ===')
stories = scrape_tampa_news()
news_posts = [build_news_post(s) for s in stories]
fresh_news = [p for p in news_posts if p['topic'] not in recent]
print(f'Fresh news stories: {len(fresh_news)}')

post = None

if fresh_news:
    post = fresh_news[0]  # most relevant/recent
    print(f'SELECTED NEWS: {post["topic"]}')
else:
    # Tier 2: Evergreen news stories
    print('\n=== TIER 2: EVERGREEN NEWS ===')
    fresh = [p for p in EVERGREEN if p['topic'] not in recent]
    if fresh:
        post = random.choice(fresh)
    else:
        topic_times = {e['topic']: e['timestamp'] for e in log if e['topic'].startswith('news:')}
        EVERGREEN.sort(key=lambda p: topic_times.get(p['topic'], ''))
        post = EVERGREEN[0]
    print(f'SELECTED EVERGREEN: {post["topic"]}')

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
    slide_paths.append(draw_slide(photos[i-1], s['headline'], post['location'], i))

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

save_log(log, post['topic'], ig_id)
print('DONE.')
