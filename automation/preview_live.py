"""Run the full scraping logic but STOP before posting. Preview only."""
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

# Safe to import — go.py has __name__ guard, won't auto-post
from go import (get_photo, draw_slide, scrape_and_select, OUT)

PREVIEW = Path('SAMPLE_PREVIEW')
PREVIEW.mkdir(exist_ok=True)
for old in PREVIEW.glob('*.png'): old.unlink()

# Temporarily redirect output to PREVIEW instead of CAROUSEL_READY_TO_POST
import go
_orig_out = go.OUT
go.OUT = PREVIEW

print('=== PREVIEW MODE — NOT POSTING ===\n')

post, log = scrape_and_select()

if not post:
    print('No stories had enough detail.')
    go.OUT = _orig_out
    exit(0)

print(f'\nStory: {post["topic"]}')
print(f'Slides: {len(post["slides"])}\n')
for i, s in enumerate(post['slides'], 1):
    print(f'  Slide {i}: {s["headline"].replace(chr(10), " | ")}')

print('\nGenerating slide images...')
for i, s in enumerate(post['slides'], 1):
    photo = get_photo(s['photo_query'])
    if not photo:
        photo = get_photo('tampa florida city')
    if not photo:
        print(f'  slide_{i}: NO PHOTO AVAILABLE')
        continue
    draw_slide(photo, s['headline'], post['location'], i, is_last=s.get('is_last', False))

print(f'\nCaption preview:\n{post["caption"][:400]}...')
print(f'\nPreview saved to: {PREVIEW.resolve()}')
print('NOT POSTED.')

go.OUT = _orig_out
