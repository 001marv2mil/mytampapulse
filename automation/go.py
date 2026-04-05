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

def ft(sz):
    for p in ['C:/Windows/Fonts/impact.ttf', 'C:/Windows/Fonts/arialbd.ttf', 'Montserrat-ExtraBold.ttf']:
        try: return ImageFont.truetype(p, sz)
        except: pass
    return ImageFont.load_default()

def get_photo(q):
    r = requests.get('https://api.pexels.com/v1/search',
        headers={'Authorization': PX},
        params={'query': q, 'orientation': 'portrait', 'per_page': 10}, timeout=15)
    pics = r.json().get('photos', [])
    if not pics:
        print('  NO PHOTOS for: ' + q)
        return None
    url = random.choice(pics[:5])['src']['large2x']
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

def orange_bottom(img, start=0.55):
    ov = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(ov)
    gt = int(H * start)
    for y in range(gt, H):
        p = (y - gt) / (H - gt)
        a = min(int((p ** 1.3) * 245), 245)
        d.line([(0, y), (W, y)], fill=(255, 87, 51, a))
    return Image.alpha_composite(img, ov)

print('=== FETCHING PHOTOS ===')
p1 = get_photo('friends outdoor restaurant patio drinks tampa')
if not p1:
    p1 = get_photo('people dining outdoor patio sunny')
if not p1:
    print('FATAL: Could not get any photo!'); exit(1)
p2 = get_photo('tampa skyline waterfront sunset')
if not p2: p2 = p1
print('Photos ready!\n')

# SLIDE 1
print('=== SLIDE 1: Hook ===')
img = fitimg(p1.copy())
img = orange_bottom(img, 0.55)
d = ImageDraw.Draw(img)
f_sm = ft(22)
f_big = ft(96)
f_sub = ft(20)
d.text((W//2 - 75, H - 430), 'TAMPA PULSE', font=f_sm, fill=(255,255,255,220))
y = H - 395
for line in textwrap.wrap("TAMPA'S BEST HIDDEN GEMS", width=14):
    bb = f_big.getbbox(line)
    tw = bb[2] - bb[0]
    d.text(((W-tw)//2, y), line, font=f_big, fill=(255,255,255,255))
    y += 105
sub = 'THE SPOTS LOCALS ACTUALLY GO TO'
bb = f_sub.getbbox(sub); tw = bb[2]-bb[0]
d.text(((W-tw)//2, y+10), sub, font=f_sub, fill=(255,255,255,200))
img.convert('RGB').save(OUT/'slide_1.png', quality=95)
sz = (OUT/'slide_1.png').stat().st_size
print('  Saved: ' + str(sz) + ' bytes')

# SLIDE 2
print('=== SLIDE 2: Info ===')
img2 = fitimg(p2.copy())
img2 = orange_bottom(img2, 0.50)
d2 = ImageDraw.Draw(img2)
f_title = ft(52)
f_val = ft(36)
f_lbl = ft(18)
d2.text((80, H-500), 'WHAT TO KNOW', font=f_title, fill=(255,255,255))
d2.line([(80, H-440),(350, H-440)], fill=(255,255,255,180), width=3)
items = [('WHERE','TAMPA BAY AREA'),('VIBE','HIDDEN GEMS'),('WHY','INSIDER PICKS'),('FOLLOW','@THETAMPAPULSE')]
yy = H - 420
for lb, val in items:
    d2.text((80, yy), lb, font=f_lbl, fill=(255,255,255,180))
    d2.text((80, yy+22), val, font=f_val, fill=(255,255,255))
    yy += 90
img2.convert('RGB').save(OUT/'slide_2.png', quality=95)
sz = (OUT/'slide_2.png').stat().st_size
print('  Saved: ' + str(sz) + ' bytes')

# SLIDE 3
print('=== SLIDE 3: CTA ===')
img3 = fitimg(p1.copy())
img3 = orange_bottom(img3, 0.55)
d3 = ImageDraw.Draw(img3)
f_cta = ft(64)
f_handle = ft(44)
y3 = H - 340
for txt in ['SAVE THIS POST', 'TAG YOUR SQUAD']:
    bb = f_cta.getbbox(txt); tw = bb[2]-bb[0]
    d3.text(((W-tw)//2, y3), txt, font=f_cta, fill=(255,255,255))
    y3 += 78
bb = f_handle.getbbox('@THETAMPAPULSE'); tw = bb[2]-bb[0]
d3.text(((W-tw)//2, y3+15), '@THETAMPAPULSE', font=f_handle, fill=(255,255,255))
bb = f_sub.getbbox('YOUR WEEKLY CHEAT CODE FOR TAMPA'); tw = bb[2]-bb[0]
d3.text(((W-tw)//2, y3+70), 'YOUR WEEKLY CHEAT CODE FOR TAMPA', font=f_sub, fill=(255,255,255,200))
img3.convert('RGB').save(OUT/'slide_3.png', quality=95)
sz = (OUT/'slide_3.png').stat().st_size
print('  Saved: ' + str(sz) + ' bytes')

# CHECK SIZES
print('\n=== CHECKING FILES ===')
slides = sorted(glob.glob(str(OUT/'slide_*.png')))
for s in slides:
    sz = Path(s).stat().st_size
    print('  ' + Path(s).name + ': ' + str(sz) + ' bytes')
    if sz < 50000:
        print('  WARNING: File too small, photo probably missing!')
        exit(1)

# POST
print('\n=== POSTING TO INSTAGRAM ===')
IG = 'https://graph.facebook.com/v25.0/' + ACCT
urls = []
for s in slides:
    print('Uploading ' + Path(s).name + '...')
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
    print('  Container: ' + r.text[:100])
    r.raise_for_status()
    children.append(r.json()['id'])
print('Waiting 15s...')
time.sleep(15)
CAPTION = "Tampa's best hidden gems - the spots locals actually go to.\n\nSave this. Tag someone who needs it.\n\nFollow @thetampapulse for your weekly cheat code to Tampa\n\n#tampa #tampabay #tampaflorida #unlocktampabay #florida #tampaeats #tampalife #TampaPulse"
cr = requests.post(IG+'/media', json={'media_type':'CAROUSEL','children':','.join(children),'caption':CAPTION,'access_token':TOKEN}, timeout=30)
print('Carousel: ' + cr.text[:100])
cr.raise_for_status()
cid = cr.json()['id']
print('Waiting 15s...')
time.sleep(15)
pub = requests.post(IG+'/media_publish', json={'creation_id':cid,'access_token':TOKEN}, timeout=30)
print('Publish: ' + pub.text[:100])
pub.raise_for_status()
print('\nPOSTED! ID: ' + pub.json()['id'])
