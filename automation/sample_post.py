"""Generate SAMPLE posts locally — does NOT post to Instagram."""
import os, random, requests
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

W, H = 1080, 1350
PX = os.environ['PEXELS_API_KEY']
OUT = Path('SAMPLE_PREVIEW')
OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'): old.unlink()

# Real newsworthy story from Creative Loafing this week
SAMPLE = {
    'location': 'West Tampa',
    'slides': [
        {
            'headline': 'Alessi Bakery Opens\nNew Massive Location\nApril 15th',
            'photo_query': 'bakery interior bread pastries fresh italian',
        },
        {
            'headline': 'West Tampa Icon\nSince 1912. Fourth\nGeneration Family.',
            'photo_query': 'historic family bakery vintage italian traditional',
        },
        {
            'headline': 'Full Deli Counter.\nItalian Groceries.\nExpanded Seating.',
            'photo_query': 'deli counter italian food meats cheese market',
        },
        {
            'headline': 'Famous Cuban Bread\nand Devil Crab.\nSame Recipes.',
            'photo_query': 'cuban bread fresh baked golden crust bakery',
        },
        {
            'headline': 'Tampa Institution.\n112 Years and\nStill Growing.',
            'photo_query': 'tampa west neighborhood historic buildings sunny',
        },
    ],
}

def ft(sz):
    for p in ['C:/Windows/Fonts/impact.ttf','C:/Windows/Fonts/arialbd.ttf']:
        try: return ImageFont.truetype(p, sz)
        except: pass
    return ImageFont.load_default()

def get_photo(q):
    r = requests.get('https://api.pexels.com/v1/search',
        headers={'Authorization': PX},
        params={'query': q, 'orientation': 'portrait', 'per_page': 15}, timeout=15)
    pics = r.json().get('photos', [])
    if not pics: return None
    url = random.choice(pics[:5])['src']['large2x']
    return Image.open(BytesIO(requests.get(url, timeout=30).content)).convert('RGBA')

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

def draw_slide(photo, headline, location, num):
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
    path = OUT / f'slide_{num}.png'
    img.convert('RGB').save(path, quality=95)
    print(f'  slide_{num}.png: {path.stat().st_size} bytes')
    return path

print('=== GENERATING SAMPLE (NOT POSTING) ===\n')
for i, s in enumerate(SAMPLE['slides'], 1):
    print(f'Slide {i}: {s["headline"].replace(chr(10), " | ")}')
    photo = get_photo(s['photo_query'])
    if not photo: photo = get_photo('tampa city')
    draw_slide(photo, s['headline'], SAMPLE['location'], i)

print(f'\nSaved to: {OUT.resolve()}')
print('NOT POSTED.')
