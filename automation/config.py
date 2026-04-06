import os
from pathlib import Path
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / '.env')
except ImportError:
    pass
BASE_DIR = Path(__file__).parent
LOG_DIR = BASE_DIR / 'tasks'
LOG_DIR.mkdir(exist_ok=True)
FONT_PATH = BASE_DIR / 'Montserrat-ExtraBold.ttf'
SUPABASE_URL = 'https://kxwhwlzvddgfjpzxnfso.supabase.co'
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
INSTAGRAM_ACCESS_TOKEN = os.environ.get('INSTAGRAM_ACCESS_TOKEN', '')
INSTAGRAM_BUSINESS_ACCOUNT_ID = os.environ.get('INSTAGRAM_BUSINESS_ACCOUNT_ID', '')
HIGGSFIELD_API_KEY = os.environ.get('HIGGSFIELD_API_KEY', '')
HIGGSFIELD_API_SECRET = os.environ.get('HIGGSFIELD_API_SECRET', '')
PEXELS_API_KEY = os.environ.get('PEXELS_API_KEY', '')
CANVA_ACCESS_TOKEN = os.environ.get('CANVA_ACCESS_TOKEN', '')
APIFY_API_TOKEN = os.environ.get('APIFY_API_TOKEN', '')
MAX_POSTS_PER_DAY = 3
POSTING_TIMES = ['14:00', '16:00', '00:00']
DEFAULT_HASHTAGS = ['#tampa', '#tampabay', '#tampaflorida', '#unlocktampabay', '#florida', '#tampaeats', '#tampalife', '#TampaPulse']
CONTENT_TOPICS = ['food', 'restaurants', 'nightlife', 'events', 'sports', 'fitness', 'outdoor', 'arts', 'hidden gems', 'weekend plans']
EXCLUDED_TOPICS = ['crime', 'politics']
