import os, random, json, time, requests
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
TM_KEY = os.environ.get('TICKETMASTER_API_KEY', '')
OUT = Path('CAROUSEL_READY_TO_POST')
OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'): old.unlink()

LOG_FILE = Path(__file__).parent / 'posted_log.json'
REPOST_DAYS = 14  # don't repeat a topic within this window

# ═══════════════════════════════════════════════════════════════════
# POST TRACKER — prevents repeats
# ═══════════════════════════════════════════════════════════════════

def load_log():
    if LOG_FILE.exists():
        try: return json.loads(LOG_FILE.read_text())
        except: pass
    return []

def save_log(log, topic, ig_id):
    log.append({'topic': topic, 'timestamp': datetime.utcnow().isoformat(), 'ig_id': str(ig_id)})
    # keep last 90 days only
    cutoff = (datetime.utcnow() - timedelta(days=90)).isoformat()
    log = [e for e in log if e.get('timestamp', '') > cutoff]
    LOG_FILE.write_text(json.dumps(log, indent=2))
    print(f'Saved to post log: {topic}')

def recently_posted(log):
    cutoff = (datetime.utcnow() - timedelta(days=REPOST_DAYS)).isoformat()
    return {e['topic'] for e in log if e.get('timestamp', '') > cutoff}

# ═══════════════════════════════════════════════════════════════════
# TIER 1: TICKETMASTER LIVE EVENTS
# ═══════════════════════════════════════════════════════════════════

GENRE_PHOTO_MAP = {
    'music': 'live concert stage crowd lights performance',
    'sports': 'sports stadium arena crowd game excitement',
    'arts': 'theater performance stage arts culture show',
    'comedy': 'comedy show stage microphone standup spotlight',
    'family': 'family event festival outdoor fun carnival',
    'film': 'movie premiere cinema theater film screening',
    'default': 'event crowd people entertainment night venue',
}

VENUE_TIPS = {
    'Amalie Arena': 'Hattricks is right next door — $5 margs before the show.',
    'Raymond James Stadium': 'Tailgate in Lot 14. Get there 2 hours early.',
    'Ruth Eckerd Hall': 'Clearwater spot. Grab dinner at Frenchy\'s after.',
    'Yuengling Center': 'USF campus. Free parking after 5:30PM.',
    'Hard Rock Event Center': 'Full casino + restaurants on site. Make a night of it.',
    'MidFlorida Credit Union Amphitheatre': 'Bring a blanket for lawn seats. Food trucks on site.',
    'Curtis Hixon Park': 'Right on the Riverwalk. Walk to Sparkman Wharf after.',
    'Jannus Live': 'St. Pete open-air venue. Bar crawl Central Ave after.',
    'The Ritz Ybor': 'Ybor City. Hit 7th Ave for late-night food after.',
    'default': 'Get there early. Explore the neighborhood before the show.',
}

def fetch_ticketmaster_events():
    if not TM_KEY:
        print('No Ticketmaster API key — skipping live events')
        return []

    now = datetime.utcnow()
    start = (now + timedelta(days=3)).strftime('%Y-%m-%dT00:00:00Z')
    end = (now + timedelta(days=30)).strftime('%Y-%m-%dT23:59:59Z')

    try:
        r = requests.get('https://app.ticketmaster.com/discovery/v2/events.json', params={
            'city': 'Tampa',
            'stateCode': 'FL',
            'apikey': TM_KEY,
            'size': 20,
            'sort': 'date,asc',
            'startDateTime': start,
            'endDateTime': end,
        }, timeout=15)

        if r.status_code != 200:
            print(f'Ticketmaster API error: {r.status_code}')
            return []

        events = r.json().get('_embedded', {}).get('events', [])
        print(f'Ticketmaster: found {len(events)} upcoming events')

        posts = []
        for ev in events:
            name = ev.get('name', '')
            if not name:
                continue

            # Venue
            venues = ev.get('_embedded', {}).get('venues', [{}])
            venue_name = venues[0].get('name', 'Tampa Venue') if venues else 'Tampa Venue'
            venue_city = venues[0].get('city', {}).get('name', 'Tampa') if venues else 'Tampa'

            # Date
            dates = ev.get('dates', {}).get('start', {})
            date_str = dates.get('localDate', '')
            time_str = dates.get('localTime', '')
            if date_str:
                try:
                    dt = datetime.strptime(date_str, '%Y-%m-%d')
                    friendly_date = dt.strftime('%B %d, %Y')
                    day_of_week = dt.strftime('%A')
                except:
                    friendly_date = date_str
                    day_of_week = ''
            else:
                friendly_date = 'Date TBA'
                day_of_week = ''

            if time_str:
                try:
                    t = datetime.strptime(time_str, '%H:%M:%S')
                    friendly_time = t.strftime('%-I:%M %p') if os.name != 'nt' else t.strftime('%I:%M %p').lstrip('0')
                except:
                    friendly_time = time_str
            else:
                friendly_time = 'Time TBA'

            # Price
            price_ranges = ev.get('priceRanges', [])
            if price_ranges:
                low = price_ranges[0].get('min', 0)
                high = price_ranges[0].get('max', 0)
                if low and high:
                    price_str = f'${int(low)}–${int(high)}'
                elif low:
                    price_str = f'Starting at ${int(low)}'
                else:
                    price_str = 'Check venue for pricing'
            else:
                price_str = 'Check venue for pricing'

            # Genre for photo queries
            genre_key = 'default'
            classifications = ev.get('classifications', [{}])
            if classifications:
                segment = classifications[0].get('segment', {}).get('name', '').lower()
                if 'music' in segment: genre_key = 'music'
                elif 'sport' in segment: genre_key = 'sports'
                elif 'art' in segment or 'theatre' in segment: genre_key = 'arts'
                elif 'comedy' in segment: genre_key = 'comedy'
                elif 'family' in segment or 'miscellaneous' in segment: genre_key = 'family'
                elif 'film' in segment: genre_key = 'film'

            genre_name = classifications[0].get('genre', {}).get('name', '') if classifications else ''
            photo_base = GENRE_PHOTO_MAP.get(genre_key, GENRE_PHOTO_MAP['default'])

            # Venue tip
            tip = VENUE_TIPS.get(venue_name, VENUE_TIPS['default'])

            topic_key = f'event:{name}'

            slides = [
                {
                    'headline': f'{name[:40]}\n{venue_name[:30]}\n{friendly_date}',
                    'photo_query': photo_base,
                },
                {
                    'headline': f'{venue_name}\n{venue_city}\n{day_of_week} at {friendly_time}',
                    'photo_query': f'{venue_name.lower()} venue concert hall arena',
                },
                {
                    'headline': f'Tickets\n{price_str}\nOn Sale Now.',
                    'photo_query': 'concert tickets event crowd excitement anticipation',
                },
                {
                    'headline': f'Why You\nShould Go',
                    'photo_query': f'{genre_name.lower()} {photo_base}' if genre_name else photo_base,
                },
                {
                    'headline': f'Tampa Tip:\n{tip[:50]}',
                    'photo_query': 'tampa restaurant bar food neighborhood night',
                },
            ]

            caption = (
                f"| {name} — {venue_name} |\n\n"
                f"{name} is coming to {venue_name} on {friendly_date}.\n\n"
                f"• {day_of_week} at {friendly_time}\n"
                f"• Tickets: {price_str}\n"
                f"• Venue: {venue_name}, {venue_city}\n"
                f"• Tampa tip: {tip}\n\n"
                f"Save this. Don't miss it.\n\n"
                f"Follow @thetampapulse — your weekly cheat code to Tampa.\n\n"
                f"#tampa #tampabay #tampaevents #tampalife #TampaPulse #{genre_key}"
            )

            posts.append({
                'location': venue_name,
                'slides': slides,
                'caption': caption,
                'topic': topic_key,
            })

        return posts

    except Exception as e:
        print(f'Ticketmaster error: {e}')
        return []

# ═══════════════════════════════════════════════════════════════════
# TIER 2: EVERGREEN POSTS (30+)
# ═══════════════════════════════════════════════════════════════════

EVERGREEN = [
    # ── DATE NIGHT ──
    {
        'location': 'South Tampa', 'topic': 'evergreen:date-night',
        'slides': [
            {'headline': 'Best Date Night\nSpots in Tampa', 'photo_query': 'romantic restaurant candlelight dinner wine elegant'},
            {'headline': 'Bern\'s Steak House\nLegendary Wine Cellar.\n$60–$120/person.', 'photo_query': 'steak dinner fine dining upscale plate wine'},
            {'headline': 'Ulele\nWood-Fired Grill on\nthe Riverwalk.', 'photo_query': 'waterfront restaurant outdoor dining evening river view'},
            {'headline': 'Olivia\nItalian. SoHo.\nBest Pasta in Tampa.', 'photo_query': 'italian pasta dish restaurant close up fresh handmade'},
            {'headline': 'Haven\nRooftop Cocktails.\nDowntown Views.', 'photo_query': 'rooftop bar cocktails city skyline night view'},
            {'headline': 'Boat Club\nWaterfront Drinks.\nHarbour Island.', 'photo_query': 'waterfront bar harbor marina boats sunset drinks'},
        ],
        'caption': "| Best Date Night — South Tampa |\n\nTampa's date night scene is way better than people give it credit for. Here are 5 spots that never miss:\n\n• Bern's Steak House — the wine cellar alone is legendary\n• Ulele — wood-fired grill right on the Riverwalk\n• Olivia — Italian in SoHo. Best pasta in Tampa.\n• Haven — rooftop cocktails with downtown views\n• Boat Club — waterfront on Harbour Island\n\nSave this for when you need it.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #datenight #tampaeats #tamparestaurants #tampabay #TampaPulse #tampalife",
    },
    # ── SEMINOLE HEIGHTS FOOD ──
    {
        'location': 'Seminole Heights', 'topic': 'evergreen:seminole-heights-food',
        'slides': [
            {'headline': 'Seminole Heights Is\nTampa\'s Hottest Food\nNeighborhood', 'photo_query': 'trendy restaurant food tacos craft beer casual dining'},
            {'headline': 'Ichicoro Ramen\nBest Ramen in Tampa.\nNo Debate.', 'photo_query': 'ramen noodles bowl japanese restaurant steam close up'},
            {'headline': 'The Refinery\nSeasonal Menu That\nChanges Every Week.', 'photo_query': 'farm to table restaurant dish seasonal plating elegant'},
            {'headline': 'Angry Chair Brewing\nNationally Ranked\nStouts and Porters.', 'photo_query': 'craft brewery dark stout beer glass taproom industrial'},
            {'headline': 'Café Hey\nThe Breakfast Spot\nLocals Swear By.', 'photo_query': 'breakfast cafe eggs pancakes morning coffee plate'},
            {'headline': 'The Independent\nCraft Cocktails\nin a Bungalow.', 'photo_query': 'cocktail bar cozy intimate bungalow drinks moody'},
        ],
        'caption': "| Food Scene — Seminole Heights |\n\nSeminole Heights went from under-the-radar to Tampa's hottest food neighborhood in about 5 years.\n\n• Ichicoro Ramen — best ramen in Tampa, no debate\n• The Refinery — seasonal menu that changes weekly\n• Angry Chair Brewing — nationally ranked stouts\n• Café Hey — the breakfast spot locals swear by\n• The Independent — craft cocktails in a bungalow\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #seminoleheights #tampaeats #tampafood #tampabay #TampaPulse #craftbeer",
    },
    # ── HAPPY HOURS ──
    {
        'location': 'Tampa Bay', 'topic': 'evergreen:happy-hours',
        'slides': [
            {'headline': 'Best Happy Hours\nin Tampa Right Now', 'photo_query': 'happy hour cocktails friends bar outdoor rooftop sunset'},
            {'headline': 'Datz\n$1 Oysters.\nMon–Fri, 3–6PM.', 'photo_query': 'oysters raw bar seafood ice restaurant platter'},
            {'headline': 'Hattricks\n$5 Margaritas.\nNext to Amalie Arena.', 'photo_query': 'margarita cocktail lime bar sports pub drinks'},
            {'headline': 'Élevage\nHalf-Off Cocktails.\nEpicurean Hotel.', 'photo_query': 'hotel bar elegant cocktails luxury lounge upscale'},
            {'headline': 'Fly Bar\nRooftop Vibes.\nDowntown Tampa.', 'photo_query': 'rooftop bar downtown city view evening outdoor drinks'},
            {'headline': 'Boat Club\nWaterfront Drinks.\nHarbour Island Views.', 'photo_query': 'waterfront bar sunset harbor boats outdoor evening'},
        ],
        'caption': "| Best Happy Hours — Tampa Bay |\n\nTampa's happy hour scene is lowkey one of the best in Florida.\n\n• Datz — $1 oysters, Mon–Fri 3–6PM\n• Hattricks — $5 margs, right next to Amalie Arena\n• Élevage — half-off cocktails at the Epicurean Hotel\n• Fly Bar — rooftop vibes in downtown\n• Boat Club — waterfront drinks, Harbour Island views\n\nSave this for after work.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #happyhour #tampabay #tampadrinks #tampanightlife #TampaPulse #tampalife",
    },
    # ── BRUNCH ──
    {
        'location': 'Tampa Bay', 'topic': 'evergreen:brunch',
        'slides': [
            {'headline': 'Best Brunch Spots\nin Tampa Right Now', 'photo_query': 'brunch food eggs benedict pancakes mimosa plate restaurant'},
            {'headline': 'Oxford Exchange\nThe Aesthetic Alone\nIs Worth the Trip.', 'photo_query': 'beautiful restaurant interior bright airy brunch elegant'},
            {'headline': 'Datz\nBottomless Mimosas.\n$15. Every Weekend.', 'photo_query': 'mimosas champagne brunch glasses orange juice sparkling'},
            {'headline': 'The Breakfast Spot\nNo Frills.\nIncredible Food.', 'photo_query': 'classic breakfast diner eggs bacon toast plate hearty'},
            {'headline': 'Ulele\nRiverwalk Brunch\nwith a View.', 'photo_query': 'waterfront restaurant brunch outdoor dining river view morning'},
            {'headline': 'Daily Eats\nSoHo. Always\nConsistent.', 'photo_query': 'casual restaurant brunch plate avocado toast eggs'},
        ],
        'caption': "| Best Brunch — Tampa Bay |\n\nTampa's brunch scene is seriously underrated.\n\n• Oxford Exchange — the aesthetic alone is worth the trip\n• Datz — bottomless mimosas, $15, every weekend\n• The Breakfast Spot — no frills, incredible food\n• Ulele — Riverwalk brunch with a view\n• Daily Eats — SoHo, always consistent\n\nSave this for Saturday.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabrunch #tampaeats #brunch #tampabay #tampalife #TampaPulse",
    },
    # ── YBOR DEVELOPMENT ──
    {
        'location': 'Ybor City', 'topic': 'evergreen:ybor-development',
        'slides': [
            {'headline': '$800M Development\nApproved for\nYbor City', 'photo_query': 'modern waterfront development construction urban skyline aerial'},
            {'headline': '2,000+ Residential\nUnits Planned\non the Waterfront.', 'photo_query': 'luxury apartment building modern architecture waterfront'},
            {'headline': 'Ground-Floor Retail\nand Restaurants\nThroughout.', 'photo_query': 'mixed use building retail shops restaurants ground floor urban'},
            {'headline': 'A New Public\nWaterfront Park\nConnecting to Riverwalk.', 'photo_query': 'waterfront park green space modern city promenade people'},
            {'headline': 'Expected to Break\nGround Within\nthe Year.', 'photo_query': 'construction site crane building development urban'},
        ],
        'caption': "| Ybor Harbor — Ybor City |\n\nYbor City is about to change. An $800M waterfront development just got approved.\n\n• 2,000+ residential units on the waterfront\n• Ground-floor retail and restaurants\n• A new public waterfront park\n• Direct connection to the Tampa Riverwalk\n\nThis is going to transform East Tampa.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #yborcity #tampabay #development #realestate #tampalife #TampaPulse",
    },
    # ── RIVERWALK ──
    {
        'location': 'Downtown Tampa', 'topic': 'evergreen:riverwalk',
        'slides': [
            {'headline': 'Tampa Riverwalk\nNamed Best Riverwalk\nin the U.S.', 'photo_query': 'city riverwalk waterfront walkway sunset skyline people'},
            {'headline': 'Armature Works\nFood Hall and\nEvent Space.', 'photo_query': 'food hall interior market vendors industrial chic'},
            {'headline': 'Sparkman Wharf\nRestaurants and\nBeer Garden.', 'photo_query': 'outdoor beer garden restaurant waterfront people evening'},
            {'headline': 'Curtis Hixon Park\nWhere All the\nFestivals Happen.', 'photo_query': 'city park green lawn skyline festival outdoor people'},
            {'headline': 'The Florida Aquarium\nRight at the\nSouth End.', 'photo_query': 'aquarium fish underwater colorful marine exhibit'},
            {'headline': '3 Miles. All Free.\nMost Locals Haven\'t\nSeen All of It.', 'photo_query': 'waterfront walkway evening lights city promenade'},
        ],
        'caption': "| Tampa Riverwalk — Downtown Tampa |\n\nThe Tampa Riverwalk just got named the best riverwalk in the U.S. — and most locals still haven't seen all of it.\n\n• Armature Works — food hall and event space\n• Sparkman Wharf — restaurants and beer garden\n• Curtis Hixon Park — where all the festivals happen\n• The Florida Aquarium — at the south end\n\n3 miles. All free. Go this weekend.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #riverwalk #tampabay #tampalife #downtown #TampaPulse #florida",
    },
    # ── CLEARWATER BEACH ──
    {
        'location': 'Clearwater Beach', 'topic': 'evergreen:clearwater',
        'slides': [
            {'headline': 'Clearwater Beach\nRanked #1 Beach\nin the U.S. Again', 'photo_query': 'clearwater beach florida white sand turquoise water sunny'},
            {'headline': 'White Sand That\nDoesn\'t Get Hot.\n30 Min from Tampa.', 'photo_query': 'white sand beach feet ocean shore tropical clear'},
            {'headline': 'Pier 60\nSunset Festival\nEvery Single Night.', 'photo_query': 'beach pier sunset orange sky festival vendors people'},
            {'headline': 'Frenchy\'s\nGrouper Sandwich\nRight on the Beach.', 'photo_query': 'fish sandwich seafood restaurant beach casual food plate'},
            {'headline': 'The Sunsets\nGenuinely Look\nPhotoshopped.', 'photo_query': 'beach sunset dramatic orange purple sky ocean waves'},
        ],
        'caption': "| Clearwater Beach — Pinellas County |\n\nClearwater Beach just got ranked #1 in the U.S. again.\n\n• White sand that doesn't get hot\n• Pier 60 sunset festival every night\n• Frenchy's grouper sandwich — a must\n• 30 minutes from downtown Tampa\n\nGo this weekend.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #clearwaterbeach #florida #beach #tampabay #TampaPulse #travel",
    },
    # ── HYDE PARK SATURDAY ──
    {
        'location': 'Hyde Park', 'topic': 'evergreen:hyde-park',
        'slides': [
            {'headline': 'How to Do a Perfect\nSaturday in\nHyde Park', 'photo_query': 'outdoor cafe brunch tree lined street sunny boutique'},
            {'headline': 'Morning\nBuddy Brew Coffee\non the Porch.', 'photo_query': 'coffee shop morning latte outdoor patio cozy'},
            {'headline': 'Brunch\nOxford Exchange.\nGet There Early.', 'photo_query': 'beautiful brunch restaurant bright interior elegant plate'},
            {'headline': 'Afternoon\nHyde Park Village.\nBoutiques + Bookstores.', 'photo_query': 'boutique shopping village outdoor walkway stores upscale'},
            {'headline': 'Evening\nWine Bar Crawl\nDown Swann Ave.', 'photo_query': 'wine bar glasses evening cozy friends intimate'},
        ],
        'caption': "| Weekend Guide — Hyde Park |\n\nHyde Park is where Tampa locals actually spend their weekends.\n\n• Morning: Buddy Brew Coffee on the porch\n• Brunch: Oxford Exchange — get there early\n• Afternoon: Hyde Park Village — boutiques, bookstores\n• Evening: Wine bar crawl down Swann Ave\n\nTree-lined streets, walkable, zero tourists.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #hydepark #tampabay #brunch #tampalife #TampaPulse #tampaflorida",
    },
    # ── HIDDEN GEMS ──
    {
        'location': 'Tampa Bay', 'topic': 'evergreen:hidden-gems',
        'slides': [
            {'headline': '7 Hidden Gems\nin Tampa Most\nLocals Don\'t Know', 'photo_query': 'speakeasy cocktail bar dark moody hidden secret'},
            {'headline': 'A Speakeasy Behind\na Bookshelf\nin SoHo.', 'photo_query': 'hidden bar bookshelf secret door entrance speakeasy'},
            {'headline': 'A Rooftop You Can\nOnly Reach by\nFreight Elevator.', 'photo_query': 'rooftop secret view city industrial elevator urban'},
            {'headline': 'A Cuban Coffee\nWindow Open\nSince the 1950s.', 'photo_query': 'cuban coffee espresso window counter vintage old school'},
            {'headline': 'A Tiki Bar Hidden\nInside a Hotel\nLobby.', 'photo_query': 'tiki bar tropical cocktails rum bamboo colorful exotic'},
            {'headline': 'A Brewery That\nDoubles as a\nVintage Arcade.', 'photo_query': 'arcade brewery retro games beer neon lights fun'},
        ],
        'caption': "| Hidden Gems — Tampa Bay |\n\nTampa has way more going on than most people realize.\n\n• A speakeasy behind a bookshelf in SoHo\n• A rooftop you can only reach by freight elevator\n• A Cuban coffee window open since the 1950s\n• A tiki bar hidden inside a hotel lobby\n• A brewery that doubles as a vintage arcade\n\nSave this. You'll need it.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabay #hiddengems #tampalife #speakeasy #TampaPulse #tampanightlife",
    },
    # ── CUBAN RESTAURANT ──
    {
        'location': 'Ybor City', 'topic': 'evergreen:cuban-ybor',
        'slides': [
            {'headline': 'New Cuban\nRestaurant Just\nOpened in Ybor', 'photo_query': 'cuban sandwich pressed crispy restaurant food close up'},
            {'headline': 'The Cubano Is\nAlready Being Called\nthe Best in Tampa.', 'photo_query': 'cuban pressed sandwich cross section ham cheese pickles'},
            {'headline': 'Hand-Rolled Cigars\non the Patio.\nAll Day.', 'photo_query': 'cigar rolling hand made tobacco craft traditional cuban'},
            {'headline': 'Live Latin Music\nEvery Friday\nand Saturday.', 'photo_query': 'latin music live band salsa restaurant dancing night'},
            {'headline': 'Open for Lunch\nand Dinner.\nTues–Sun.', 'photo_query': 'cuban restaurant interior colorful warm latin decor tables'},
        ],
        'caption': "| New Cuban Spot — Ybor City |\n\nYbor just got another Cuban restaurant — and the Cubano is already being called the best in Tampa.\n\n• Hand-rolled cigars on the patio\n• Live Latin music Friday and Saturday\n• Pressed Cubanos worth the drive\n• Open Tues–Sun\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #yborcity #cubanfood #tampaeats #tampabay #TampaPulse #tamparestaurants",
    },
    # ── BUSCH GARDENS ──
    {
        'location': 'North Tampa', 'topic': 'evergreen:busch-gardens',
        'slides': [
            {'headline': 'Busch Gardens Just\nAnnounced a\nNew Coaster', 'photo_query': 'roller coaster theme park tall ride exciting amusement'},
            {'headline': '200+ Feet Tall.\nTallest Coaster\nin Florida.', 'photo_query': 'roller coaster tall steep drop blue sky exciting'},
            {'headline': '70 MPH Top Speed.\nFaster Than Anything\nin Orlando.', 'photo_query': 'roller coaster speed motion blur fast amusement park'},
            {'headline': 'Opening 2027.\nIt Beats Every\nOrlando Park.', 'photo_query': 'theme park aerial landscape florida green sunny'},
            {'headline': 'Tampa\'s Theme Park\nKeeps Quietly\nGetting Better.', 'photo_query': 'amusement park entrance crowd fun family theme park'},
        ],
        'caption': "| Busch Gardens — North Tampa |\n\nBusch Gardens just announced a new coaster — tallest in Florida.\n\n• 200+ feet tall\n• 70 MPH top speed\n• Opens 2027\n• Taller and faster than anything in Orlando\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #buschgardens #tampabay #rollercoaster #florida #TampaPulse #themepark",
    },
    # ── CHANNELSIDE ──
    {
        'location': 'Channelside', 'topic': 'evergreen:channelside',
        'slides': [
            {'headline': 'Channelside Is Tampa\'s\nFastest Growing\nNeighborhood', 'photo_query': 'modern urban waterfront neighborhood restaurants new buildings'},
            {'headline': 'Sparkman Wharf\nOutdoor Restaurants\nand Beer Garden.', 'photo_query': 'outdoor restaurant beer garden waterfront evening lights people'},
            {'headline': 'New Apartments and\nCondos Going Up\nEvery Month.', 'photo_query': 'luxury apartment building modern architecture waterfront new'},
            {'headline': 'Walking Distance\nto Amalie Arena\nand the Riverwalk.', 'photo_query': 'sports arena exterior evening lights city downtown'},
            {'headline': 'The Food Scene\nHere Is Moving\nFast.', 'photo_query': 'trendy restaurant interior modern food plating chef'},
        ],
        'caption': "| Channelside — Downtown Tampa |\n\nChannelside is Tampa's fastest growing neighborhood.\n\n• Sparkman Wharf — outdoor restaurants and beer garden\n• New apartments going up every month\n• Walking distance to Amalie Arena and the Riverwalk\n• The food scene here is moving fast\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #channelside #tampabay #tampaflorida #tampalife #TampaPulse #newrestaurant",
    },
    # ── TOP 10 FOOD CITY ──
    {
        'location': 'Tampa Bay', 'topic': 'evergreen:top-food-city',
        'slides': [
            {'headline': 'Tampa Named\nTop 10 Cities\nfor Food in 2026', 'photo_query': 'gourmet food plate fine dining restaurant elegant'},
            {'headline': 'Bern\'s Steak House\nThe Wine Cellar\nIs Legendary.', 'photo_query': 'wine cellar restaurant underground barrels elegant'},
            {'headline': 'Columbia Restaurant\nFlorida\'s Oldest.\nYbor Since 1905.', 'photo_query': 'historic restaurant interior elegant spanish tile classic'},
            {'headline': 'Rooster & the Till\nFarm-to-Table in\nSeminole Heights.', 'photo_query': 'farm to table dish seasonal fresh plating restaurant'},
            {'headline': 'The Cuban\nSandwich Capital\nof the World.', 'photo_query': 'cuban sandwich pressed traditional tampa food iconic'},
        ],
        'caption': "| Tampa's Food Scene — Tampa Bay |\n\nTampa just got named one of the top 10 cities for food in 2026.\n\n• Bern's Steak House — the wine cellar is legendary\n• Columbia Restaurant — Florida's oldest, Ybor since 1905\n• Rooster & the Till — farm-to-table in Seminole Heights\n• Tampa is the Cuban Sandwich Capital of the World\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampaeats #tampafood #tamparestaurants #tampabay #TampaPulse #foodie",
    },
    # ── FLOOD PLAN ──
    {
        'location': 'Bayshore Blvd', 'topic': 'evergreen:flood-plan',
        'slides': [
            {'headline': 'Hillsborough County\nApproves $70M\nFlood Plan', 'photo_query': 'coastal infrastructure seawall construction waterfront city'},
            {'headline': 'Bayshore Boulevard\nSeawall Getting\nMajor Upgrades.', 'photo_query': 'bayshore boulevard tampa waterfront palm trees road'},
            {'headline': 'Davis Islands\nStorm Surge\nBarriers Planned.', 'photo_query': 'island neighborhood aerial waterfront homes coastal'},
            {'headline': 'South Tampa\nDrainage Upgrades\nIncluded.', 'photo_query': 'urban infrastructure drainage construction pipes city'},
            {'headline': 'Construction Starts\nThis Year.\n3-Year Timeline.', 'photo_query': 'construction workers building infrastructure crane city'},
        ],
        'caption': "| Flood Protection — Hillsborough County |\n\nHillsborough County just approved a $70M flood protection plan.\n\n• Bayshore Boulevard seawall improvements\n• Davis Islands storm surge barriers\n• South Tampa drainage upgrades\n• Construction starts this year, 3-year timeline\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabay #hillsborough #flooding #infrastructure #TampaPulse #tampalife",
    },
    # ── RAYS STADIUM ──
    {
        'location': 'Ybor City', 'topic': 'evergreen:rays-stadium',
        'slides': [
            {'headline': 'Rays Stadium\nUpdate: What\nWe Know', 'photo_query': 'baseball stadium construction sports arena building'},
            {'headline': '$1.3 Billion\nProject in\nYbor City.', 'photo_query': 'modern stadium rendering architecture sports arena design'},
            {'headline': '30,000 Seats.\nExpected to Open\nby 2028.', 'photo_query': 'baseball field interior stadium seats crowd'},
            {'headline': 'Entertainment\nDistrict with Shops\nand Restaurants.', 'photo_query': 'entertainment district shops restaurants urban walkable night'},
            {'headline': 'This Will Transform\nEast Tampa\nCompletely.', 'photo_query': 'city development construction skyline growth urban'},
        ],
        'caption': "| Rays Stadium — Ybor City |\n\nThe $1.3B Tampa Bay Rays stadium in Ybor City is moving forward.\n\n• 30,000 seats\n• Opens by 2028\n• Surrounding entertainment district\n• Will transform East Tampa\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #rays #tampabay #tampabayrays #yborcity #TampaPulse #sports",
    },
    # ── CRUISE TERMINAL ──
    {
        'location': 'Channelside', 'topic': 'evergreen:cruise-terminal',
        'slides': [
            {'headline': 'Port Tampa Bay\nGetting a $30M\nCruise Terminal', 'photo_query': 'cruise ship port terminal large vessel harbor dock'},
            {'headline': 'Tampa Is Now a\nTop 5 Cruise Port\nin the U.S.', 'photo_query': 'cruise ship deck ocean sunset vacation travel luxury'},
            {'headline': 'Carnival, Royal\nCaribbean, Celebrity\nAll Sail from Tampa.', 'photo_query': 'cruise ship large colorful port docked tropical'},
            {'headline': 'New Terminal\nExpected to Open\nby 2027.', 'photo_query': 'modern terminal building architecture glass steel'},
            {'headline': 'Direct Access\nfrom I-275.\nEasy In, Easy Out.', 'photo_query': 'highway road city approach skyline driving urban'},
        ],
        'caption': "| Port Tampa Bay — Channelside |\n\nPort Tampa Bay is getting a $30M cruise terminal upgrade.\n\n• Tampa is now a top 5 cruise port in the U.S.\n• Carnival, Royal Caribbean, Celebrity — all from Tampa\n• New terminal by 2027\n• Direct I-275 access\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #cruise #tampabay #travel #porttampabay #TampaPulse #florida",
    },
    # ── GASPARILLA MUSIC FEST ──
    {
        'location': 'Curtis Hixon Park', 'topic': 'evergreen:gasparilla-music',
        'slides': [
            {'headline': 'Gasparilla Music\nFestival Returns\nThis Spring', 'photo_query': 'outdoor music festival crowd stage lights night concert'},
            {'headline': '2 Days. 3 Stages.\n50+ Artists on\nthe Riverwalk.', 'photo_query': 'live music festival band stage outdoor crowd dancing'},
            {'headline': 'Past Headliners:\nThe Chainsmokers,\nMumford & Sons.', 'photo_query': 'famous musician concert stage crowd cheering lights'},
            {'headline': 'Food Vendors from\nTampa\'s Best\nRestaurants.', 'photo_query': 'food vendor festival outdoor street food stand'},
            {'headline': 'Afterparties in\nYbor and SoHo\nAll Weekend.', 'photo_query': 'nightlife party bar crowd dancing music night'},
        ],
        'caption': "| Gasparilla Music Festival — Downtown Tampa |\n\nGMF is back at Curtis Hixon Park. 2 days, 3 stages, 50+ artists — right on the Riverwalk.\n\n• Past headliners: The Chainsmokers, Mumford & Sons\n• Food vendors from Tampa's best restaurants\n• Afterparties in Ybor and SoHo\n• Tickets sell out\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #gasparilla #GMF #tampabay #livemusic #tampaevents #TampaPulse",
    },
    # ── SOHO NIGHT OUT ──
    {
        'location': 'South Howard', 'topic': 'evergreen:soho-night-out',
        'slides': [
            {'headline': 'Your Guide to a\nPerfect Night Out\nin SoHo', 'photo_query': 'walkable city street restaurants bars night outdoor'},
            {'headline': 'Start at Datz.\n$1 Oysters\nDuring Happy Hour.', 'photo_query': 'oysters seafood restaurant bar happy hour platter'},
            {'headline': 'Then: Ciro\'s\nSpeakeasy.\nBehind the Bookshelf.', 'photo_query': 'speakeasy bar cocktails dark moody hidden entrance'},
            {'headline': 'Late Night:\nMacDinton\'s.\nTampa\'s Best Irish Pub.', 'photo_query': 'irish pub bar night lively crowd drinks music'},
            {'headline': '1 Street. 30+ Spots.\nThis Is South\nHoward Ave.', 'photo_query': 'street night restaurant row lights outdoor dining people'},
        ],
        'caption': "| Night Out Guide — SoHo |\n\nSoHo is Tampa's most walkable neighborhood for a night out. Here's how to do it:\n\n• Start at Datz — $1 oysters during happy hour\n• Then: Ciro's Speakeasy — behind the bookshelf\n• Late night: MacDinton's — Tampa's best Irish pub\n\n1 street. 30+ spots. This is South Howard Ave.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #soho #tampabay #tampanightlife #tampalife #TampaPulse #tampaflorida",
    },
    # ── OUTDOOR ADVENTURES ──
    {
        'location': 'Tampa Bay', 'topic': 'evergreen:outdoor-adventures',
        'slides': [
            {'headline': 'Best Outdoor\nAdventures in\nTampa Bay', 'photo_query': 'kayaking clear water mangroves nature florida outdoor'},
            {'headline': 'Kayak with\nManatees at\nWeeki Wachee.', 'photo_query': 'manatee clear spring water kayak nature wildlife florida'},
            {'headline': 'Paddleboard\nSunrise at\nBallast Point.', 'photo_query': 'paddleboard sunrise calm water bay morning golden'},
            {'headline': 'Bike the\nPinellas Trail.\n75 Miles of Coast.', 'photo_query': 'cycling bike trail coast beach florida scenic path'},
            {'headline': 'Hillsborough River\nState Park.\n30 Min from Downtown.', 'photo_query': 'state park river hiking trail nature trees florida'},
        ],
        'caption': "| Outdoor Adventures — Tampa Bay |\n\nTampa Bay has some of the best outdoor activities in Florida.\n\n• Kayak with manatees at Weeki Wachee\n• Paddleboard sunrise at Ballast Point\n• Bike the Pinellas Trail — 75 miles of coast\n• Hillsborough River State Park — 30 min from downtown\n\nGet outside this weekend.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabay #outdoor #kayaking #florida #TampaPulse #nature",
    },
    # ── BEST COFFEE SHOPS ──
    {
        'location': 'Tampa Bay', 'topic': 'evergreen:coffee-shops',
        'slides': [
            {'headline': 'Best Coffee Shops\nin Tampa for\nRemote Work', 'photo_query': 'coffee shop laptop remote work cozy modern cafe'},
            {'headline': 'Buddy Brew\nHyde Park.\nTampa\'s OG.', 'photo_query': 'coffee latte art pour barista craft specialty'},
            {'headline': 'Foundation Coffee\nYbor City.\nIndustrial Vibes.', 'photo_query': 'industrial coffee shop interior exposed brick modern'},
            {'headline': 'Bandit Coffee\nSt. Pete.\nWorth the Drive.', 'photo_query': 'minimalist coffee shop bright clean modern design'},
            {'headline': 'King State\nSeminole Heights.\nAll-Day Café + Bar.', 'photo_query': 'cafe bar hybrid coffee cocktails daytime cozy'},
        ],
        'caption': "| Best Coffee Shops — Tampa Bay |\n\nNeed a spot to work from? Tampa's coffee scene has you covered.\n\n• Buddy Brew — Hyde Park. Tampa's OG.\n• Foundation Coffee — Ybor City. Industrial vibes.\n• Bandit Coffee — St. Pete. Worth the drive.\n• King State — Seminole Heights. Café by day, bar by night.\n\nAll have WiFi, power outlets, and good vibes.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #coffee #tampabay #remotework #tampalife #TampaPulse #cafe",
    },
    # ── BEST TACOS ──
    {
        'location': 'Tampa Bay', 'topic': 'evergreen:best-tacos',
        'slides': [
            {'headline': 'Best Tacos\nin Tampa —\nRanked by Locals', 'photo_query': 'tacos mexican food colorful plate authentic street'},
            {'headline': 'Taco Bus\nThe Original.\nSeminole Heights.', 'photo_query': 'taco bus food truck mexican street food authentic'},
            {'headline': 'Casita Taqueria\nHand-Pressed Tortillas.\nSouth Tampa.', 'photo_query': 'handmade tortillas taco fresh authentic restaurant'},
            {'headline': 'Rene\'s Mexican\nKitchen. Birria Tacos\nThat Go Viral.', 'photo_query': 'birria tacos consomme dipping red spicy mexican'},
            {'headline': 'Taco Dirty\nLate Night.\nSoHo Strip.', 'photo_query': 'late night taco stand street food crowd hungry'},
        ],
        'caption': "| Best Tacos — Tampa Bay |\n\nTampa's taco scene is seriously slept on.\n\n• Taco Bus — the original, Seminole Heights\n• Casita Taqueria — hand-pressed tortillas, South Tampa\n• Rene's Mexican Kitchen — birria tacos that go viral\n• Taco Dirty — late night, SoHo strip\n\nSave this for Taco Tuesday.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tacos #tampaeats #tampafood #tampabay #TampaPulse #mexican",
    },
]

# ═══════════════════════════════════════════════════════════════════
# FONTS
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

# ═══════════════════════════════════════════════════════════════════
# PHOTO FETCH
# ═══════════════════════════════════════════════════════════════════

def get_photo(q):
    r = requests.get('https://api.pexels.com/v1/search',
        headers={'Authorization': PX},
        params={'query': q, 'orientation': 'portrait', 'per_page': 15}, timeout=15)
    pics = r.json().get('photos', [])
    if not pics:
        print('  NO PHOTOS for: ' + q)
        return None
    url = random.choice(pics[:8])['src']['large2x']
    print('  Got photo: ' + url[:80])
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

# ═══════════════════════════════════════════════════════════════════
# TAMPA TOMORROW STYLE SLIDE RENDERER
# ═══════════════════════════════════════════════════════════════════

def draw_slide(photo, headline, location, slide_num):
    img = fitimg(photo.copy())

    # Subtle bottom gradient
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(ov)
    grad_start = int(H * 0.50)
    for y in range(grad_start, H):
        p = (y - grad_start) / (H - grad_start)
        a = min(int((p ** 1.1) * 210), 210)
        d_ov.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)

    MARGIN = 48
    ACCENT = (255, 90, 54)
    WHITE  = (255, 255, 255)

    # Location tag
    f_loc = ft(24)
    d.text((MARGIN, H - 310), '📍 ' + location.upper(), font=f_loc, fill=(*ACCENT, 240))

    # Headline
    f_head = ft(68)
    head_lines = headline.split('\n')
    y = H - 275
    for line in head_lines:
        d.text((MARGIN, y), line, font=f_head, fill=(*WHITE, 255))
        y += 76

    # Watermark
    f_wm = ft(20)
    wm = 'TAMPAPULSE'
    bb = f_wm.getbbox(wm)
    wm_w = bb[2] - bb[0]
    d.text((W - MARGIN - wm_w, H - 44), wm, font=f_wm, fill=(*WHITE, 140))

    out_path = OUT / f'slide_{slide_num}.png'
    img.convert('RGB').save(out_path, quality=95)
    print(f'  Saved {out_path.name}: {out_path.stat().st_size} bytes')
    return out_path

# ═══════════════════════════════════════════════════════════════════
# MAIN — SELECTION LOGIC
# ═══════════════════════════════════════════════════════════════════

print('=== LOADING POST LOG ===')
log = load_log()
recent = recently_posted(log)
print(f'Recently posted ({REPOST_DAYS}d): {len(recent)} topics')

# Tier 1: Try Ticketmaster first
print('\n=== TIER 1: TICKETMASTER EVENTS ===')
tm_posts = fetch_ticketmaster_events()
fresh_events = [p for p in tm_posts if p['topic'] not in recent]
print(f'Fresh events not yet posted: {len(fresh_events)}')

post = None

if fresh_events:
    post = random.choice(fresh_events[:5])  # pick from top 5 soonest
    print(f'SELECTED EVENT: {post["topic"]}')
else:
    # Tier 2: Evergreen pool
    print('\n=== TIER 2: EVERGREEN POOL ===')
    fresh_evergreen = [p for p in EVERGREEN if p['topic'] not in recent]
    print(f'Fresh evergreen not yet posted: {len(fresh_evergreen)} / {len(EVERGREEN)}')

    if fresh_evergreen:
        post = random.choice(fresh_evergreen)
    else:
        # All posted recently — pick the oldest one
        print('All evergreen posted recently — picking oldest')
        topic_times = {e['topic']: e['timestamp'] for e in log if e['topic'].startswith('evergreen:')}
        EVERGREEN.sort(key=lambda p: topic_times.get(p['topic'], ''))
        post = EVERGREEN[0]

    print(f'SELECTED EVERGREEN: {post["topic"]}')

# Generate and post
print(f'\n=== FETCHING PHOTOS ({len(post["slides"])} slides) ===')
photos = []
for i, s in enumerate(post['slides']):
    print(f'Photo for slide {i+1}: {s["photo_query"]}')
    photo = get_photo(s['photo_query'])
    if not photo:
        photo = get_photo('tampa florida city outdoor lifestyle')
    if not photo:
        print('FATAL: Could not get photo for slide ' + str(i+1)); exit(1)
    photos.append(photo)

print('\n=== GENERATING SLIDES ===')
slide_paths = []
for i, s in enumerate(post['slides'], 1):
    print(f'Slide {i}...')
    slide_paths.append(draw_slide(photos[i-1], s['headline'], post['location'], i))

print('\n=== CHECKING FILES ===')
for s in slide_paths:
    sz = s.stat().st_size
    print(f'  {s.name}: {sz} bytes')
    if sz < 50000:
        print('  WARNING: File too small!'); exit(1)

print('\n=== POSTING TO INSTAGRAM ===')
IG = 'https://graph.facebook.com/v25.0/' + ACCT
urls = []
for s in slide_paths:
    print('Uploading ' + s.name + '...')
    with open(s, 'rb') as f:
        r = requests.post('https://catbox.moe/user/api.php',
            data={'reqtype': 'fileupload'}, files={'fileToUpload': f}, timeout=60)
        if r.status_code == 200 and r.text.startswith('https://'):
            urls.append(r.text.strip()); print('  ' + r.text.strip())
        else:
            print('  UPLOAD FAILED: ' + r.text); exit(1)

children = []
for u in urls:
    r = requests.post(IG+'/media', json={'image_url':u,'is_carousel_item':True,'access_token':TOKEN}, timeout=30)
    print('  Container: ' + r.text[:120])
    r.raise_for_status()
    children.append(r.json()['id'])

print('Waiting 15s...')
time.sleep(15)
cr = requests.post(IG+'/media', json={'media_type':'CAROUSEL','children':','.join(children),'caption':post['caption'],'access_token':TOKEN}, timeout=30)
print('Carousel: ' + cr.text[:120])
cr.raise_for_status()
cid = cr.json()['id']

print('Waiting 15s...')
time.sleep(15)
pub = requests.post(IG+'/media_publish', json={'creation_id':cid,'access_token':TOKEN}, timeout=30)
print('Publish: ' + pub.text[:120])
pub.raise_for_status()
ig_id = pub.json()['id']
print(f'\nPOSTED! ID: {ig_id}')

# Save to log
save_log(log, post['topic'], ig_id)
print('DONE.')
