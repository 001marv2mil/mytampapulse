"""
@petoshealth — Quirky Animal & Nature Fun Facts
Random "did you know" style facts about animals, insects, ocean life, nature.
Green gradient slide design with bold centered headlines.
"""
import os, random, json, time, requests
from io import BytesIO
from pathlib import Path
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

W, H = 1080, 1350
PX    = os.environ['PEXELS_API_KEY']
TOKEN = os.environ['PETOS_PAGE_ACCESS_TOKEN']
ACCT  = os.environ['PETOS_IG_ACCOUNT_ID']
OUT   = Path('PETOS_SLIDES')
OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'):
    old.unlink()

LOG_FILE = Path(__file__).parent / 'petos_posted_log.json'
REPOST_DAYS = 30

# Brand colors
DARK_TEAL = (15, 60, 50)
TEAL = (41, 182, 151)
WHITE = (255, 255, 255)
BRAND = 'PETOSHEALTH'

# ═══════════════════════════════════════════════════════════════════
# POST TRACKER
# ═══════════════════════════════════════════════════════════════════

def load_log():
    if LOG_FILE.exists():
        try: return json.loads(LOG_FILE.read_text())
        except: pass
    return []

def save_log(log, topic, ig_id):
    now = datetime.now(timezone.utc)
    log.append({'topic': topic, 'timestamp': now.isoformat(), 'ig_id': str(ig_id)})
    cutoff = (now - timedelta(days=90)).isoformat()
    log = [e for e in log if e.get('timestamp', '') > cutoff]
    LOG_FILE.write_text(json.dumps(log, indent=2))

def recently_posted(log):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=REPOST_DAYS)).isoformat()
    return {e['topic'] for e in log if e.get('timestamp', '') > cutoff}

# ═══════════════════════════════════════════════════════════════════
# CAPTION SYSTEM — random intros/closers keep captions fresh
# ═══════════════════════════════════════════════════════════════════

INTROS = [
    "Nature is absolutely wild.",
    "The more you know...",
    "This one blew our minds.",
    "Wait till you hear this.",
    "You're about to rethink everything.",
    "Fun fact of the day.",
    "The animal kingdom is undefeated.",
    "Bet you didn't know this one.",
    "Science is wild. Here's proof.",
    "Random fact that lives rent-free in our heads now.",
    "Your daily dose of 'wait, really?'",
    "We can't stop thinking about this.",
    "This is why nature is the GOAT.",
    "File this under: things you didn't know you needed to know.",
]

CLOSERS = [
    "\n\nDouble tap if you learned something new.",
    "\n\nSave this one for later.",
    "\n\nTag someone who needs to see this.",
    "\n\nShare this with someone who loves random facts.",
    "\n\nThe more you know.",
    "\n\nNature stays winning.",
    "\n\nYou're welcome.",
    "\n\nNow go impress your friends with this.",
    "\n\nDrop a comment if you already knew this.",
]

TAGS = "\n\n#petoshealth #funfacts #didyouknow #animals #nature #wildlife #animalfacts #science"

def build_caption(body):
    return f"{random.choice(INTROS)}\n\n{body}{random.choice(CLOSERS)}{TAGS}"

# ═══════════════════════════════════════════════════════════════════
# FACTS DATABASE — 80+ quirky animal & nature facts
# topic: unique key | query: Pexels search | slides: headlines | body: caption text
# ═══════════════════════════════════════════════════════════════════

FACTS = [
    # ── INSECTS ──────────────────────────────────────────────────
    {'topic': 'mosquito', 'query': 'mosquito macro insect',
     'slides': ['MOSQUITOES HAVE\n47 TEETH AND KILLED\nMORE HUMANS THAN\nEVERY WAR COMBINED',
                'THEY ARE ATTRACTED\nTO TYPE O BLOOD\nTWICE AS MUCH',
                'ONLY FEMALES BITE\nMALES JUST DRINK\nFLOWER NECTAR',
                'A SINGLE BAT EATS\n1,000 MOSQUITOES\nIN ONE HOUR'],
     'body': 'Mosquitoes have killed more humans than every war in history combined. Only females bite — males sip flower nectar. Type O blood? You\'re twice as likely to get bitten. Nature\'s best mosquito control? A single bat eats 1,000 per hour.'},

    {'topic': 'firefly', 'query': 'firefly glowing night',
     'slides': ['FIREFLIES PRODUCE\nTHE MOST EFFICIENT\nLIGHT ON EARTH',
                '100% OF THEIR\nENERGY BECOMES\nLIGHT — ZERO HEAT',
                'EACH SPECIES HAS\nITS OWN UNIQUE\nFLASH PATTERN',
                'SOME FEMALES MIMIC\nOTHER SPECIES\nFLASH TO EAT THEM'],
     'body': 'Firefly light is the most efficient light source ever observed — 100% of the energy becomes visible light with zero heat. A lightbulb wastes 90% as heat. Each species has a unique flash pattern to find mates, and some femme fatale fireflies mimic other species\' flashes to lure and eat them.'},

    {'topic': 'dragonfly', 'query': 'dragonfly close up wings',
     'slides': ['DRAGONFLIES HAVE A\n95% HUNTING\nSUCCESS RATE',
                'THAT MAKES THEM\nTHE MOST EFFICIENT\nPREDATOR ON EARTH',
                'LIONS SUCCEED\nONLY 25% OF\nTHE TIME',
                'THEY HAVE EXISTED\nFOR 300 MILLION\nYEARS'],
     'body': 'Dragonflies catch their prey 95% of the time — making them the most efficient predator on Earth. Lions only manage 25%. Great white sharks? About 50%. Dragonflies have been perfecting this for 300 million years — before dinosaurs even existed.'},

    {'topic': 'butterfly-taste', 'query': 'butterfly colorful flower',
     'slides': ['BUTTERFLIES\nTASTE WITH\nTHEIR FEET',
                'THEY LAND ON\nA LEAF AND\nINSTANTLY KNOW\nIF IT\'S FOOD',
                'THEY CAN SEE\nULTRAVIOLET LIGHT\nHUMANS CANNOT',
                'MONARCH BUTTERFLIES\nMIGRATE 3,000 MILES\nWITHOUT A MAP'],
     'body': 'Butterflies have taste receptors on their feet — the moment they land, they know if something is food. They also see ultraviolet light invisible to humans, revealing hidden patterns on flowers. Monarchs migrate 3,000 miles from Canada to Mexico using the sun and Earth\'s magnetic field.'},

    {'topic': 'ant-strength', 'query': 'ant carrying leaf macro',
     'slides': ['ANTS CAN LIFT\n50 TIMES THEIR\nOWN BODY WEIGHT',
                'THE TOTAL WEIGHT\nOF ALL ANTS ON\nEARTH EQUALS\nALL HUMANS',
                'THEY HAVE TWO\nSTOMACHS — ONE\nFOR SHARING FOOD',
                'SOME COLONIES\nHAVE EXISTED FOR\nOVER 100 YEARS'],
     'body': 'An ant can lift 50 times its own body weight. The total biomass of all ants on Earth roughly equals all humans combined. They have two stomachs — one for themselves, one to share food with the colony. Some supercolonies span thousands of miles and have lasted over a century.'},

    {'topic': 'bee-honey', 'query': 'honeybee flower pollen',
     'slides': ['A SINGLE BEE\nMAKES ONLY 1/12\nTEASPOON OF HONEY\nIN ITS LIFETIME',
                'TO MAKE ONE\nPOUND OF HONEY\nBEES FLY 55,000\nMILES',
                'BEES CAN\nRECOGNIZE HUMAN\nFACES',
                'THEY COMMUNICATE\nBY DANCING'],
     'body': 'One honeybee produces just 1/12 of a teaspoon of honey in its entire life. To make one pound, the colony flies 55,000 miles and visits 2 million flowers. Bees can recognize and remember human faces, and they communicate locations by doing a waggle dance.'},

    {'topic': 'mantis', 'query': 'praying mantis green',
     'slides': ['THE PRAYING MANTIS\nIS THE ONLY INSECT\nTHAT CAN TURN\nITS HEAD 180°',
                'THEY CAN SEE\nIN 3D USING\nSTEREO VISION',
                'FEMALES EAT THE\nMALE AFTER MATING\n25% OF THE TIME',
                'SOME SPECIES\nCAN CATCH\nHUMMINGBIRDS'],
     'body': 'The praying mantis is the only insect that can turn its head a full 180 degrees. They have stereo vision — just like humans — making them incredibly precise hunters. And yes, females do sometimes eat the male after mating. Some large species have been documented catching hummingbirds.'},

    {'topic': 'cockroach', 'query': 'cockroach insect macro',
     'slides': ['COCKROACHES CAN\nLIVE 2 WEEKS\nWITHOUT A HEAD',
                'THEY HAVE BEEN\nAROUND FOR 300\nMILLION YEARS',
                'THEY CAN HOLD\nTHEIR BREATH FOR\n40 MINUTES',
                'THEY CAN RUN\n3 MILES PER HOUR\nAS A BABY'],
     'body': 'Cockroaches can survive two weeks without a head — they only die because they can\'t drink water. They\'ve been around for 300 million years, surviving every mass extinction. They can hold their breath for 40 minutes and run 3 mph as newborns. The ultimate survivors.'},

    {'topic': 'spider-silk', 'query': 'spider web morning dew',
     'slides': ['SPIDER SILK IS\nSTRONGER THAN\nSTEEL BY WEIGHT',
                'A PENCIL-THICK\nSTRAND COULD STOP\nA BOEING 747',
                'SPIDERS RECYCLE\nTHEIR WEBS BY\nEATING THEM',
                'THEY HAVE BEEN\nWEAVING WEBS FOR\n100 MILLION YEARS'],
     'body': 'Spider silk is five times stronger than steel by weight. A strand as thick as a pencil could theoretically stop a Boeing 747 in flight. Spiders don\'t waste it — they eat old webs to recycle the protein. They\'ve been perfecting web architecture for over 100 million years.'},

    {'topic': 'ladybug', 'query': 'ladybug red leaf',
     'slides': ['A SINGLE LADYBUG\nEATS UP TO 5,000\nAPHIDS IN ITS\nLIFETIME',
                'THEY BLEED FROM\nTHEIR KNEES WHEN\nTHREATENED',
                'THE NUMBER OF\nSPOTS HAS NOTHING\nTO DO WITH AGE',
                'FARMERS HAVE USED\nTHEM AS PEST\nCONTROL FOR\nCENTURIES'],
     'body': 'A single ladybug eats up to 5,000 aphids in its lifetime — they\'re nature\'s pest control. When threatened, they bleed a toxic fluid from their knees that tastes terrible to predators. The number of spots has nothing to do with age — it\'s determined by species.'},

    # ── OCEAN ────────────────────────────────────────────────────
    {'topic': 'octopus', 'query': 'octopus underwater ocean',
     'slides': ['AN OCTOPUS HAS\n3 HEARTS\n9 BRAINS AND\nBLUE BLOOD',
                'THEY CAN CHANGE\nCOLOR IN 0.3\nSECONDS',
                'THEY CAN TASTE\nWITH THEIR ARMS\n— ALL 8 OF THEM',
                'THEY HAVE BEEN\nOBSERVED USING\nCOCONUT SHELLS\nAS ARMOR'],
     'body': 'Octopuses have 3 hearts, 9 brains (one central + one in each arm), and blue blood. They can change color and texture in 0.3 seconds. Each arm can taste and think independently. They\'ve been caught carrying coconut shells to use as portable armor. They might be smarter than we think.'},

    {'topic': 'dolphin-sleep', 'query': 'dolphin ocean swimming',
     'slides': ['DOLPHINS SLEEP\nWITH ONE EYE\nOPEN',
                'HALF THEIR BRAIN\nSTAYS AWAKE\nTO BREATHE',
                'THEY CALL EACH\nOTHER BY UNIQUE\nNAME-WHISTLES',
                'THEY HAVE BEEN\nKNOWN TO SAVE\nHUMANS FROM\nSHARKS'],
     'body': 'Dolphins sleep with one eye open — literally. Half their brain shuts down while the other half stays alert for predators and breathing. They give each other unique signature whistles, essentially names, and respond when called. There are documented cases of dolphins protecting swimmers from sharks.'},

    {'topic': 'jellyfish', 'query': 'jellyfish glowing ocean',
     'slides': ['JELLYFISH HAVE\nNO BRAIN NO HEART\nNO BLOOD AND\nNO BONES',
                'THEY ARE 95%\nWATER',
                'ONE SPECIES IS\nBIOLOGICALLY\nIMMORTAL',
                'THEY HAVE EXISTED\nFOR 650 MILLION\nYEARS — BEFORE\nDINOSAURS'],
     'body': 'Jellyfish have no brain, no heart, no blood, and no bones — yet they\'ve survived for 650 million years. They\'re 95% water. The Turritopsis dohrnii (immortal jellyfish) can revert to its juvenile state when stressed, effectively resetting its biological clock. Immortality exists — it\'s just a jellyfish.'},

    {'topic': 'sea-turtle', 'query': 'sea turtle underwater swimming',
     'slides': ['SEA TURTLES USE\nEARTH\'S MAGNETIC\nFIELD TO NAVIGATE',
                'THEY RETURN TO\nTHE EXACT BEACH\nWHERE THEY WERE\nBORN TO LAY EGGS',
                'THEY CAN HOLD\nTHEIR BREATH\nFOR 5 HOURS',
                'SOME SPECIES\nLIVE OVER\n100 YEARS'],
     'body': 'Sea turtles navigate thousands of miles using Earth\'s magnetic field like a built-in GPS. Females return to the exact beach where they hatched — sometimes decades later — to lay their own eggs. They can hold their breath for up to 5 hours while sleeping, and some live past 100.'},

    {'topic': 'shark-age', 'query': 'shark underwater ocean',
     'slides': ['SHARKS ARE OLDER\nTHAN TREES',
                'THEY HAVE EXISTED\nFOR 450 MILLION\nYEARS — TREES\nONLY 350 MILLION',
                'THEY CAN DETECT\nONE DROP OF BLOOD\nIN 25 GALLONS\nOF WATER',
                'SOME SPECIES\nMUST KEEP SWIMMING\nOR THEY DROWN'],
     'body': 'Sharks have existed for 450 million years — that\'s 100 million years before the first trees appeared on Earth. They survived every mass extinction including the one that killed the dinosaurs. Their sense of smell can detect one drop of blood in 25 gallons of water.'},

    {'topic': 'whale-heart', 'query': 'humpback whale ocean',
     'slides': ['A BLUE WHALE\'S\nHEART IS THE SIZE\nOF A GOLF CART',
                'YOU COULD CRAWL\nTHROUGH ITS\nARTERIES',
                'ITS TONGUE WEIGHS\nAS MUCH AS AN\nELEPHANT',
                'ITS HEARTBEAT\nCAN BE DETECTED\nFROM 2 MILES AWAY'],
     'body': 'A blue whale\'s heart is roughly the size of a golf cart and weighs about 400 pounds. Its arteries are so large a small child could crawl through them. Its tongue alone weighs as much as an elephant. And its heartbeat is so powerful it can be detected from 2 miles away.'},

    {'topic': 'seahorse', 'query': 'seahorse underwater colorful',
     'slides': ['SEAHORSES ARE THE\nONLY ANIMAL WHERE\nMALES GIVE BIRTH',
                'THEY MATE FOR\nLIFE AND GREET\nEACH OTHER EVERY\nMORNING',
                'THEY HAVE NO\nSTOMACH — FOOD\nPASSES STRAIGHT\nTHROUGH',
                'THEY CAN MOVE\nEACH EYE\nINDEPENDENTLY'],
     'body': 'Male seahorses carry and deliver the babies — the only animal on Earth where this happens. Mated pairs greet each other every morning with a dance, changing colors together. They have no stomach, so food passes through them almost immediately. They must eat constantly to survive.'},

    {'topic': 'starfish', 'query': 'starfish ocean tide pool',
     'slides': ['STARFISH HAVE\nNO BRAIN\nAND NO BLOOD',
                'THEY EAT BY\nPUSHING THEIR\nSTOMACH OUTSIDE\nTHEIR BODY',
                'IF YOU CUT ONE\nIN HALF BOTH\nHALVES REGROW',
                'SOME SPECIES\nHAVE UP TO\n40 ARMS'],
     'body': 'Starfish have no brain and no blood — they pump seawater through their bodies instead. They eat by pushing their stomach out through their mouth, digesting prey externally, then pulling it back in. Cut one in half and both halves can regenerate into complete animals.'},

    {'topic': 'coral', 'query': 'coral reef colorful underwater',
     'slides': ['CORAL REEFS\nSUPPORT 25% OF\nALL MARINE LIFE',
                'THEY COVER LESS\nTHAN 1% OF THE\nOCEAN FLOOR',
                'CORAL IS AN\nANIMAL NOT\nA PLANT',
                'SOME CORAL\nCOLONIES ARE\nOVER 4,000\nYEARS OLD'],
     'body': 'Coral reefs support 25% of all marine species while covering less than 1% of the ocean floor. And coral is an animal, not a plant — made up of thousands of tiny creatures called polyps. Some coral colonies are over 4,000 years old, making them among the oldest living organisms on Earth.'},

    {'topic': 'orca', 'query': 'orca killer whale ocean',
     'slides': ['ORCAS ARE NOT\nWHALES — THEY\nARE THE LARGEST\nDOLPHINS',
                'EACH POD HAS\nITS OWN UNIQUE\nDIALECT',
                'THEY ARE THE\nONLY PREDATOR\nOF GREAT WHITE\nSHARKS',
                'GRANDMOTHERS LEAD\nTHE POD AND\nTEACH HUNTING'],
     'body': 'Orcas are actually the world\'s largest dolphins, not whales. Each pod speaks its own unique dialect passed down through generations. They\'re the only known predator of great white sharks — and they only eat the liver. Grandmother orcas lead the pod and teach younger members how to hunt.'},

    {'topic': 'manta-ray', 'query': 'manta ray underwater',
     'slides': ['MANTA RAYS HAVE\nTHE LARGEST BRAIN\nOF ANY FISH',
                'THEY CAN\nRECOGNIZE\nTHEMSELVES\nIN A MIRROR',
                'THEIR WINGSPAN\nCAN REACH\n23 FEET',
                'THEY VISIT\nCLEANING STATIONS\nAND WAIT IN LINE'],
     'body': 'Manta rays have the largest brain-to-body ratio of any fish and are one of the few animals that can recognize themselves in a mirror — a sign of self-awareness. Their wingspan can reach 23 feet. They visit specific reef cleaning stations where small fish eat parasites off them — and they patiently wait in line.'},

    # ── MAMMALS ──────────────────────────────────────────────────
    {'topic': 'elephant-memory', 'query': 'elephant african wildlife',
     'slides': ['ELEPHANTS MOURN\nTHEIR DEAD AND\nVISIT GRAVES\nYEARS LATER',
                'THEY CAN\'T JUMP\n— THEY ARE THE\nONLY MAMMAL\nTHAT CAN\'T',
                'THEIR TRUNK HAS\n40,000 MUSCLES\nYOUR ENTIRE BODY\nHAS 639',
                'THEY CAN HEAR\nTHROUGH THEIR\nFEET VIA\nVIBRATIONS'],
     'body': 'Elephants hold funerals. They mourn their dead, gently touching the bones with their trunks, and revisit the remains years later. They\'re the only mammal that can\'t jump. Their trunk alone has 40,000 muscles — your entire body has 639. They can detect seismic vibrations through their feet from miles away.'},

    {'topic': 'sloth', 'query': 'sloth hanging tree',
     'slides': ['SLOTHS TAKE\n2 WEEKS TO\nDIGEST A\nSINGLE MEAL',
                'THEY CAN HOLD\nTHEIR BREATH FOR\n40 MINUTES\nUNDERWATER',
                'THEY ONLY POOP\nONCE A WEEK AND\nLOSE 1/3 OF THEIR\nBODY WEIGHT',
                'ALGAE GROWS ON\nTHEIR FUR MAKING\nTHEM CAMOUFLAGE'],
     'body': 'Sloths take up to 2 weeks to fully digest a single meal — the slowest digestion of any mammal. They can hold their breath for 40 minutes underwater, outperforming dolphins. They only poop once a week and lose about a third of their body weight each time. Algae grows in their fur, turning them green for natural camouflage.'},

    {'topic': 'otter-hands', 'query': 'sea otter floating water',
     'slides': ['SEA OTTERS HOLD\nHANDS WHILE THEY\nSLEEP SO THEY\nDON\'T DRIFT APART',
                'THEY HAVE A\nFAVORITE ROCK THEY\nKEEP IN A POUCH',
                'THEIR FUR HAS\n1 MILLION HAIRS\nPER SQUARE INCH',
                'THEY WRAP IN\nKELP LIKE A\nBLANKET TO\nSTAY ANCHORED'],
     'body': 'Sea otters hold hands while sleeping so they don\'t drift apart — groups floating together are called rafts. Each otter has a favorite rock they carry in a skin pouch under their arm for cracking shells. Their fur is the densest of any mammal — about 1 million hairs per square inch. They also wrap themselves in kelp like a blanket to stay anchored.'},

    {'topic': 'bat-echo', 'query': 'bat flying night',
     'slides': ['BATS ARE THE\nONLY MAMMALS\nTHAT CAN\nTRULY FLY',
                'THEY EAT UP TO\n1,200 MOSQUITOES\nIN ONE HOUR',
                'THEIR ECHOLOCATION\nCAN DETECT A\nHUMAN HAIR IN\nTOTAL DARKNESS',
                'WITHOUT BATS\nWE WOULD LOSE\nBANANAS MANGOES\nAND TEQUILA'],
     'body': 'Bats are the only mammals capable of true powered flight. A single bat can eat up to 1,200 mosquitoes in one hour. Their echolocation is so precise they can detect an object as thin as a human hair in complete darkness. Without bats pollinating plants, we\'d lose bananas, mangoes, and agave — meaning no tequila.'},

    {'topic': 'cow-friendship', 'query': 'cows field green pasture',
     'slides': ['COWS HAVE\nBEST FRIENDS AND\nGET STRESSED WHEN\nTHEY\'RE SEPARATED',
                'THEIR HEART RATE\nDROPS WHEN THEY\nARE WITH THEIR\nFAVORITE COW',
                'THEY CAN SMELL\nSOMETHING UP TO\n6 MILES AWAY',
                'THEY PRODUCE\nMORE MILK WHEN\nLISTENING TO\nSLOW MUSIC'],
     'body': 'Cows form deep friendships and get measurably stressed when separated from their best friend — their heart rate increases and cortisol spikes. When reunited, their heart rate drops immediately. They can smell things from 6 miles away and produce more milk when listening to slow, calm music.'},

    {'topic': 'pig-smart', 'query': 'pig piglet farm cute',
     'slides': ['PIGS ARE SMARTER\nTHAN DOGS AND\nMOST 3-YEAR-OLD\nHUMANS',
                'THEY CAN PLAY\nVIDEO GAMES\nWITH JOYSTICKS',
                'THEY DREAM\nJUST LIKE\nHUMANS DO',
                'THEY HAVE\nEXCELLENT\nLONG-TERM MEMORY'],
     'body': 'Pigs are considered the 5th most intelligent animal on Earth — smarter than dogs and most 3-year-old humans. They\'ve been taught to play video games using joysticks with their snouts. They dream during REM sleep just like us and have excellent long-term memory, remembering things for years.'},

    {'topic': 'cheetah-speed', 'query': 'cheetah running fast',
     'slides': ['CHEETAHS GO FROM\n0 TO 60 MPH\nIN 3 SECONDS',
                'THAT\'S FASTER\nTHAN A LAMBORGHINI',
                'THEY CAN ONLY\nSPRINT FOR 60\nSECONDS BEFORE\nOVERHEATING',
                'THEY CAN\'T ROAR\nTHEY CHIRP LIKE\nBIRDS'],
     'body': 'Cheetahs accelerate from 0 to 60 mph in just 3 seconds — faster than most supercars. But they can only maintain top speed for about 60 seconds before their body temperature hits dangerous levels. And they can\'t roar like other big cats — they chirp and purr like oversized house cats.'},

    {'topic': 'wolf-loyalty', 'query': 'wolf pack snow wilderness',
     'slides': ['WOLVES MATE\nFOR LIFE',
                'IF ONE PARTNER\nDIES THE OTHER\nOFTEN DIES OF\nA BROKEN HEART',
                'THEY CAN HEAR\nSOUNDS FROM\n10 MILES AWAY',
                'A WOLF PACK\nIS ACTUALLY\nJUST A FAMILY'],
     'body': 'Wolves mate for life. When one partner dies, the surviving wolf often stops eating, becomes withdrawn, and sometimes dies shortly after — what researchers call a broken heart. A wolf pack isn\'t a hierarchy of strangers — it\'s literally a family: two parents and their offspring.'},

    {'topic': 'koala', 'query': 'koala tree eucalyptus',
     'slides': ['KOALAS SLEEP\n22 HOURS A DAY',
                'THEIR FINGERPRINTS\nARE SO SIMILAR\nTO HUMANS THEY\nCAN FOOL POLICE',
                'BABY KOALAS EAT\nTHEIR MOTHER\'S\nPOOP TO BUILD\nGUT BACTERIA',
                'THEIR BRAIN HAS\nSHRUNK OVER TIME\nBECAUSE THEIR\nDIET IS SO EASY'],
     'body': 'Koalas sleep up to 22 hours a day because eucalyptus leaves are so low in nutrition they need to conserve every calorie. Their fingerprints are virtually identical to human fingerprints — even under a microscope. Baby koalas eat a special form of their mother\'s feces called pap to develop the gut bacteria needed to digest eucalyptus.'},

    {'topic': 'giraffe', 'query': 'giraffe african savanna',
     'slides': ['A GIRAFFE\'S TONGUE\nIS 20 INCHES LONG\nAND PURPLE TO\nPREVENT SUNBURN',
                'THEY ONLY NEED\n30 MINUTES OF\nSLEEP PER DAY',
                'BABY GIRAFFES\nFALL 6 FEET\nWHEN BORN\nAND STAND IN\n30 MINUTES',
                'NO TWO GIRAFFES\nHAVE THE SAME\nSPOT PATTERN'],
     'body': 'A giraffe\'s tongue is 20 inches long and dark purple — the melanin protects it from sunburn since they spend all day eating from trees. They only need about 30 minutes of sleep per day, usually in 5-minute naps. Baby giraffes fall 6 feet at birth and stand up within 30 minutes. Every giraffe\'s spot pattern is unique — like a fingerprint.'},

    {'topic': 'platypus', 'query': 'platypus swimming underwater',
     'slides': ['THE PLATYPUS IS\nONE OF THE FEW\nVENOMOUS MAMMALS\nON EARTH',
                'IT LAYS EGGS\nBUT PRODUCES\nMILK — BUT HAS\nNO NIPPLES',
                'IT DETECTS PREY\nUSING ELECTRICAL\nSIGNALS THROUGH\nITS BILL',
                'WHEN SCIENTISTS\nFIRST SAW ONE\nTHEY THOUGHT IT\nWAS A HOAX'],
     'body': 'The platypus is a mammal that lays eggs, produces milk but has no nipples, and the males are venomous — enough to incapacitate a human. It hunts with its eyes closed, detecting prey through electrical signals in its bill. When European scientists first saw a preserved specimen, they tried to peel it apart thinking someone had sewn a duck bill onto a beaver.'},

    {'topic': 'honey-badger', 'query': 'honey badger wildlife african',
     'slides': ['HONEY BADGERS\nHAVE BEEN KNOWN\nTO FIGHT LIONS\nAND WIN',
                'THEY ARE IMMUNE\nTO MOST SNAKE\nVENOM',
                'THEY CAN ESCAPE\nFROM ALMOST\nANY ENCLOSURE',
                'THEIR SKIN IS\nSO THICK ARROWS\nAND MACHETES\nBOUNCE OFF'],
     'body': 'Honey badgers are widely considered the most fearless animal on Earth. They attack lions, fight cobra snakes (and are immune to most venom), and escape from virtually any enclosure — they\'ve been filmed using tools to break out of cages. Their skin is so thick and loose that even arrows and machetes often fail to penetrate it.'},

    {'topic': 'cat-sleep', 'query': 'cat sleeping cozy home',
     'slides': ['CATS SPEND 70%\nOF THEIR LIVES\nSLEEPING',
                'THEY CAN ROTATE\nTHEIR EARS 180\nDEGREES',
                'THEY CAN\'T TASTE\nSWEET THINGS',
                'A GROUP OF CATS\nIS CALLED A\nCLOWDER'],
     'body': 'The average house cat sleeps 13-16 hours a day — about 70% of their life. They can rotate each ear 180 degrees independently using 32 muscles per ear. Cats are one of the only mammals that can\'t taste sweetness — they lack the taste receptor entirely. And a group of cats is officially called a clowder.'},

    {'topic': 'dog-nose', 'query': 'dog nose close up portrait',
     'slides': ['A DOG\'S NOSE\nPRINT IS UNIQUE\nLIKE A HUMAN\nFINGERPRINT',
                'THEY CAN SMELL\nDISEASES INCLUDING\nCANCER AND\nCOVID-19',
                'DOGS SMELL IN\nSTEREO — EACH\nNOSTRIL WORKS\nINDEPENDENTLY',
                'THEIR NOSE IS\n100,000 TIMES\nMORE SENSITIVE\nTHAN YOURS'],
     'body': 'Every dog\'s nose print is unique — just like a human fingerprint. Dogs can detect certain cancers, low blood sugar, and even COVID-19 through smell alone. Each nostril smells independently, giving them directional scent tracking. Their nose is at least 100,000 times more sensitive than a human\'s.'},

    # ── REPTILES ─────────────────────────────────────────────────
    {'topic': 'crocodile', 'query': 'crocodile water close up',
     'slides': ['CROCODILES HAVEN\'T\nCHANGED IN 200\nMILLION YEARS',
                'THEY SURVIVED\nTHE ASTEROID THAT\nKILLED THE\nDINOSAURS',
                'THEY CAN\'T STICK\nOUT THEIR TONGUE',
                'THEY SWALLOW\nROCKS TO HELP\nTHEM DIVE DEEPER'],
     'body': 'Crocodiles have barely changed in 200 million years — they were already perfect. They survived the asteroid that wiped out the dinosaurs. They can\'t stick out their tongue because it\'s attached to the roof of their mouth. And they intentionally swallow rocks to add weight for deeper dives.'},

    {'topic': 'chameleon', 'query': 'chameleon colorful lizard',
     'slides': ['CHAMELEONS DON\'T\nCHANGE COLOR FOR\nCAMOUFLAGE —\nIT\'S FOR MOOD',
                'THEIR EYES MOVE\nINDEPENDENTLY\nSEEING 360\nDEGREES AT ONCE',
                'THEIR TONGUE\nIS TWICE THEIR\nBODY LENGTH',
                'IT SHOOTS OUT\nFASTER THAN A\nJET FIGHTER\nTAKES OFF'],
     'body': 'Chameleons don\'t change color for camouflage — it\'s primarily for communication and mood. Angry? Dark. Relaxed? Light. Their eyes move independently, giving them near 360-degree vision. Their tongue is twice their body length and launches at prey faster than a fighter jet accelerates.'},

    {'topic': 'gecko', 'query': 'gecko lizard close up',
     'slides': ['GECKOS CAN WALK\nON CEILINGS USING\nMILLIONS OF TINY\nHAIR-LIKE FIBERS',
                'THEY LICK THEIR\nOWN EYEBALLS\nBECAUSE THEY\nHAVE NO EYELIDS',
                'THEY CAN SHED\nTHEIR TAIL AND\nGROW A NEW ONE',
                'THEIR FEET WORK\nVIA MOLECULAR\nATTRACTION NOT\nSUCTION'],
     'body': 'Geckos walk on ceilings using millions of microscopic hair-like structures on their feet that create molecular attraction — not suction or glue. They have no eyelids, so they lick their own eyeballs to keep them clean. When a predator grabs their tail, they detach it and grow a new one.'},

    {'topic': 'komodo', 'query': 'komodo dragon lizard',
     'slides': ['KOMODO DRAGONS\nHAVE VENOM THAT\nPREVENTS BLOOD\nFROM CLOTTING',
                'THEY CAN EAT\n80% OF THEIR\nBODY WEIGHT\nIN ONE MEAL',
                'THEY CAN DETECT\nA DEAD ANIMAL\nFROM 6 MILES\nAWAY',
                'FEMALES CAN\nREPRODUCE WITHOUT\nA MALE'],
     'body': 'Komodo dragons have venom glands that release toxins preventing blood from clotting — prey slowly bleeds out. They can eat 80% of their body weight in a single meal, then not eat for weeks. They detect carrion from up to 6 miles away. Females can reproduce without a male through parthenogenesis.'},

    {'topic': 'turtle-butt', 'query': 'turtle pond water',
     'slides': ['SOME TURTLES CAN\nBREATHE THROUGH\nTHEIR BUTT',
                'IT\'S CALLED\nCLOACAL\nRESPIRATION',
                'THEIR SHELL HAS\n60 BONES ALL\nCONNECTED TO\nTHEIR SPINE',
                'THEY CAN FEEL\nEVERY TOUCH ON\nTHEIR SHELL —\nIT HAS NERVES'],
     'body': 'Some turtle species can absorb oxygen through their rear end — it\'s called cloacal respiration, and it helps them survive long periods underwater. Their shell isn\'t just armor — it\'s made of about 60 bones fused to their spine and rib cage. And it has nerve endings, so yes, they feel everything.'},

    {'topic': 'snake-jaw', 'query': 'snake close up head',
     'slides': ['SNAKES DON\'T\nDISLOCATE THEIR\nJAW TO EAT —\nIT\'S TWO PIECES',
                'THEIR LOWER JAW\nIS SPLIT IN HALF\nAND MOVES\nINDEPENDENTLY',
                'THEY SMELL WITH\nTHEIR TONGUE BY\nCOLLECTING\nPARTICLES',
                'SOME SPECIES CAN\nGO 2 YEARS\nWITHOUT EATING'],
     'body': 'Snakes don\'t actually dislocate their jaw — their lower jawbone is two separate pieces connected by an elastic ligament, each moving independently. They flick their tongue to collect chemical particles from the air, which they analyze with a special organ on the roof of their mouth. Some species can survive up to 2 years without a meal.'},

    # ── BIRDS ────────────────────────────────────────────────────
    {'topic': 'crow-grudge', 'query': 'crow black bird intelligent',
     'slides': ['CROWS CAN\nRECOGNIZE HUMAN\nFACES AND HOLD\nGRUDGES FOR YEARS',
                'THEY TEACH THEIR\nBABIES WHICH\nHUMANS TO AVOID',
                'THEY USE TOOLS\nAND SOLVE\nMULTI-STEP\nPUZZLES',
                'THEY HAVE BEEN\nSEEN LEAVING GIFTS\nFOR HUMANS WHO\nFEED THEM'],
     'body': 'Crows recognize individual human faces and hold grudges for years. If you wrong a crow, it will warn its family — and the next generation will avoid you too, even if they\'ve never met you. They use tools, solve multi-step puzzles, and have been documented leaving gifts like shiny objects for humans who feed them.'},

    {'topic': 'owl-neck', 'query': 'owl portrait close up',
     'slides': ['OWLS CAN ROTATE\nTHEIR HEADS\n270 DEGREES',
                'THEY CAN\'T MOVE\nTHEIR EYEBALLS\nSO THEY MOVE\nTHEIR WHOLE HEAD',
                'THEIR FLIGHT IS\nCOMPLETELY SILENT\nTO PREY',
                'A GROUP OF OWLS\nIS CALLED A\nPARLIAMENT'],
     'body': 'Owls can rotate their heads 270 degrees because they can\'t move their eyeballs — they\'re tube-shaped and fixed in the skull. They have special blood pooling systems to maintain brain blood flow during rotation. Their feathers are designed for silent flight, making them virtually undetectable to prey. A group is called a parliament.'},

    {'topic': 'hummingbird', 'query': 'hummingbird flower hovering',
     'slides': ['HUMMINGBIRDS ARE\nTHE ONLY BIRDS\nTHAT CAN FLY\nBACKWARDS',
                'THEIR HEART BEATS\nUP TO 1,200 TIMES\nPER MINUTE',
                'THEY VISIT UP TO\n2,000 FLOWERS\nEVERY DAY',
                'THEY WEIGH LESS\nTHAN A NICKEL'],
     'body': 'Hummingbirds are the only birds that can fly backwards, upside down, and hover in place like a helicopter. Their heart beats up to 1,200 times per minute, and they visit up to 2,000 flowers daily. Most weigh less than a nickel. At night, they enter a hibernation-like state called torpor to survive without eating.'},

    {'topic': 'penguin-love', 'query': 'penguin pair couple',
     'slides': ['PENGUINS PROPOSE\nWITH A PEBBLE',
                'A MALE SEARCHES\nTHE ENTIRE BEACH\nFOR THE PERFECT\nONE',
                'IF SHE ACCEPTS\nTHEY MATE FOR\nLIFE',
                'THEY CAN DRINK\nSALT WATER —\nA GLAND FILTERS\nOUT THE SALT'],
     'body': 'When a male penguin finds the one, he searches the entire beach for the smoothest, most perfect pebble he can find and presents it to the female. If she accepts, they\'re partners for life. Penguins also have a supraorbital gland above their eyes that filters salt from seawater, letting them drink ocean water.'},

    {'topic': 'parrot-age', 'query': 'parrot colorful tropical bird',
     'slides': ['SOME PARROTS\nCAN LIVE OVER\n80 YEARS',
                'THEY UNDERSTAND\nTHE CONCEPT\nOF ZERO',
                'THEY NAME THEIR\nBABIES WITH\nUNIQUE SOUNDS',
                'AN AFRICAN GREY\nNAMED ALEX COULD\nIDENTIFY 100+\nOBJECTS BY NAME'],
     'body': 'Some parrot species live over 80 years, often outliving their owners. African Grey parrots understand abstract concepts like zero and can identify over 100 objects by name. Parrot parents give each chick a unique call — essentially a name — that the chick uses for life. Other flock members use this name to address them.'},

    {'topic': 'flamingo', 'query': 'flamingo pink water',
     'slides': ['FLAMINGOS ARE\nBORN WHITE AND\nTURN PINK FROM\nTHEIR DIET',
                'THEY CAN ONLY\nEAT WITH THEIR\nHEAD UPSIDE DOWN',
                'THEY STAND ON\nONE LEG BECAUSE\nIT USES ZERO\nMUSCLE EFFORT',
                'A GROUP IS\nCALLED A\nFLAMBOYANCE'],
     'body': 'Flamingos are born gray-white and gradually turn pink from the carotenoid pigments in shrimp and algae they eat. They filter-feed with their head upside down. Standing on one leg is actually their resting position — it requires zero muscular effort thanks to a locking mechanism in their joints. A group is officially called a flamboyance.'},

    {'topic': 'eagle-vision', 'query': 'bald eagle flying',
     'slides': ['EAGLES CAN SEE\nA RABBIT FROM\n2 MILES AWAY',
                'THEIR VISION IS\n8 TIMES SHARPER\nTHAN A HUMAN\'S',
                'THEY CAN SEE\nULTRAVIOLET LIGHT\nHUMANS CAN\'T',
                'THEIR NESTS CAN\nWEIGH OVER\n2 TONS'],
     'body': 'Eagles have the sharpest vision of any animal — about 8 times sharper than a human with perfect vision. They can spot a rabbit from over 2 miles away and see ultraviolet light invisible to us. Bald eagle nests are reused and added to each year, with some reaching over 2 tons — heavy enough to collapse the tree.'},

    {'topic': 'pigeon-math', 'query': 'pigeon city bird',
     'slides': ['PIGEONS CAN DO\nBASIC MATH AND\nLEARN ABSTRACT\nRULES',
                'THEY HAVE BEEN\nUSED TO DELIVER\nMESSAGES FOR\n3,000 YEARS',
                'THEY CAN FIND\nTHEIR WAY HOME\nFROM 1,300 MILES\nAWAY',
                'THEY SAVED\nTHOUSANDS OF\nLIVES IN BOTH\nWORLD WARS'],
     'body': 'Pigeons can learn abstract numerical rules and do basic math — ranking groups of objects from fewest to most. They\'ve been used as message carriers for over 3,000 years and can find their way home from 1,300 miles away using Earth\'s magnetic field, the sun, and landmarks. In both World Wars, pigeon messengers saved thousands of lives.'},

    {'topic': 'woodpecker', 'query': 'woodpecker tree pecking',
     'slides': ['WOODPECKERS PECK\n20 TIMES PER\nSECOND WITH\nZERO BRAIN DAMAGE',
                'THEIR TONGUE\nWRAPS AROUND\nTHEIR ENTIRE\nSKULL',
                'EACH PECK HITS\nWITH THE FORCE\nOF 1,000 G\'S',
                'THEIR SKULL HAS\nBUILT-IN SHOCK\nABSORBERS'],
     'body': 'Woodpeckers peck up to 20 times per second — each impact generating forces of 1,000 G\'s. A human would get a concussion at 100 G\'s. Their brain is protected by a spongy bone structure that acts as a shock absorber. Their tongue is so long it wraps around the entire skull and anchors near the nostril.'},

    # ── AMPHIBIANS ───────────────────────────────────────────────
    {'topic': 'frog-water', 'query': 'frog green colorful',
     'slides': ['FROGS DON\'T\nDRINK WATER\nTHEY ABSORB IT\nTHROUGH THEIR SKIN',
                'SOME FROGS CAN\nFREEZE SOLID\nIN WINTER AND\nCOME BACK TO LIFE',
                'THE GOLDEN POISON\nFROG HAS ENOUGH\nVENOM TO KILL\n10 HUMANS',
                'A GROUP OF FROGS\nIS CALLED\nAN ARMY'],
     'body': 'Frogs never drink water — they absorb it directly through a patch of skin on their belly. Some species like the wood frog can freeze solid in winter — heart stops, blood freezes — then thaw out and hop away in spring. The golden poison dart frog carries enough venom on its skin to kill 10 adult humans.'},

    {'topic': 'axolotl', 'query': 'axolotl pink aquarium',
     'slides': ['AXOLOTLS CAN\nREGROW THEIR\nBRAIN HEART LIMBS\nAND SPINE',
                'THEY STAY IN\nTHEIR BABY FORM\nTHEIR ENTIRE LIFE',
                'THEY EXIST IN\nTHE WILD IN ONLY\nONE LAKE IN\nMEXICO',
                'SCIENTISTS STUDY\nTHEM TO UNLOCK\nHUMAN REGENERATION'],
     'body': 'Axolotls can regenerate almost any body part — limbs, heart, brain, spinal cord — with zero scarring. They never undergo metamorphosis, staying in their larval (baby) form their entire life. In the wild, they only exist in one lake system near Mexico City. Scientists are studying their DNA to understand how humans might someday regenerate tissue.'},

    {'topic': 'poison-dart', 'query': 'poison dart frog colorful',
     'slides': ['POISON DART FROGS\nARE ONLY TOXIC\nIN THE WILD NOT\nIN CAPTIVITY',
                'THEIR POISON\nCOMES FROM THE\nINSECTS THEY EAT',
                'INDIGENOUS PEOPLE\nUSE THEIR TOXIN\nON BLOWGUN DARTS',
                'THE BRIGHTER\nTHE COLOR THE\nMORE DEADLY\nTHE FROG'],
     'body': 'Poison dart frogs raised in captivity are completely non-toxic. Their poison comes entirely from the specific ants, mites, and beetles they eat in the wild. Indigenous Colombians rubbed blowgun darts on the frog\'s back to create lethal hunting weapons. The most vibrant colors signal the highest toxicity — nature\'s warning label.'},

    {'topic': 'salamander', 'query': 'salamander forest nature',
     'slides': ['GIANT SALAMANDERS\nCAN GROW UP TO\n6 FEET LONG',
                'THEY BREATHE\nTHROUGH THEIR\nSKIN',
                'SOME SPECIES\nCAN LIVE UP TO\n100 YEARS',
                'THEY HAVE BARELY\nCHANGED IN 170\nMILLION YEARS'],
     'body': 'The Chinese giant salamander can grow up to 6 feet long — the largest amphibian on Earth. Many salamander species have no lungs and breathe entirely through their moist skin. Some species can live up to 100 years. They\'ve barely changed in 170 million years — they were already walking the Earth alongside early dinosaurs.'},










    # ── WEIRD / QUIRKY ───────────────────────────────────────────
    {'topic': 'wombat-poop', 'query': 'wombat cute australian',
     'slides': ['WOMBATS POOP\nIN PERFECT CUBES',
                'THEY STACK THEM\nON ROCKS AND\nLOGS TO MARK\nTERRITORY',
                'SCIENTISTS DIDN\'T\nFIGURE OUT HOW\nUNTIL 2021',
                'THEIR INTESTINES\nHAVE VARYING\nELASTICITY THAT\nSHAPES IT'],
     'body': 'Wombat poop comes out in perfect cubes. They stack the cubes on rocks, logs, and elevated surfaces to mark territory — cube shape prevents them from rolling away. Scientists spent years trying to figure out how they do it, finally discovering in 2021 that varying elasticity in different parts of their intestines shapes the feces into cubes.'},

    {'topic': 'shrimp-heart', 'query': 'shrimp underwater marine',
     'slides': ['A SHRIMP\'S HEART\nIS LOCATED IN\nITS HEAD',
                'PISTOL SHRIMP\nCAN SNAP THEIR\nCLAW SO FAST IT\nCREATES A SONIC\nBOOM',
                'THE SNAP REACHES\n218 DECIBELS —\nLOUDER THAN A\nGUNSHOT',
                'THE BUBBLE IT\nCREATES BRIEFLY\nREACHES THE\nTEMPERATURE\nOF THE SUN'],
     'body': 'A shrimp\'s heart is located in its head. The pistol shrimp can snap its claw so fast it creates a cavitation bubble that produces a sonic boom reaching 218 decibels — louder than a gunshot. For a fraction of a second, that bubble reaches nearly the temperature of the sun\'s surface.'},

    {'topic': 'horned-lizard', 'query': 'horned lizard desert',
     'slides': ['HORNED LIZARDS\nCAN SHOOT BLOOD\nFROM THEIR EYES',
                'THE BLOOD STREAM\nCAN REACH UP TO\n5 FEET',
                'IT TASTES\nTERRIBLE TO\nPREDATORS',
                'THEY AIM\nDIRECTLY AT THE\nPREDATOR\'S MOUTH'],
     'body': 'When threatened, horned lizards shoot a stream of blood from their eyes that can reach up to 5 feet. The blood contains a chemical that tastes absolutely foul to canine and feline predators. They deliberately aim at the predator\'s mouth. It\'s one of the most bizarre defense mechanisms in the animal kingdom.'},

    {'topic': 'tardigrade', 'query': 'tardigrade microscope micro',
     'slides': ['TARDIGRADES CAN\nSURVIVE IN SPACE\nWITH NO SUIT',
                'THEY SURVIVE\nTEMPERATURES FROM\n-458°F TO 300°F',
                'THEY CAN GO\n30 YEARS WITHOUT\nFOOD OR WATER',
                'THEY HAVE\nSURVIVED ALL FIVE\nMASS EXTINCTIONS'],
     'body': 'Tardigrades (water bears) are the most indestructible creatures on Earth. They\'ve survived the vacuum of space, radiation 1,000 times the lethal human dose, temperatures from near absolute zero to 300°F, and pressures 6 times greater than the deepest ocean. They can go 30 years without food or water and have survived all five mass extinctions.'},

    {'topic': 'narwhal', 'query': 'narwhal arctic whale tusk',
     'slides': ['A NARWHAL\'S TUSK\nIS ACTUALLY A\nGIANT TOOTH\nGROWING THROUGH\nITS LIP',
                'IT HAS 10 MILLION\nNERVE ENDINGS\nAND CAN SENSE\nWATER CHANGES',
                'THEY CAN DIVE\nTO 5,000 FEET\nDEEP',
                'MEDIEVAL EUROPEANS\nTHOUGHT THEIR\nTUSKS WERE\nUNICORN HORNS'],
     'body': 'A narwhal\'s tusk is actually a canine tooth that grows through its upper lip in a spiral, reaching up to 10 feet long. It contains 10 million nerve endings and acts as a sensory organ, detecting changes in water temperature, salinity, and pressure. In medieval Europe, narwhal tusks sold for more than gold — people believed they were unicorn horns.'},

    {'topic': 'pangolin', 'query': 'pangolin scales wildlife',
     'slides': ['PANGOLINS ARE THE\nMOST TRAFFICKED\nANIMAL ON EARTH',
                'THEIR SCALES ARE\nMADE OF KERATIN\nSAME AS YOUR\nFINGERNAILS',
                'THEY ROLL INTO\nA BALL SO TIGHT\nLIONS CAN\'T\nOPEN THEM',
                'THEY HAVE NO\nTEETH AND USE\nSTOMACH ROCKS\nTO GRIND FOOD'],
     'body': 'Pangolins are the world\'s most trafficked animal — over a million have been poached in the last decade. Their scales are made of keratin, the same protein as human fingernails, yet they\'re strong enough that lions can\'t pry them open when they curl up. They have no teeth and swallow small stones that grind food in their stomach, like a built-in mortar and pestle.'},

    {'topic': 'electric-eel', 'query': 'electric eel underwater',
     'slides': ['ELECTRIC EELS\nARE NOT ACTUALLY\nEELS — THEY\'RE\nCLOSER TO CATFISH',
                'THEY CAN PRODUCE\n860 VOLTS —\nENOUGH TO STUN\nA HORSE',
                'THEY HAVE 3\nELECTRIC ORGANS\nTAKING UP 80%\nOF THEIR BODY',
                'THEY USE LOW\nVOLTAGE PULSES\nLIKE RADAR TO\nNAVIGATE'],
     'body': 'Electric eels aren\'t eels at all — they\'re more closely related to catfish. They can produce up to 860 volts, enough to stun a horse or knock a human unconscious. Three electric organs make up 80% of their body. They use low-voltage pulses like radar to navigate murky water, and high-voltage blasts to stun prey.'},

    {'topic': 'mimic-octopus', 'query': 'mimic octopus underwater',
     'slides': ['THE MIMIC OCTOPUS\nCAN IMPERSONATE\n15 DIFFERENT\nSPECIES',
                'IT MIMICS\nLIONFISH FLATFISH\nAND SEA SNAKES\nON DEMAND',
                'IT CHOOSES WHICH\nANIMAL TO COPY\nBASED ON THE\nTHREAT',
                'IT WAS ONLY\nDISCOVERED\nIN 1998'],
     'body': 'The mimic octopus can impersonate at least 15 different species by changing its color, shape, and movement. It becomes a lionfish to intimidate, a flatfish to escape, a sea snake to threaten. It chooses which animal to mimic based on what predator is attacking it. This species was only discovered in 1998 — imagine what else is out there.'},

    {'topic': 'albatross', 'query': 'albatross flying ocean bird',
     'slides': ['ALBATROSSES CAN\nFLY 10,000 MILES\nWITHOUT FLAPPING\nTHEIR WINGS',
                'THEY SLEEP\nWHILE FLYING\nOVER THE OCEAN',
                'THEY DRINK\nSEAWATER AND\nSNEEZE OUT\nTHE SALT',
                'THEY CAN LIVE\nOVER 70 YEARS'],
     'body': 'Albatrosses can fly 10,000 miles without flapping their wings once — they lock their wingspan and glide on ocean wind currents. They sleep while flying, with half their brain resting at a time. They drink seawater and filter the salt through a special gland, sneezing it out. Some live past 70 — there\'s a known albatross still raising chicks at age 73.'},

    {'topic': 'bombardier-beetle', 'query': 'beetle insect macro colorful',
     'slides': ['THE BOMBARDIER\nBEETLE SPRAYS\nBOILING CHEMICAL\nFROM ITS REAR END',
                'THE SPRAY REACHES\n212°F — THE\nBOILING POINT\nOF WATER',
                'IT CAN AIM\nIN ANY DIRECTION\nWITH PRECISION',
                'THE CHEMICAL\nREACTION HAPPENS\n500 TIMES PER\nSECOND'],
     'body': 'When threatened, the bombardier beetle sprays a boiling chemical mixture from its abdomen at 212°F — literally the boiling point of water. It can aim the spray in any direction with pinpoint accuracy. The chemical reaction happens in rapid pulses, about 500 per second, creating a machine-gun-like spray that deters almost any predator.'},

    {'topic': 'cuttlefish', 'query': 'cuttlefish underwater colorful',
     'slides': ['CUTTLEFISH HAVE\nTHREE HEARTS\nAND GREEN BLOOD',
                'THEY HAVE THE\nLARGEST BRAIN-TO-\nBODY RATIO OF\nANY INVERTEBRATE',
                'THEY CAN CREATE\nMOVING COLOR\nPATTERNS ON\nTHEIR SKIN',
                'MALES DISGUISE AS\nFEMALES TO SNEAK\nPAST RIVAL MALES'],
     'body': 'Cuttlefish have three hearts, green blood, and the largest brain-to-body ratio of any invertebrate. Their skin contains millions of chromatophores that create moving, animated color patterns — like a living TV screen. Male cuttlefish have been observed disguising half their body as female to sneak past rival males and mate undetected.'},

    {'topic': 'capybara', 'query': 'capybara water relaxing',
     'slides': ['CAPYBARAS ARE\nTHE WORLD\'S\nLARGEST RODENT\nAT 140 POUNDS',
                'EVERY ANIMAL\nLOVES THEM —\nTHEY HAVE ZERO\nNATURAL ENEMIES',
                'THEY CAN HOLD\nTHEIR BREATH FOR\n5 MINUTES\nUNDERWATER',
                'THEY ARE\nBASICALLY A\nGIANT GUINEA PIG'],
     'body': 'Capybaras are the world\'s largest rodent, weighing up to 140 pounds — basically giant guinea pigs. They\'re famous for being universally loved by other animals — birds, monkeys, rabbits, and even crocodiles have been photographed peacefully sitting on or next to them. They\'re highly social and can hold their breath underwater for 5 minutes.'},

    {'topic': 'lyrebird', 'query': 'lyrebird australian bird',
     'slides': ['THE LYREBIRD CAN\nPERFECTLY MIMIC\nANY SOUND IT\nHEARS',
                'CHAINSAWS\nCAR ALARMS\nCAMERA SHUTTERS\nHUMAN SPEECH',
                'THEY HAVE BEEN\nDOING THIS FOR\n15 MILLION YEARS',
                'MALES PERFORM\n20-MINUTE CONCERTS\nTO ATTRACT MATES'],
     'body': 'The Australian lyrebird can perfectly replicate any sound it hears — chainsaws, car alarms, camera shutters, other bird species, even human speech. They\'ve had this ability for 15 million years, long before chainsaws existed. Males perform elaborate 20-minute sound concerts combining dozens of mimicked sounds to impress females.'},

    {'topic': 'mantis-shrimp', 'query': 'mantis shrimp colorful underwater',
     'slides': ['MANTIS SHRIMP\nPUNCH WITH THE\nFORCE OF A\n.22 CALIBER BULLET',
                'THEIR STRIKE IS\nSO FAST IT BOILS\nTHE WATER\nAROUND IT',
                'THEY SEE 16\nCOLORS — HUMANS\nONLY SEE 3',
                'THEY CAN BREAK\nAQUARIUM GLASS\nWITH ONE HIT'],
     'body': 'The mantis shrimp punches with the force of a .22 caliber bullet — so fast it creates cavitation bubbles that briefly reach the temperature of the sun. They can shatter aquarium glass with a single strike. Their eyes see 16 color channels (humans see 3), including ultraviolet and infrared light. Pound for pound, the most powerful creature on Earth.'},

    {'topic': 'snow-leopard', 'query': 'snow leopard mountain',
     'slides': ['SNOW LEOPARDS\nCAN\'T ROAR',
                'THEY USE THEIR\nTHICK TAIL AS A\nBLANKET WHILE\nSLEEPING',
                'THEY CAN LEAP\n50 FEET IN A\nSINGLE BOUND',
                'THERE ARE FEWER\nSNOW LEOPARDS\nTHAN ASTRONAUTS\nWHO\'VE BEEN TO\nSPACE — ALMOST'],
     'body': 'Snow leopards are the only big cats that can\'t roar — they purr, hiss, and make a sound called chuffing. They wrap their massive, thick tail around their face like a blanket while sleeping in freezing temperatures. They can leap up to 50 feet horizontally. With only about 4,000-6,500 left in the wild, they\'re one of the most elusive cats on Earth.'},

    {'topic': 'deep-sea-angler', 'query': 'anglerfish deep sea dark',
     'slides': ['THE ANGLERFISH\nLURES PREY WITH\nA GLOWING LIGHT\nON ITS HEAD',
                'MALES ARE TINY\nAND FUSE TO THE\nFEMALE\'S BODY\nPERMANENTLY',
                'THEY SHARE A\nBLOODSTREAM AND\nHE SLOWLY\nDISAPPEARS',
                'THEY LIVE SO\nDEEP HUMANS\nRARELY SEE THEM\nALIVE'],
     'body': 'Deep sea anglerfish use a bioluminescent lure dangling from their head to attract prey in total darkness. When a tiny male finds a female, he bites into her skin and permanently fuses to her body — their circulatory systems merge and his body gradually dissolves until he\'s nothing but a pair of reproductive organs. Extreme commitment.'},

    {'topic': 'box-jellyfish', 'query': 'box jellyfish ocean blue',
     'slides': ['BOX JELLYFISH HAVE\n24 EYES AND CAN\nACTUALLY SEE\nIMAGES',
                'THEY ARE ONE OF\nTHE MOST VENOMOUS\nCREATURES ON\nEARTH',
                'THEIR STING CAN\nKILL A HUMAN IN\nUNDER 5 MINUTES',
                'DESPITE 24 EYES\nTHEY HAVE NO\nBRAIN TO PROCESS\nWHAT THEY SEE'],
     'body': 'Box jellyfish have 24 eyes arranged in clusters of six on each side of their cube-shaped body — some eyes have lenses, corneas, and retinas capable of forming images. Yet they have no brain to process vision. Their venom is among the most deadly on Earth, capable of killing a human in under 5 minutes by stopping the heart.'},

    {'topic': 'hippo', 'query': 'hippopotamus water river',
     'slides': ['HIPPOS KILL MORE\nHUMANS IN AFRICA\nTHAN ANY OTHER\nLARGE ANIMAL',
                'THEY SECRETE\nNATURAL SUNSCREEN\nTHAT IS RED —\nCALLED BLOOD SWEAT',
                'THEY CAN\'T\nACTUALLY SWIM\nTHEY RUN ON THE\nRIVER BOTTOM',
                'THEY CAN OPEN\nTHEIR MOUTH\n180 DEGREES'],
     'body': 'Hippos are responsible for more human deaths in Africa than any other large animal — they\'re extremely territorial and surprisingly fast. They secrete a red, oily substance nicknamed blood sweat that acts as natural sunscreen and antibiotic. They can\'t actually swim — they run along the river bottom. Their jaw opens a full 180 degrees.'},

    {'topic': 'bioluminescence', 'query': 'bioluminescent ocean glow',
     'slides': ['90% OF DEEP SEA\nCREATURES PRODUCE\nTHEIR OWN LIGHT',
                'BIOLUMINESCENT\nBAYS GLOW BRIGHT\nBLUE WHEN YOU\nSWIM IN THEM',
                'THERE ARE ONLY\n5 PERMANENT\nBIO BAYS IN THE\nENTIRE WORLD',
                'THE LIGHT COMES\nFROM BILLIONS OF\nTINY ORGANISMS\nCALLED\nDINOFLAGELLATES'],
     'body': 'In the deep ocean, 90% of creatures produce their own light. On the surface, bioluminescent bays glow electric blue when disturbed — every wave, splash, or swimming stroke lights up. There are only 5 permanent bioluminescent bays in the world. The glow comes from billions of dinoflagellates, single-celled organisms that flash when agitated.'},
]

# ═══════════════════════════════════════════════════════════════════
# IMAGE GENERATION — green gradient + bold centered headline
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

def get_photos(query, count=4):
    """Fetch multiple unique photos from one Pexels search."""
    r = requests.get('https://api.pexels.com/v1/search',
        headers={'Authorization': PX},
        params={'query': query, 'orientation': 'portrait', 'per_page': 15}, timeout=15)
    pics = r.json().get('photos', [])
    if len(pics) < count:
        r2 = requests.get('https://api.pexels.com/v1/search',
            headers={'Authorization': PX},
            params={'query': query.split()[0] + ' nature animal', 'orientation': 'portrait', 'per_page': 15}, timeout=15)
        pics.extend(r2.json().get('photos', []))
    if not pics:
        print('FATAL: No photos for: ' + query); exit(1)
    selected = random.sample(pics[:12], min(count, len(pics)))
    photos = []
    for p in selected:
        url = p['src']['large2x']
        print(f'  Got photo: {url[:80]}')
        img = Image.open(BytesIO(requests.get(url, timeout=30).content)).convert('RGBA')
        photos.append(img)
    return photos

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

def draw_slide(photo, headline, is_first, badge=None):
    """Tampa Latest inspired: photo-dominant, text hugging the bottom."""
    img = fitimg(photo.copy())

    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(ov)

    # Bottom gradient — starts at 55% so photo stays dominant
    grad_start = int(H * 0.55)
    for y in range(grad_start, H):
        p = (y - grad_start) / (H - grad_start)
        a = min(int((p ** 0.7) * 250), 250)
        d_ov.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)

    MARGIN = 48

    # "P E T O S H E A L T H" — small tracked-out label above headline
    f_label = ft(16)
    label = 'P E T O S H E A L T H'
    lbb = f_label.getbbox(label)
    lw = lbb[2] - lbb[0]

    # Headline — massive, bold, white, hugging bottom
    f_head = ft(76)
    lines = headline.split('\n')
    line_h = 84
    total_text_h = len(lines) * line_h
    text_bottom = H - 70
    text_top = text_bottom - total_text_h

    # Label position above headline
    label_y = text_top - 32
    d.text(((W - lw) // 2, label_y), label, font=f_label, fill=(*TEAL, 230))

    # Headline — drop shadow + white
    y = text_top
    for line in lines:
        bb = f_head.getbbox(line)
        lw2 = bb[2] - bb[0]
        cx = (W - lw2) // 2
        d.text((cx + 3, y + 3), line, font=f_head, fill=(0, 0, 0, 130))
        d.text((cx, y), line, font=f_head, fill=WHITE)
        y += line_h

    # Small teal accent line
    d.line([(W // 2 - 50, y + 8), (W // 2 + 50, y + 8)], fill=TEAL, width=3)

    # "SWIPE FOR MORE →" on first slide, bottom edge
    if is_first:
        f_swipe = ft(13)
        swipe = 'SWIPE FOR MORE  \u2192'
        sbb = f_swipe.getbbox(swipe)
        sw = sbb[2] - sbb[0]
        d.text(((W - sw) // 2, H - 30), swipe, font=f_swipe, fill=(*WHITE, 160))

    return img

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    import sys
    PREVIEW = '--preview' in sys.argv

    print('=== PETOSHEALTH — QUIRKY ANIMAL & NATURE FACTS ===')
    log = load_log()
    recent = recently_posted(log)
    print(f'Recently posted ({REPOST_DAYS}d): {len(recent)} topics')

    fresh = [f for f in FACTS if f['topic'] not in recent]
    print(f'Fresh topics: {len(fresh)} / {len(FACTS)}')

    if not fresh:
        print('All topics posted recently — picking oldest')
        topic_times = {e['topic']: e['timestamp'] for e in log}
        FACTS.sort(key=lambda f: topic_times.get(f['topic'], ''))
        fact = FACTS[0]
    else:
        fact = random.choice(fresh)

    print(f'\nSELECTED: {fact["topic"]}')
    slides = fact['slides']
    print(f'Slides: {len(slides)}')

    # Fetch photos
    print(f'\n=== FETCHING PHOTOS ===')
    photos = get_photos(fact['query'], len(slides))

    # Generate slides
    print('\n=== GENERATING SLIDES ===')
    slide_paths = []
    for i, headline in enumerate(slides, 1):
        img = draw_slide(photos[i-1], headline, is_first=(i == 1))
        out_path = OUT / f'slide_{i}.png'
        img.convert('RGB').save(out_path, quality=95)
        print(f'  {out_path.name}: {out_path.stat().st_size} bytes')
        slide_paths.append(out_path)

    caption = build_caption(fact['body'])
    print(f'\nCaption:\n{caption}\n')

    if PREVIEW:
        print('PREVIEW MODE — not posting.')
        exit(0)

    # Verify files
    for s in slide_paths:
        if s.stat().st_size < 50000:
            print(f'WARNING: {s.name} too small'); exit(1)

    # Upload and post
    print('\n=== POSTING TO INSTAGRAM (@petoshealth) ===')
    IG = f'https://graph.facebook.com/v25.0/{ACCT}'
    urls = []
    for s in slide_paths:
        print(f'Uploading {s.name}...')
        with open(s, 'rb') as f:
            r = requests.post('https://catbox.moe/user/api.php',
                data={'reqtype': 'fileupload'}, files={'fileToUpload': f}, timeout=60)
            if r.status_code == 200 and r.text.startswith('https://'):
                urls.append(r.text.strip()); print(f'  {r.text.strip()}')
            else:
                print(f'  UPLOAD FAILED: {r.text}'); exit(1)

    children = []
    for u in urls:
        r = requests.post(IG + '/media', json={
            'image_url': u, 'is_carousel_item': True, 'access_token': TOKEN
        }, timeout=30)
        print(f'  Container: {r.text[:120]}')
        r.raise_for_status()
        children.append(r.json()['id'])

    print('Waiting 15s...')
    time.sleep(15)
    cr = requests.post(IG + '/media', json={
        'media_type': 'CAROUSEL',
        'children': ','.join(children),
        'caption': caption,
        'access_token': TOKEN
    }, timeout=30)
    print(f'Carousel: {cr.text[:120]}')
    cr.raise_for_status()
    cid = cr.json()['id']

    print('Waiting 15s...')
    time.sleep(15)
    pub = requests.post(IG + '/media_publish', json={
        'creation_id': cid, 'access_token': TOKEN
    }, timeout=30)
    print(f'Publish: {pub.text[:120]}')
    pub.raise_for_status()
    ig_id = pub.json()['id']
    print(f'\nPOSTED! ID: {ig_id}')

    save_log(log, fact['topic'], ig_id)
    print('DONE.')
