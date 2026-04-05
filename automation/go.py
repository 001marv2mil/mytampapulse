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
        'query':   'tampa waterfront skyline sunny',
        'slides': [
            ('TAMPA RIVERWALK IS ONE OF THE BEST IN THE U.S.',   'AND MOST LOCALS HAVEN\'T EXPLORED ALL OF IT'),
            ('3 MILES OF WATERFRONT YOU NEED TO WALK',           'BARS, PARKS, AND VIEWS THE WHOLE WAY'),
            ('FOLLOW FOR MORE\nTAMPA HIDDEN GEMS',               'MYTAMPAPULSE.COM'),
        ],
        'caption': "The Tampa Riverwalk is 3 miles of waterfront most locals still haven't fully explored.\n\nBars. Parks. Sunset views. All free.\n\nSave this and go this weekend.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampabay #riverwalk #tampaflorida #tampalife #TampaPulse #unlocktampabay",
    },
    {
        'query':   'ybor city tampa historic street night',
        'slides': [
            ('YBOR CITY IS TAMPA\'S MOST UNDERRATED NEIGHBORHOOD', 'HERE\'S WHAT YOU\'RE MISSING'),
            ('HISTORIC BARS, CUBAN FOOD,\nAND LATE NIGHTS',        'THE REAL TAMPA EXPERIENCE'),
            ('FOLLOW FOR MORE\nTAMPA HIDDEN GEMS',                  'MYTAMPAPULSE.COM'),
        ],
        'caption': "Ybor City isn't just a bar strip — it's Tampa's most historic neighborhood.\n\nCuban food. Craft cocktails. Cigars. Rooftop bars. All in one place.\n\nSave this and plan your night.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #yborcity #tampabay #tampanightlife #tampalife #TampaPulse #tampaflorida",
    },
    {
        'query':   'tampa bay waterfront restaurant sunset dining',
        'slides': [
            ('THE BEST WATERFRONT\nRESTAURANTS IN TAMPA',         'LOCALS ACTUALLY GO TO THESE'),
            ('VIEWS + FOOD +\nVIBES ALL IN ONE',                  'SAVE THIS FOR YOUR NEXT DATE NIGHT'),
            ('FOLLOW FOR MORE\nTAMPA HIDDEN GEMS',                'MYTAMPAPULSE.COM'),
        ],
        'caption': "Tampa's best waterfront restaurants — views, food, and vibes all in one.\n\nSave this for your next date night or weekend plans.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #tampaeats #tampabay #tampafood #datenight #tamparestaurants #TampaPulse",
    },
    {
        'query':   'hyde park tampa outdoor shopping brunch',
        'slides': [
            ('HYDE PARK IS TAMPA\'S\nCOOLEST NEIGHBORHOOD',       'BRUNCH, SHOPPING, AND GOOD VIBES'),
            ('WHERE LOCALS ACTUALLY\nSPEND THEIR WEEKENDS',       'SAVE THIS FOR SATURDAY'),
            ('FOLLOW FOR MORE\nTAMPA HIDDEN GEMS',                'MYTAMPAPULSE.COM'),
        ],
        'caption': "Hyde Park is where Tampa locals actually spend their weekends.\n\nBrunch spots. Boutique shopping. Tree-lined streets. Great coffee.\n\nSave this and go this Saturday.\n\nFollow @thetampapulse — your weekly cheat code to Tampa.\n\n#tampa #hydepark #tampabay #tampaflorida #brunch #tampalife #TampaPulse",
    },
    {
        'query':   'florida beach clearwater sunset people',
        'slides': [
            ('CLEARWATER BEACH IS\n30 MINUTES FROM TAMPA',        'AND IT\'S ONE OF THE BEST IN THE U.S.'),
            ('WHITE SAND. TURQUOISE WATER.\nSUNSETS THAT HIT.',   'PLAN YOUR WEEKEND HERE'),
            ('FOLLOW FOR MORE\nTAMPA HIDDEN GEMS',                'MYTAMPAPULSE.COM'),
        ],
        'caption': "Clearwater Beach is 30 minutes from Tampa and consistently ranked one of the best beaches in the U.S.\n\nWhite sand. Turquoise water. Sunsets that actually hit.\n\nSave this for your next weekend trip.\n\nFollow @thetampapulse — your weekly cheat code to Tampa Bay.\n\n#tampa #clearwaterbeach #tampabay #florida #beach #weekend #TampaPulse",
    },
]

post = random.choice(POSTS)
query = post['query']
slides_content = post['slides']
CAPTION = post['caption']

def ft(sz):
    for p in [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',  # Linux (GitHub Actions)
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        'C:/Windows/Fonts/impact.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
        'Montserrat-ExtraBold.ttf',
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
    print('  Downloaded: ' + str(len(data)) + ' bytes')
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

def dark_overlay(img, start=0.42):
    """Dark gradient from middle to bottom — matches Tampa Latest style."""
    ov = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(ov)
    gt = int(H * start)
    for y in range(gt, H):
        p = (y - gt) / (H - gt)
        a = min(int((p ** 0.85) * 235), 235)
        d.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    return Image.alpha_composite(img, ov)

def draw_slide(photo, headline, subtext, slide_num):
    img = fitimg(photo.copy())
    img = dark_overlay(img)
    d = ImageDraw.Draw(img)

    # Small brand tag — top left like Tampa Latest
    f_brand = ft(32)
    d.text((44, 44), 'TAMPA PULSE', font=f_brand, fill=(255, 255, 255, 200))

    # Big bold headline — bottom area, left-aligned like reference
    f_head = ft(108)
    f_sub  = ft(38)
    f_url  = ft(34)

    # Wrap and draw headline
    lines = []
    for part in headline.split('\n'):
        lines += textwrap.wrap(part, width=15) or ['']

    total_h = len(lines) * 118
    y = H - 80 - 50 - 40 - total_h - 30  # bottom up: url, sub, headline

    for line in lines:
        d.text((54, y), line, font=f_head, fill=(255, 255, 255, 255))
        y += 118

    # Subtext
    d.text((54, y + 12), subtext, font=f_sub, fill=(255, 255, 255, 180))

    # Website URL at very bottom
    url_txt = 'MYTAMPAPULSE.COM'
    d.text((54, H - 72), url_txt, font=f_url, fill=(255, 255, 255, 210))

    out_path = OUT / f'slide_{slide_num}.png'
    img.convert('RGB').save(out_path, quality=95)
    print(f'  Saved: {out_path.stat().st_size} bytes')
    return out_path

print('=== FETCHING PHOTO ===')
photo = get_photo(query)
if not photo:
    photo = get_photo('tampa florida city people')
if not photo:
    print('FATAL: Could not get any photo!'); exit(1)
print('Photo ready!\n')

print('=== GENERATING SLIDES ===')
slide_paths = []
for i, (headline, subtext) in enumerate(slides_content, 1):
    print(f'Slide {i}...')
    slide_paths.append(draw_slide(photo, headline, subtext, i))

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
cr = requests.post(IG+'/media', json={'media_type':'CAROUSEL','children':','.join(children),'caption':CAPTION,'access_token':TOKEN}, timeout=30)
print('Carousel: ' + cr.text[:120])
cr.raise_for_status()
cid = cr.json()['id']

print('Waiting 15s...')
time.sleep(15)
pub = requests.post(IG+'/media_publish', json={'creation_id':cid,'access_token':TOKEN}, timeout=30)
print('Publish: ' + pub.text[:120])
pub.raise_for_status()
print('\nPOSTED! ID: ' + pub.json()['id'])
