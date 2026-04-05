import os, random, textwrap, time, glob, requests
from io import BytesIO
from pathlib import Path
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

# Each slide has its own photo query so images match the content
POSTS = [
    {
        'slides': [
            {
                'headline': 'TAMPA RIVERWALK IS ONE OF THE BEST RIVERWALKS IN THE U.S.',
                'body':     'The Tampa Riverwalk stretches 3 miles of waterfront — bars, parks, and sunset views the whole way.',
                'query':    'city waterfront riverwalk people walking sunset',
            },
            {
                'headline': '3 MILES OF WATERFRONT. BARS, PARKS, AND VIEWS THE WHOLE WAY.',
                'body':     'Free to explore. Most locals still haven\'t seen all of it. Save this and go this weekend.',
                'query':    'waterfront park outdoor people sunny city',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE — YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems, and weekend plans. Free.',
                'query':    'tampa bay florida waterfront skyline aerial',
            },
        ],
        'caption': "The Tampa Riverwalk is 3 miles of waterfront most locals still haven't fully explored.\n\nBars. Parks. Sunset views. All free.\n\nSave this and go this weekend.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabay #riverwalk #tampaflorida #tampalife #TampaPulse #unlocktampabay",
    },
    {
        'slides': [
            {
                'headline': 'YBOR CITY IS TAMPA\'S MOST UNDERRATED NEIGHBORHOOD',
                'body':     'Historic bars, Cuban food, late nights, and rooftop views — all in one square mile.',
                'query':    'historic neighborhood night street bars neon lights',
            },
            {
                'headline': 'CUBAN FOOD, CRAFT COCKTAILS, AND NIGHTLIFE — ALL IN ONE PLACE',
                'body':     'This is the real Tampa experience most tourists completely miss.',
                'query':    'cuban food restaurant colorful outdoor dining',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE — YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems, and weekend plans. Free.',
                'query':    'rooftop bar nightlife city skyline',
            },
        ],
        'caption': "Ybor City isn't just a bar strip — it's Tampa's most historic neighborhood.\n\nCuban food. Craft cocktails. Rooftop bars. All in one place.\n\nSave this and plan your night.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #yborcity #tampabay #tampanightlife #tampalife #TampaPulse #tampaflorida",
    },
    {
        'slides': [
            {
                'headline': 'THE BEST WATERFRONT RESTAURANTS IN TAMPA BAY',
                'body':     'Views, food, and vibes — all in one. These are the spots locals actually go to.',
                'query':    'waterfront outdoor restaurant dining ocean view',
            },
            {
                'headline': 'SAVE THIS FOR YOUR NEXT DATE NIGHT IN TAMPA',
                'body':     'These spots fill up fast on weekends. Now you know where to go.',
                'query':    'romantic dinner restaurant couple candles outdoor',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE — YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems, and weekend plans. Free.',
                'query':    'sunset waterfront drinks cocktails outdoor bar',
            },
        ],
        'caption': "Tampa's best waterfront restaurants — views, food, and vibes all in one.\n\nSave this for your next date night or weekend plans.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampaeats #tampabay #tampafood #datenight #tamparestaurants #TampaPulse",
    },
    {
        'slides': [
            {
                'headline': 'HYDE PARK IS WHERE TAMPA LOCALS ACTUALLY SPEND THEIR WEEKENDS',
                'body':     'Brunch spots, boutique shopping, tree-lined streets, and great coffee.',
                'query':    'tree lined street outdoor brunch shopping boutique',
            },
            {
                'headline': 'YOUR GAME PLAN FOR A PERFECT SATURDAY IN HYDE PARK',
                'body':     'Morning coffee. Brunch. Shopping. Evening drinks. This is how locals do it.',
                'query':    'outdoor brunch coffee morning people street cafe',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE — YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems, and weekend plans. Free.',
                'query':    'neighborhood park people weekend outdoor sunny',
            },
        ],
        'caption': "Hyde Park is where Tampa locals actually spend their weekends.\n\nBrunch spots. Boutique shopping. Tree-lined streets. Great coffee.\n\nSave this and go this Saturday.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #hydepark #tampabay #tampaflorida #brunch #tampalife #TampaPulse",
    },
    {
        'slides': [
            {
                'headline': 'CLEARWATER BEACH IS 30 MINUTES FROM TAMPA — AND IT\'S WORLD CLASS',
                'body':     'Consistently ranked one of the best beaches in the United States.',
                'query':    'white sand beach clear water tropical sunny people',
            },
            {
                'headline': 'WHITE SAND. TURQUOISE WATER. SUNSETS THAT ACTUALLY HIT.',
                'body':     'Plan your next weekend trip here. You won\'t regret it. Save this post.',
                'query':    'beach sunset orange sky silhouette ocean waves',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE — YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems, and weekend plans. Free.',
                'query':    'florida gulf coast beach aerial turquoise water',
            },
        ],
        'caption': "Clearwater Beach is 30 minutes from Tampa and consistently ranked one of the best beaches in the U.S.\n\nWhite sand. Turquoise water. Sunsets that actually hit.\n\nSave this for your next weekend trip.\n\nFollow @thetampapulse — your weekly cheat code to Tampa Bay.\n\n#tampa #clearwaterbeach #tampabay #florida #beach #weekend #TampaPulse",
    },
    {
        'slides': [
            {
                'headline': 'CHANNELSIDE IS TAMPA\'S FASTEST GROWING NEIGHBORHOOD',
                'body':     'New restaurants, rooftop bars, waterfront views, and walkable streets.',
                'query':    'modern urban neighborhood rooftop bar city waterfront',
            },
            {
                'headline': 'NEW SPOTS OPENING EVERY MONTH — HERE\'S WHAT\'S WORTH YOUR TIME',
                'body':     'The food scene here is moving fast. Save this before these spots get packed.',
                'query':    'trendy restaurant bar city modern interior',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE — YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems, and weekend plans. Free.',
                'query':    'city skyline waterfront night lights urban',
            },
        ],
        'caption': "Channelside is Tampa's fastest growing neighborhood — and it's moving fast.\n\nNew restaurants. Rooftop bars. Waterfront views.\n\nSave this before these spots get packed.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #channelside #tampabay #tampaflorida #tampalife #TampaPulse #newrestaurant",
    },
    {
        'slides': [
            {
                'headline': 'THE BEST HAPPY HOURS IN TAMPA — RANKED BY LOCALS',
                'body':     'Craft cocktails, oysters, and rooftop drinks. These are the spots worth your time.',
                'query':    'happy hour cocktails bar friends outdoor rooftop',
            },
            {
                'headline': '$5 DRINKS AND ROOFTOP VIEWS — THIS IS HOW TAMPA DOES HAPPY HOUR',
                'body':     'Monday through Friday, 3-7PM. Save this for after work.',
                'query':    'cocktail drinks bar sunset rooftop city view',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE — YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems, and weekend plans. Free.',
                'query':    'friends laughing drinks outdoor bar evening',
            },
        ],
        'caption': "The best happy hours in Tampa — ranked by locals.\n\nCraft cocktails, oysters, and rooftop drinks.\n\nSave this for after work.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #happyhour #tampabay #tampanightlife #tampaeats #tampalife #TampaPulse",
    },
    {
        'slides': [
            {
                'headline': 'SOHO IS TAMPA\'S MOST WALKABLE NEIGHBORHOOD — AND MOST LOCALS SLEEP ON IT',
                'body':     'Restaurant row, brunch spots, late night bars, and boutique shops all on one street.',
                'query':    'walkable city street restaurants bars night outdoor',
            },
            {
                'headline': 'ONE STREET. 30+ RESTAURANTS. THIS IS SOUTH HOWARD AVE.',
                'body':     'Locals call it SoHo. It\'s Tampa\'s best kept secret for eating and drinking.',
                'query':    'outdoor patio restaurant friends dining evening',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE — YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems, and weekend plans. Free.',
                'query':    'neighborhood street night lights restaurants people',
            },
        ],
        'caption': "SoHo is Tampa's most walkable neighborhood — and most locals sleep on it.\n\nRestaurant row, brunch spots, late night bars, and boutique shops all on one strip.\n\nSave this for your next night out.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #soho #tampabay #tampaflorida #tamparestaurants #tampalife #TampaPulse",
    },
]

post = random.choice(POSTS)

def ft(sz):
    for p in [
        '/usr/local/share/fonts/Oswald-Bold.ttf',
        '/usr/share/fonts/truetype/urw-base35/NimbusSans-Bold.otf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        'C:/Windows/Fonts/impact.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
        'Montserrat-ExtraBold.ttf',
    ]:
        try: return ImageFont.truetype(p, sz)
        except: pass
    return ImageFont.load_default()

def ft_regular(sz):
    for p in [
        '/usr/local/share/fonts/Oswald-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        'C:/Windows/Fonts/arial.ttf',
    ]:
        try: return ImageFont.truetype(p, sz)
        except: pass
    return ImageFont.load_default()

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

def dark_overlay(img, start=0.48):
    ov = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(ov)
    gt = int(H * start)
    for y in range(gt, H):
        p = (y - gt) / (H - gt)
        a = min(int((p ** 0.75) * 245), 245)
        d.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    return Image.alpha_composite(img, ov)

def draw_slide(photo, headline, body, slide_num):
    img = fitimg(photo.copy())
    img = dark_overlay(img)
    d = ImageDraw.Draw(img)

    MARGIN  = 48
    MAX_W   = W - MARGIN * 2
    f_brand = ft(30)
    f_head  = ft(100)
    f_body  = ft_regular(34)
    f_url   = ft(32)

    d.text((MARGIN, 48), 'TAMPA PULSE', font=f_brand, fill=(255, 255, 255, 190))

    head_lines = []
    for part in headline.split('\n'):
        words = part.split()
        cur = ''
        for w in words:
            test = (cur + ' ' + w).strip()
            if f_head.getbbox(test)[2] - f_head.getbbox(test)[0] <= MAX_W:
                cur = test
            else:
                if cur: head_lines.append(cur)
                cur = w
        if cur: head_lines.append(cur)

    body_lines = []
    words = body.split()
    cur = ''
    for w in words:
        test = (cur + ' ' + w).strip()
        if f_body.getbbox(test)[2] - f_body.getbbox(test)[0] <= MAX_W:
            cur = test
        else:
            if cur: body_lines.append(cur)
            cur = w
    if cur: body_lines.append(cur)

    LINE_H_HEAD = 108
    LINE_H_BODY = 44
    DIVIDER_H   = 6
    GAP         = 18
    URL_H       = 40
    BOTTOM_PAD  = 52

    total_h = (len(head_lines) * LINE_H_HEAD + GAP + DIVIDER_H + GAP
               + len(body_lines) * LINE_H_BODY + 28 + URL_H + BOTTOM_PAD)

    y = H - total_h

    for line in head_lines:
        bb = f_head.getbbox(line)
        tw = bb[2] - bb[0]
        d.text(((W - tw) // 2, y), line, font=f_head, fill=(255, 255, 255, 255))
        y += LINE_H_HEAD

    y += GAP
    d.rectangle([(MARGIN, y), (W - MARGIN, y + DIVIDER_H)], fill=(255, 90, 54, 230))
    y += DIVIDER_H + GAP

    for line in body_lines:
        bb = f_body.getbbox(line)
        tw = bb[2] - bb[0]
        d.text(((W - tw) // 2, y), line, font=f_body, fill=(255, 255, 255, 200))
        y += LINE_H_BODY

    bb = f_url.getbbox('MYTAMPAPULSE.COM')
    tw = bb[2] - bb[0]
    d.text(((W - tw) // 2, H - BOTTOM_PAD - URL_H), 'MYTAMPAPULSE.COM', font=f_url, fill=(255, 255, 255, 220))

    out_path = OUT / f'slide_{slide_num}.png'
    img.convert('RGB').save(out_path, quality=95)
    print(f'  Saved {out_path.name}: {out_path.stat().st_size} bytes')
    return out_path

print('=== FETCHING PHOTOS ===')
photos = []
for i, s in enumerate(post['slides']):
    print(f'Photo for slide {i+1}: {s["query"]}')
    photo = get_photo(s['query'])
    if not photo:
        photo = get_photo('city people outdoor sunny lifestyle')
    if not photo:
        print('FATAL: Could not get photo for slide ' + str(i+1)); exit(1)
    photos.append(photo)
print('Photos ready!\n')

print('=== GENERATING SLIDES ===')
slide_paths = []
for i, s in enumerate(post['slides'], 1):
    print(f'Slide {i}...')
    slide_paths.append(draw_slide(photos[i-1], s['headline'], s['body'], i))

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
print('\nPOSTED! ID: ' + pub.json()['id'])
