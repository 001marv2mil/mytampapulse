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

# Rotating content — picks one set per run
POSTS = [
    {
        'query':   'tampa waterfront skyline aerial',
        'slides': [
            {
                'headline': 'TAMPA RIVERWALK IS ONE OF THE BEST IN THE U.S.',
                'body':     'The Tampa Riverwalk stretches 3 miles of waterfront — bars, parks, and sunset views the whole way.',
            },
            {
                'headline': '3 MILES OF WATERFRONT MOST LOCALS HAVEN\'T FULLY EXPLORED',
                'body':     'Free to walk. Packed with spots. Save this and go this weekend.',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE FOR YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems. Free.',
            },
        ],
        'caption': "The Tampa Riverwalk is 3 miles of waterfront most locals still haven't fully explored.\n\nBars. Parks. Sunset views. All free.\n\nSave this and go this weekend.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabay #riverwalk #tampaflorida #tampalife #TampaPulse #unlocktampabay",
    },
    {
        'query':   'ybor city tampa night street historic',
        'slides': [
            {
                'headline': 'YBOR CITY IS TAMPA\'S MOST UNDERRATED NEIGHBORHOOD',
                'body':     'Historic bars, Cuban food, late nights, and rooftop views — all in one place.',
            },
            {
                'headline': 'HERE\'S WHAT MOST PEOPLE MISS WHEN THEY VISIT YBOR',
                'body':     'Skip the tourist traps. These are the spots locals actually go to.',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE FOR YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems. Free.',
            },
        ],
        'caption': "Ybor City isn't just a bar strip — it's Tampa's most historic neighborhood.\n\nCuban food. Craft cocktails. Rooftop bars. All in one square mile.\n\nSave this and plan your night.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #yborcity #tampabay #tampanightlife #tampalife #TampaPulse #tampaflorida",
    },
    {
        'query':   'tampa bay waterfront restaurant outdoor dining sunset',
        'slides': [
            {
                'headline': 'THE BEST WATERFRONT RESTAURANTS IN TAMPA BAY',
                'body':     'Locals actually go to these. Views, food, and vibes — all in one.',
            },
            {
                'headline': 'SAVE THIS FOR YOUR NEXT DATE NIGHT IN TAMPA',
                'body':     'These spots book up fast. Now you know where to go.',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE FOR YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems. Free.',
            },
        ],
        'caption': "Tampa's best waterfront restaurants — views, food, and vibes all in one.\n\nSave this for your next date night or weekend plans.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampaeats #tampabay #tampafood #datenight #tamparestaurants #TampaPulse",
    },
    {
        'query':   'hyde park tampa brunch outdoor people weekend',
        'slides': [
            {
                'headline': 'HYDE PARK IS WHERE TAMPA LOCALS ACTUALLY SPEND THEIR WEEKENDS',
                'body':     'Brunch spots, boutique shopping, tree-lined streets, great coffee.',
            },
            {
                'headline': 'HERE\'S YOUR GAME PLAN FOR A PERFECT SATURDAY IN HYDE PARK',
                'body':     'Morning coffee. Brunch. Shopping. Evening drinks. Save this.',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE FOR YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems. Free.',
            },
        ],
        'caption': "Hyde Park is where Tampa locals actually spend their weekends.\n\nBrunch spots. Boutique shopping. Tree-lined streets. Great coffee.\n\nSave this and go this Saturday.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #hydepark #tampabay #tampaflorida #brunch #tampalife #TampaPulse",
    },
    {
        'query':   'clearwater beach florida sunset people sand',
        'slides': [
            {
                'headline': 'CLEARWATER BEACH IS 30 MINUTES FROM TAMPA — AND IT\'S WORLD CLASS',
                'body':     'Consistently ranked one of the best beaches in the United States.',
            },
            {
                'headline': 'WHITE SAND. TURQUOISE WATER. SUNSETS THAT ACTUALLY HIT.',
                'body':     'Plan your next weekend trip here. Save this post.',
            },
            {
                'headline': 'FOLLOW @THETAMPAPULSE FOR YOUR WEEKLY CHEAT CODE TO TAMPA',
                'body':     'Every Thursday — events, food drops, hidden gems. Free.',
            },
        ],
        'caption': "Clearwater Beach is 30 minutes from Tampa and consistently ranked one of the best beaches in the U.S.\n\nWhite sand. Turquoise water. Sunsets that actually hit.\n\nSave this for your next weekend trip.\n\nFollow @thetampapulse — your weekly cheat code to Tampa Bay.\n\n#tampa #clearwaterbeach #tampabay #florida #beach #weekend #TampaPulse",
    },
]

post = random.choice(POSTS)

def ft(sz):
    # Try bold/heavy fonts — Oswald Bold looks closest to Tampa Latest style
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
    """Heavy black gradient bottom — matches Tampa Latest style."""
    ov = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(ov)
    gt = int(H * start)
    for y in range(gt, H):
        p = (y - gt) / (H - gt)
        a = min(int((p ** 0.75) * 245), 245)
        d.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    return Image.alpha_composite(img, ov)

def wrap_centered(text, font, max_width, draw):
    """Wrap text to fit within max_width, return list of lines."""
    words = text.split()
    lines = []
    current = ''
    for word in words:
        test = (current + ' ' + word).strip()
        bb = font.getbbox(test)
        if bb[2] - bb[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

def draw_slide(photo, headline, body, slide_num):
    img = fitimg(photo.copy())
    img = dark_overlay(img)
    d = ImageDraw.Draw(img)

    MARGIN = 48
    MAX_W  = W - MARGIN * 2

    # Small brand — top left
    f_brand = ft(30)
    d.text((MARGIN, 48), 'TAMPA PULSE', font=f_brand, fill=(255, 255, 255, 190))

    # Fonts
    f_head  = ft(100)
    f_body  = ft_regular(34)
    f_url   = ft(32)

    # --- measure all elements bottom-up ---
    head_lines  = wrap_centered(headline, f_head, MAX_W, d)
    body_lines  = wrap_centered(body,     f_body, MAX_W, d)

    LINE_H_HEAD = 108
    LINE_H_BODY = 44
    DIVIDER_H   = 6
    GAP_DIV     = 18   # gap above/below divider
    URL_H       = 40
    BOTTOM_PAD  = 52

    total_h = (
        len(head_lines) * LINE_H_HEAD
        + GAP_DIV + DIVIDER_H + GAP_DIV
        + len(body_lines) * LINE_H_BODY
        + 28
        + URL_H
        + BOTTOM_PAD
    )

    y = H - total_h

    # Draw headline — centered
    for line in head_lines:
        bb = f_head.getbbox(line)
        tw = bb[2] - bb[0]
        d.text(((W - tw) // 2, y), line, font=f_head, fill=(255, 255, 255, 255))
        y += LINE_H_HEAD

    # Orange divider line — Tampa Latest signature
    y += GAP_DIV
    d.rectangle([(MARGIN, y), (W - MARGIN, y + DIVIDER_H)], fill=(255, 90, 54, 230))
    y += DIVIDER_H + GAP_DIV

    # Body text — centered
    for line in body_lines:
        bb = f_body.getbbox(line)
        tw = bb[2] - bb[0]
        d.text(((W - tw) // 2, y), line, font=f_body, fill=(255, 255, 255, 200))
        y += LINE_H_BODY

    # URL at bottom — centered, bold
    y = H - BOTTOM_PAD - URL_H
    bb = f_url.getbbox('MYTAMPAPULSE.COM')
    tw = bb[2] - bb[0]
    d.text(((W - tw) // 2, y), 'MYTAMPAPULSE.COM', font=f_url, fill=(255, 255, 255, 220))

    out_path = OUT / f'slide_{slide_num}.png'
    img.convert('RGB').save(out_path, quality=95)
    print(f'  Saved {out_path.name}: {out_path.stat().st_size} bytes')
    return out_path

print('=== FETCHING PHOTO ===')
photo = get_photo(post['query'])
if not photo:
    photo = get_photo('tampa florida city people')
if not photo:
    print('FATAL: Could not get any photo!'); exit(1)
print('Photo ready!\n')

print('=== GENERATING SLIDES ===')
slide_paths = []
for i, s in enumerate(post['slides'], 1):
    print(f'Slide {i}...')
    slide_paths.append(draw_slide(photo, s['headline'], s['body'], i))

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
