"""
@petoshealthyb — Fun Fact Instagram Stories
Posts a single story slide (1080x1920) with a quirky animal/nature fact.
Uses the FACTS database from petos_post.py and the story posting pattern
from post_story.py (catbox upload + IG Graph API STORIES endpoint).

Runs 1x/day via GitHub Actions.
"""
import os, random, json, sys, time, requests
from io import BytesIO
from pathlib import Path
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── Config ───────────────────────────────────────────────────────────
W, H = 1080, 1920  # Story dimensions (9:16)
PX    = os.environ['PEXELS_API_KEY']
TOKEN = os.environ['PETOSB_PAGE_ACCESS_TOKEN']
ACCT  = os.environ['PETOSB_IG_ACCOUNT_ID']

LOG_FILE       = Path(__file__).parent / 'petosb_story_log.json'
REPOST_DAYS    = 30
RETENTION_DAYS = 90

# Cross check all logs to prevent duplicates across accounts and post types
ALL_LOG_FILES = [
    Path(__file__).parent / 'petos_story_log.json',
    Path(__file__).parent / 'petos_posted_log.json',
    Path(__file__).parent / 'petosb_story_log.json',
    Path(__file__).parent / 'petosb_posted_log.json',
]

# Brand colors
DARK_TEAL = (15, 60, 50)
TEAL      = (41, 182, 151)
WHITE     = (255, 255, 255)
BRAND     = 'PETOSHEALTHYB'

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
    cutoff = (now - timedelta(days=RETENTION_DAYS)).isoformat()
    log = [e for e in log if e.get('timestamp', '') > cutoff]
    LOG_FILE.write_text(json.dumps(log, indent=2))

def recently_posted(log):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=REPOST_DAYS)).isoformat()
    topics = set()
    # Check all log files across both accounts to prevent any duplicates
    for log_path in ALL_LOG_FILES:
        if log_path.exists():
            try:
                entries = json.loads(log_path.read_text())
                for e in entries:
                    if e.get('timestamp', '') > cutoff:
                        t = e.get('topic', '')
                        topics.add(t)
                        if ':' in t:
                            topics.add(t.split(':', 1)[-1])
            except (json.JSONDecodeError, OSError):
                pass
    return topics

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

TAGS = "\n\n#petoshealthyb #funfacts #didyouknow #animals #nature #wildlife #animalfacts #science"

def build_caption(body):
    return f"{random.choice(INTROS)}\n\n{body}{random.choice(CLOSERS)}{TAGS}"

# ═══════════════════════════════════════════════════════════════════
# FACTS DATABASE — 80+ quirky animal & nature facts
# topic: unique key | query: Pexels search | slides: headlines | body: caption text
# ═══════════════════════════════════════════════════════════════════

FACTS = [
    # ── INSECTS ──────────────────────────────────────────────────
    {'topic': 'mosquito', 'query': 'mosquito macro insect',
     'slides': ['MOSQUITOES HAVE\nKILLED MORE HUMANS\nTHAN EVERY WAR\nCOMBINED',
                'THEY CAN DETECT\nYOUR BREATH FROM\n100 FEET AWAY',
                'THEIR MOUTH HAS\n6 NEEDLE-LIKE\nPARTS THAT SAW\nINTO YOUR SKIN',
                'AND ONLY THE\nFEMALES BITE —\nMALES JUST SIP\nFLOWER NECTAR'],
     'body': 'Mosquitoes have killed more humans than every war in history combined. Their mouth has 6 needle-like stylets that saw into your skin. Only females bite — males sip flower nectar. They detect CO2 from your breath up to 100 feet away.'},

    {'topic': 'firefly', 'query': 'firefly glowing night',
     'slides': ['FIREFLIES PRODUCE\nTHE MOST EFFICIENT\nLIGHT ON EARTH',
                'UP TO 90% OF\nTHEIR ENERGY\nBECOMES LIGHT —\nALMOST ZERO HEAT',
                'EACH SPECIES HAS\nITS OWN UNIQUE\nFLASH PATTERN',
                'SOME FEMALES MIMIC\nOTHER SPECIES\nFLASH TO EAT THEM'],
     'body': 'Firefly light is the most efficient light source ever observed — up to 90% of the energy becomes visible light with almost zero heat. A lightbulb wastes 90% as heat. Each species has a unique flash pattern to find mates, and some femme fatale fireflies mimic other species\' flashes to lure and eat them.'},

    {'topic': 'dragonfly', 'query': 'dragonfly close up wings',
     'slides': ['DRAGONFLIES HAVE A\n95% HUNTING\nSUCCESS RATE',
                'THAT MAKES THEM\nTHE MOST EFFICIENT\nPREDATOR ON EARTH',
                'LIONS SUCCEED\nONLY 25% OF\nTHE TIME',
                'THEY HAVE EXISTED\nFOR 300 MILLION\nYEARS'],
     'body': 'Dragonflies catch their prey 95% of the time — making them the most efficient predator on Earth. Lions only manage 25%. Great white sharks? About 50%. Dragonflies have been perfecting this for 300 million years — before dinosaurs even existed.'},

    {'topic': 'butterfly-taste', 'query': 'butterfly colorful flower',
     'slides': ['BUTTERFLIES\nTASTE WITH\nTHEIR FEET',
                'THEY LAND ON\nA LEAF AND\nINSTANTLY KNOW\nIF IT\'S FOOD',
                'THEY ALSO SEE\nULTRAVIOLET LIGHT\nREVEALING HIDDEN\nPATTERNS ON FLOWERS',
                'BETWEEN TASTE-FEET\nAND SECRET VISION\nTHEY EXPERIENCE\nA WORLD WE NEVER\nWILL'],
     'body': 'Butterflies have taste receptors on their feet — the moment they land, they know if something is food. They also see ultraviolet light invisible to humans, revealing hidden patterns on flowers. Monarchs migrate 3,000 miles from Canada to Mexico using the sun and Earth\'s magnetic field.'},

    {'topic': 'ant-strength', 'query': 'ant carrying leaf macro',
     'slides': ['ANTS CAN LIFT\n50 TIMES THEIR\nOWN BODY WEIGHT',
                'THEY HAVE TWO\nSTOMACHS — ONE\nFOR THEMSELVES\nONE TO SHARE',
                'THAT TEAMWORK\nBUILT COLONIES\nTHAT HAVE LASTED\nOVER 100 YEARS',
                'THERE ARE NOW\n20 QUADRILLION\nOF THEM — 2.5\nMILLION PER HUMAN'],
     'body': 'An ant can lift 50 times its own body weight. There are an estimated 20 quadrillion ants on Earth — about 2.5 million for every human. They have two stomachs — one for themselves, one to share food with the colony. Some supercolonies span thousands of miles and have lasted over a century.'},

    {'topic': 'bee-honey', 'query': 'honeybee flower pollen',
     'slides': ['A SINGLE BEE\nMAKES ONLY 1/12\nTEASPOON OF HONEY\nIN ITS LIFETIME',
                'TO MAKE ONE\nPOUND OF HONEY\nTHE COLONY FLIES\n55,000 MILES',
                'THEY FIND FLOWERS\nBY DOING A\nWAGGLE DANCE\nTHAT MAPS THE\nEXACT LOCATION',
                'ONE BEE IS\nALMOST NOTHING —\nTOGETHER THEY\nBUILD EMPIRES'],
     'body': 'One honeybee produces just 1/12 of a teaspoon of honey in its entire life. To make one pound, the colony flies 55,000 miles and visits 2 million flowers. Bees can recognize and remember human faces, and they communicate locations by doing a waggle dance.'},

    {'topic': 'mantis', 'query': 'praying mantis green',
     'slides': ['THE PRAYING MANTIS\nIS THE ONLY INSECT\nTHAT CAN TURN\nITS HEAD 180\u00b0',
                'THEY CAN SEE\nIN 3D USING\nSTEREO VISION',
                'FEMALES EAT THE\nMALE AFTER MATING\n25% OF THE TIME',
                'SOME SPECIES\nCAN CATCH\nHUMMINGBIRDS'],
     'body': 'The praying mantis is the only insect that can turn its head a full 180 degrees. They have stereo vision — just like humans — making them incredibly precise hunters. And yes, females do sometimes eat the male after mating. Some large species have been documented catching hummingbirds.'},

    {'topic': 'cockroach', 'query': 'cockroach insect macro',
     'slides': ['COCKROACHES HAVE\nSURVIVED EVERY\nMASS EXTINCTION\nFOR 300 MILLION\nYEARS',
                'THEY CAN LIVE\n2 WEEKS WITHOUT\nA HEAD — THEY\nONLY DIE OF THIRST',
                'THEY CAN HOLD\nTHEIR BREATH FOR\n40 MINUTES AND\nRUN 3 MPH AT BIRTH',
                'NOTHING IN NATURE\nHAS BEEN ABLE TO\nKILL THEM OFF —\nNOTHING'],
     'body': 'Cockroaches can survive two weeks without a head — they only die because they can\'t drink water. They\'ve been around for 300 million years, surviving every mass extinction. They can hold their breath for 40 minutes and run 3 mph as newborns. The ultimate survivors.'},

    {'topic': 'spider-silk', 'query': 'spider web morning dew',
     'slides': ['SPIDER SILK IS\n5X STRONGER THAN\nSTEEL BY WEIGHT',
                'IT IS TOUGHER\nTHAN KEVLAR —\nTHE MATERIAL IN\nBULLETPROOF VESTS',
                'SPIDERS RECYCLE\nTHEIR WEBS BY\nEATING THEM',
                'THEY HAVE BEEN\nWEAVING WEBS FOR\n100 MILLION YEARS'],
     'body': 'Spider silk is five times stronger than steel by weight and tougher than Kevlar — the material used in bulletproof vests. Spiders don\'t waste it — they eat old webs to recycle the protein. They\'ve been perfecting web architecture for over 100 million years.'},

    {'topic': 'ladybug', 'query': 'ladybug red leaf',
     'slides': ['LADYBUGS LOOK\nCUTE BUT THEY\'RE\nTINY KILLING\nMACHINES',
                'A SINGLE ONE\nEATS UP TO 5,000\nAPHIDS IN ITS\nLIFETIME',
                'THREATEN ONE AND\nIT BLEEDS TOXIC\nFLUID FROM ITS\nKNEES',
                'FARMERS HAVE USED\nTHEM AS WEAPONS\nOF PEST CONTROL\nFOR CENTURIES'],
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
                'THEY SURVIVED\nEVERY MASS\nEXTINCTION\nINCLUDING THE ONE\nTHAT KILLED THE\nDINOSAURS',
                'HALF A BILLION\nYEARS AND THEY\nSTILL HAVEN\'T\nNEEDED TO EVOLVE'],
     'body': 'Sharks have existed for 450 million years — that\'s 100 million years before the first trees appeared on Earth. They survived every mass extinction including the one that killed the dinosaurs. Their sense of smell can detect one drop of blood in 25 gallons of water.'},

    {'topic': 'whale-heart', 'query': 'humpback whale ocean',
     'slides': ['A BLUE WHALE\'S\nHEART IS THE SIZE\nOF A GOLF CART',
                'YOU COULD CRAWL\nTHROUGH ITS\nARTERIES',
                'ITS TONGUE WEIGHS\nAS MUCH AS AN\nELEPHANT',
                'ITS HEARTBEAT\nCAN BE DETECTED\nFROM 2 MILES AWAY'],
     'body': 'A blue whale\'s heart is roughly the size of a golf cart and weighs about 400 pounds. Its arteries are so large a small child could crawl through them. Its tongue alone weighs as much as an elephant. And its heartbeat is so powerful it can be detected from 2 miles away.'},

    {'topic': 'seahorse', 'query': 'seahorse underwater colorful',
     'slides': ['SEAHORSES ARE THE\nONLY ANIMAL WHERE\nMALES GIVE BIRTH',
                'MATED PAIRS GREET\nEACH OTHER EVERY\nMORNING WITH A\nCOLOR-CHANGING DANCE',
                'THEY HAVE NO\nSTOMACH — FOOD\nPASSES STRAIGHT\nTHROUGH THEM',
                'SO THEY MUST\nEAT CONSTANTLY\nJUST TO\nSTAY ALIVE'],
     'body': 'Male seahorses carry and deliver the babies — the only animal on Earth where this happens. Bonded pairs greet each other every morning with a dance, changing colors together. They have no stomach, so food passes through them almost immediately. They must eat constantly to survive.'},

    {'topic': 'starfish', 'query': 'starfish ocean tide pool',
     'slides': ['STARFISH HAVE\nNO BRAIN\nAND NO BLOOD',
                'THEY EAT BY\nPUSHING THEIR\nSTOMACH OUTSIDE\nTHEIR BODY',
                'CUT OFF AN ARM\nAND IT GROWS\nINTO A WHOLE\nNEW STARFISH',
                'NO BRAIN NO\nBLOOD AND STILL\nONE OF THE\nHARDEST THINGS\nTO KILL'],
     'body': 'Starfish have no brain and no blood — they pump seawater through their bodies instead. They eat by pushing their stomach out through their mouth, digesting prey externally, then pulling it back in. Some species can regrow an entire body from a single severed arm.'},

    {'topic': 'coral', 'query': 'coral reef colorful underwater',
     'slides': ['CORAL REEFS\nSUPPORT 25% OF\nALL MARINE LIFE',
                'BUT THEY COVER\nLESS THAN 1%\nOF THE OCEAN\nFLOOR',
                'AND CORAL ISN\'T\nEVEN A PLANT —\nIT\'S AN ANIMAL\nMADE OF THOUSANDS\nOF TINY CREATURES',
                'SOME COLONIES\nHAVE BEEN ALIVE\nFOR OVER 4,000\nYEARS — QUIETLY\nKEEPING THE OCEAN\nALIVE'],
     'body': 'Coral reefs support 25% of all marine species while covering less than 1% of the ocean floor. And coral is an animal, not a plant — made up of thousands of tiny creatures called polyps. Some coral colonies are over 4,000 years old, making them among the oldest living organisms on Earth.'},

    {'topic': 'orca', 'query': 'orca killer whale ocean',
     'slides': ['ORCAS ARE NOT\nWHALES — THEY\nARE THE LARGEST\nDOLPHINS',
                'EACH POD HAS\nITS OWN UNIQUE\nDIALECT',
                'THEY HUNT GREAT\nWHITE SHARKS —\nAND ONLY EAT\nTHE LIVER',
                'GRANDMOTHERS LEAD\nTHE POD AND\nTEACH HUNTING'],
     'body': 'Orcas are actually the world\'s largest dolphins, not whales. Each pod speaks its own unique dialect passed down through generations. They hunt great white sharks — and surgically remove just the liver. Grandmother orcas lead the pod and teach younger members how to hunt.'},

    {'topic': 'manta-ray', 'query': 'manta ray underwater',
     'slides': ['MANTA RAYS HAVE\nTHE LARGEST BRAIN\nOF ANY FISH',
                'THEY CAN\nRECOGNIZE\nTHEMSELVES\nIN A MIRROR',
                'THAT SELF-AWARENESS\nMEANS THEY VISIT\nCLEANING STATIONS\nAND PATIENTLY\nWAIT IN LINE',
                'A 23-FOOT\nGENTLE GIANT\nTHAT KNOWS\nITS OWN FACE'],
     'body': 'Manta rays have the largest brain-to-body ratio of any fish and are one of the few animals that can recognize themselves in a mirror — a sign of self-awareness. Their wingspan can reach 23 feet. They visit specific reef cleaning stations where small fish eat parasites off them — and they patiently wait in line.'},

    # ── MAMMALS ──────────────────────────────────────────────────
    {'topic': 'elephant-memory', 'query': 'elephant african wildlife',
     'slides': ['ELEPHANTS MOURN\nTHEIR DEAD AND\nVISIT GRAVES\nYEARS LATER',
                'THEY GENTLY\nTOUCH THE BONES\nWITH THEIR TRUNKS\nIN SILENCE',
                'THEY CAN DETECT\nEACH OTHER FROM\nMILES AWAY\nTHROUGH VIBRATIONS\nIN THE GROUND',
                'THEY REMEMBER\nEVERY LOSS AND\nEVERY FRIEND\nFOR THEIR ENTIRE\nLIFE'],
     'body': 'Elephants hold funerals. They mourn their dead, gently touching the bones with their trunks, and revisit the remains years later. They\'re the largest land animal that can\'t jump. Their trunk alone has 40,000 muscles — your entire body has 639. They can detect seismic vibrations through their feet from miles away.'},

    {'topic': 'sloth', 'query': 'sloth hanging tree',
     'slides': ['SLOTHS TAKE\n2 WEEKS TO\nDIGEST A\nSINGLE MEAL',
                'THEY ONLY POOP\nONCE A WEEK AND\nLOSE 1/3 OF THEIR\nBODY WEIGHT',
                'THEY MOVE SO\nLITTLE THAT ALGAE\nGROWS ON THEIR\nFUR',
                'THE ALGAE TURNS\nTHEM GREEN —\nACCIDENTAL\nCAMOUFLAGE FROM\nDOING NOTHING'],
     'body': 'Sloths take up to 2 weeks to fully digest a single meal — the slowest digestion of any mammal. They can hold their breath for 40 minutes underwater, outperforming dolphins. They only poop once a week and lose about a third of their body weight each time. Algae grows in their fur, turning them green for natural camouflage.'},

    {'topic': 'otter-hands', 'query': 'sea otter floating water',
     'slides': ['SEA OTTERS HOLD\nHANDS WHILE THEY\nSLEEP SO THEY\nDON\'T DRIFT APART',
                'THEY HAVE A\nFAVORITE ROCK THEY\nKEEP IN A POUCH',
                'THEIR FUR HAS\n1 MILLION HAIRS\nPER SQUARE INCH',
                'THEY WRAP IN\nKELP LIKE A\nBLANKET TO\nSTAY ANCHORED'],
     'body': 'Sea otters hold hands while sleeping so they don\'t drift apart — groups floating together are called rafts. Each otter has a favorite rock they carry in a skin pouch under their arm for cracking shells. Their fur is the densest of any mammal — about 1 million hairs per square inch. They also wrap themselves in kelp like a blanket to stay anchored.'},

    {'topic': 'bat-echo', 'query': 'bat flying night',
     'slides': ['BATS ARE THE\nONLY MAMMALS\nTHAT CAN\nTRULY FLY',
                'THEIR ECHOLOCATION\nIS SO PRECISE IT\nCAN DETECT A\nHUMAN HAIR IN\nTOTAL DARKNESS',
                'A SINGLE BAT\nEATS HUNDREDS OF\nINSECTS EVERY\nHOUR USING THAT\nSONAR',
                'WITHOUT THEM\nWE WOULD LOSE\nBANANAS MANGOES\nAND TEQUILA'],
     'body': 'Bats are the only mammals capable of true powered flight. A single bat can eat hundreds of insects in one hour. Their echolocation is so precise they can detect an object as thin as a human hair in complete darkness. Without bats pollinating plants, we\'d lose bananas, mangoes, and agave — meaning no tequila.'},

    {'topic': 'cow-friendship', 'query': 'cows field green pasture',
     'slides': ['COWS HAVE\nBEST FRIENDS AND\nGET STRESSED WHEN\nTHEY\'RE SEPARATED',
                'THEIR HEART RATE\nSPIKES AND\nCORTISOL FLOODS\nTHEIR BODY',
                'BUT THE MOMENT\nTHEY\'RE REUNITED\nTHEIR HEART RATE\nDROPS INSTANTLY',
                'THEY EVEN PRODUCE\nMORE MILK WHEN\nLISTENING TO\nCALM MUSIC —\nFEELINGS MATTER'],
     'body': 'Cows form deep friendships and get measurably stressed when separated from their best friend — their heart rate increases and cortisol spikes. When reunited, their heart rate drops immediately. They can smell things from 6 miles away and produce more milk when listening to slow, calm music.'},

    {'topic': 'pig-smart', 'query': 'pig piglet farm cute',
     'slides': ['PIGS ARE AMONG\nTHE SMARTEST\nDOMESTICATED\nANIMALS ON EARTH',
                'THEY OUTPERFORM\nDOGS ON MOST\nCOGNITIVE TESTS',
                'THEY CAN PLAY\nVIDEO GAMES\nWITH JOYSTICKS\nUSING THEIR SNOUTS',
                'THEY DREAM DURING\nREM SLEEP AND\nREMEMBER THINGS\nFOR YEARS'],
     'body': 'Pigs are among the most intelligent domesticated animals — they outperform dogs on many cognitive tests. They\'ve been taught to play video games using joysticks with their snouts. They dream during REM sleep just like us and have excellent long-term memory, remembering things for years.'},

    {'topic': 'cheetah-speed', 'query': 'cheetah running fast',
     'slides': ['CHEETAHS GO FROM\n0 TO 60 MPH\nIN 3 SECONDS',
                'THAT\'S AS FAST AS\nA SPORTS CAR',
                'THEY CAN ONLY\nSPRINT FOR 60\nSECONDS BEFORE\nOVERHEATING',
                'THEY CAN\'T ROAR\nTHEY CHIRP LIKE\nBIRDS'],
     'body': 'Cheetahs accelerate from 0 to 60 mph in just 3 seconds — as fast as a sports car. But they can only maintain top speed for about 60 seconds before their body temperature hits dangerous levels. And they can\'t roar like other big cats — they chirp and purr like oversized house cats.'},

    {'topic': 'wolf-loyalty', 'query': 'wolf pack snow wilderness',
     'slides': ['A WOLF PACK\nIS NOT A\nHIERARCHY —\nIT\'S A FAMILY',
                'TWO PARENTS AND\nTHEIR OFFSPRING\nHUNTING TOGETHER',
                'THEY STAY WITH\nONE PARTNER\nFOR LIFE',
                'WHEN ONE DIES\nTHE PACK HOWLS\nFOR DAYS —\nMOURNING THEM'],
     'body': 'A wolf pack isn\'t a hierarchy of alphas and betas — it\'s literally a family. Two parents and their offspring hunting together. Wolves are generally monogamous and stay with one partner for life. When a pack member dies, the rest howl repeatedly for days — a mourning behavior documented by researchers.'},

    {'topic': 'koala', 'query': 'koala tree eucalyptus',
     'slides': ['KOALAS SLEEP\n22 HOURS A DAY\nBECAUSE EUCALYPTUS\nHAS ALMOST ZERO\nNUTRITION',
                'THEIR BRAIN HAS\nACTUALLY SHRUNK\nOVER TIME — THEIR\nDIET CAN\'T FUEL\nA BIGGER ONE',
                'BABY KOALAS EAT\nTHEIR MOTHER\'S\nPOOP JUST TO\nBUILD THE GUT\nBACTERIA NEEDED\nTO DIGEST IT',
                'ALL THAT STRUGGLE\nFOR A LEAF THAT\nISN\'T EVEN\nWORTH EATING'],
     'body': 'Koalas sleep up to 22 hours a day because eucalyptus leaves are so low in nutrition they need to conserve every calorie. Their fingerprints are virtually identical to human fingerprints — even under a microscope. Baby koalas eat a special form of their mother\'s feces called pap to develop the gut bacteria needed to digest eucalyptus.'},

    {'topic': 'giraffe', 'query': 'giraffe african savanna',
     'slides': ['BABY GIRAFFES\nFALL 6 FEET\nWHEN THEY\'RE\nBORN',
                'THEY STAND UP\nWITHIN 30 MINUTES\nAND START WALKING\nWITHIN HOURS',
                'THEY ONLY NEED\n30 MINUTES OF\nSLEEP PER DAY —\nTHE LEAST OF\nANY MAMMAL',
                'FROM DAY ONE\nTHEY\'RE BUILT\nTO SURVIVE IN\nA WORLD THAT\nWON\'T WAIT'],
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
                'BUT EVEN ASLEEP\nTHEY CAN ROTATE\nEACH EAR 180\nDEGREES USING\n32 MUSCLES',
                'THEY\'RE ALWAYS\nLISTENING — ALWAYS\nPROCESSING —\nEVEN IN A NAP',
                'YOUR CAT ISN\'T\nLAZY — IT\'S\nCONSERVING ENERGY\nFOR THE MOMENT\nIT MATTERS'],
     'body': 'The average house cat sleeps 13-16 hours a day — about 70% of their life. They can rotate each ear 180 degrees independently using 32 muscles per ear. Cats are one of the only mammals that can\'t taste sweetness — they lack the taste receptor entirely. And a group of cats is officially called a clowder.'},

    {'topic': 'dog-nose', 'query': 'dog nose close up portrait',
     'slides': ['A DOG\'S NOSE IS\n100,000 TIMES\nMORE SENSITIVE\nTHAN YOURS',
                'EACH NOSTRIL\nSMELLS\nINDEPENDENTLY —\nGIVING THEM\nDIRECTIONAL SCENT',
                'THAT PRECISION\nLETS THEM DETECT\nCANCER COVID-19\nAND LOW BLOOD\nSUGAR',
                'EVERY DOG\'S NOSE\nPRINT IS UNIQUE —\nLIKE A FINGERPRINT\nFOR AN\nINCREDIBLE ORGAN'],
     'body': 'Every dog\'s nose print is unique — just like a human fingerprint. Dogs can detect certain cancers, low blood sugar, and even COVID-19 through smell alone. Each nostril smells independently, giving them directional scent tracking. Their nose is at least 100,000 times more sensitive than a human\'s.'},

    # ── REPTILES ─────────────────────────────────────────────────
    {'topic': 'crocodile', 'query': 'crocodile water close up',
     'slides': ['CROCODILES HAVEN\'T\nCHANGED IN 200\nMILLION YEARS',
                'THEY WERE ALREADY\nHERE WHEN\nDINOSAURS WALKED\nTHE EARTH',
                'THEN THE ASTEROID\nHIT AND KILLED\nEVERYTHING —\nEXCEPT THEM',
                'TWO HUNDRED\nMILLION YEARS AND\nEVOLUTION STILL\nCAN\'T IMPROVE\nTHE DESIGN'],
     'body': 'Crocodiles have barely changed in 200 million years — they were already perfect. They survived the asteroid that wiped out the dinosaurs. They can\'t stick out their tongue because it\'s attached to the roof of their mouth. And they intentionally swallow rocks to add weight for deeper dives.'},

    {'topic': 'chameleon', 'query': 'chameleon colorful lizard',
     'slides': ['CHAMELEONS DON\'T\nCHANGE COLOR FOR\nCAMOUFLAGE —\nIT\'S FOR MOOD',
                'THEIR EYES MOVE\nINDEPENDENTLY\nSEEING 360\nDEGREES AT ONCE',
                'THEIR TONGUE\nIS TWICE THEIR\nBODY LENGTH',
                'IT SHOOTS OUT\nFASTER THAN A\nJET FIGHTER\nTAKES OFF'],
     'body': 'Chameleons don\'t change color for camouflage — it\'s primarily for communication and mood. Angry? Dark. Relaxed? Light. Their eyes move independently, giving them near 360-degree vision. Their tongue is twice their body length and launches at prey faster than a fighter jet accelerates.'},

    {'topic': 'gecko', 'query': 'gecko lizard close up',
     'slides': ['GECKOS WALK ON\nCEILINGS USING\nMILLIONS OF TINY\nHAIR-LIKE FIBERS',
                'THOSE FIBERS\nCREATE MOLECULAR\nATTRACTION —\nNOT SUCTION\nNOT GLUE',
                'GRAB THEIR TAIL\nAND IT SNAPS OFF\n— THEN GROWS\nBACK',
                'THEY HAVE NO\nEYELIDS SO THEY\nLICK THEIR OWN\nEYEBALLS CLEAN'],
     'body': 'Geckos walk on ceilings using millions of microscopic hair-like structures on their feet that create molecular attraction — not suction or glue. They have no eyelids, so they lick their own eyeballs to keep them clean. When a predator grabs their tail, they detach it and grow a new one.'},

    {'topic': 'komodo', 'query': 'komodo dragon lizard',
     'slides': ['KOMODO DRAGONS\nCAN SMELL PREY\nFROM 6 MILES\nAWAY',
                'ONCE THEY BITE\nTHEIR VENOM\nPREVENTS BLOOD\nFROM CLOTTING',
                'THE PREY BLEEDS\nOUT SLOWLY WHILE\nTHE KOMODO\nJUST FOLLOWS',
                'THEN IT EATS\n80% OF ITS OWN\nBODY WEIGHT\nIN A SINGLE MEAL'],
     'body': 'Komodo dragons have venom glands that release toxins preventing blood from clotting — prey slowly bleeds out. They can eat 80% of their body weight in a single meal, then not eat for weeks. They detect carrion from up to 6 miles away. Females can reproduce without a male through parthenogenesis.'},

    {'topic': 'turtle-butt', 'query': 'turtle pond water',
     'slides': ['SOME TURTLES CAN\nBREATHE THROUGH\nTHEIR BUTT',
                'IT\'S CALLED\nCLOACAL\nRESPIRATION AND\nIT KEEPS THEM\nALIVE UNDERWATER',
                'THEIR SHELL ISN\'T\nJUST ARMOR —\nIT\'S 60 BONES\nFUSED TO THEIR\nSPINE',
                'AND IT HAS\nNERVE ENDINGS —\nTHEY FEEL EVERY\nSINGLE TOUCH'],
     'body': 'Some turtle species can absorb oxygen through their rear end — it\'s called cloacal respiration, and it helps them survive long periods underwater. Their shell isn\'t just armor — it\'s made of about 60 bones fused to their spine and rib cage. And it has nerve endings, so yes, they feel everything.'},

    {'topic': 'snake-jaw', 'query': 'snake close up head',
     'slides': ['SNAKES DON\'T\nDISLOCATE THEIR\nJAW TO EAT —\nIT\'S TWO PIECES',
                'THEIR LOWER JAW\nIS SPLIT IN HALF\nAND EACH SIDE\nMOVES ON ITS OWN',
                'THIS LETS THEM\nSWALLOW PREY\nWIDER THAN THEIR\nOWN HEAD',
                'AND SOME SPECIES\nONLY NEED TO DO\nIT ONCE EVERY\nTWO YEARS'],
     'body': 'Snakes don\'t actually dislocate their jaw — their lower jawbone is two separate pieces connected by an elastic ligament, each moving independently. They flick their tongue to collect chemical particles from the air, which they analyze with a special organ on the roof of their mouth. Some species can survive up to 2 years without a meal.'},

    # ── BIRDS ────────────────────────────────────────────────────
    {'topic': 'crow-grudge', 'query': 'crow black bird intelligent',
     'slides': ['CROWS CAN\nRECOGNIZE HUMAN\nFACES AND HOLD\nGRUDGES FOR YEARS',
                'THEY TEACH THEIR\nBABIES WHICH\nHUMANS TO AVOID',
                'THEY USE TOOLS\nAND SOLVE\nMULTI-STEP\nPUZZLES',
                'THEY HAVE BEEN\nSEEN LEAVING GIFTS\nFOR HUMANS WHO\nFEED THEM'],
     'body': 'Crows recognize individual human faces and hold grudges for years. If you wrong a crow, it will warn its family — and the next generation will avoid you too, even if they\'ve never met you. They use tools, solve multi-step puzzles, and have been documented leaving gifts like shiny objects for humans who feed them.'},

    {'topic': 'owl-neck', 'query': 'owl portrait close up',
     'slides': ['OWLS CAN\'T MOVE\nTHEIR EYEBALLS —\nTHEY\'RE FIXED\nIN THE SKULL',
                'SO THEY EVOLVED\nTO ROTATE THEIR\nENTIRE HEAD\n270 DEGREES',
                'SPECIAL BLOOD\nPOOLING KEEPS\nTHEIR BRAIN ALIVE\nDURING THE TWIST',
                'AND THEIR FLIGHT\nIS COMPLETELY\nSILENT — PREY\nNEVER HEARS\nTHEM COMING'],
     'body': 'Owls can rotate their heads 270 degrees because they can\'t move their eyeballs — they\'re tube-shaped and fixed in the skull. They have special blood pooling systems to maintain brain blood flow during rotation. Their feathers are designed for silent flight, making them virtually undetectable to prey. A group is called a parliament.'},

    {'topic': 'hummingbird', 'query': 'hummingbird flower hovering',
     'slides': ['HUMMINGBIRDS WEIGH\nLESS THAN A\nNICKEL',
                'BUT THEIR HEART\nBEATS UP TO\n1,200 TIMES\nPER MINUTE',
                'THEY VISIT UP TO\n2,000 FLOWERS\nEVERY SINGLE DAY\nJUST TO SURVIVE',
                'THEY\'RE THE ONLY\nBIRDS THAT CAN\nFLY BACKWARDS —\nTINY BUT\nUNSTOPPABLE'],
     'body': 'Hummingbirds are the only birds that can fly backwards, upside down, and hover in place like a helicopter. Their heart beats up to 1,200 times per minute, and they visit up to 2,000 flowers daily. Most weigh less than a nickel. At night, they enter a hibernation-like state called torpor to survive without eating.'},

    {'topic': 'penguin-love', 'query': 'penguin pair couple',
     'slides': ['PENGUINS PROPOSE\nWITH A PEBBLE',
                'A MALE SEARCHES\nTHE ENTIRE BEACH\nFOR THE PERFECT\nONE',
                'HE PRESENTS IT\nTO HER — IF SHE\nACCEPTS THEY\nSTAY TOGETHER',
                'THEY RECOGNIZE\nTHEIR PARTNER\'S\nVOICE AMONG\nTHOUSANDS'],
     'body': 'When a male penguin finds a partner, he searches the entire beach for the smoothest, most perfect pebble and presents it to the female. If she accepts, they bond for the breeding season. Penguins can recognize their partner\'s unique call among thousands of birds in a crowded colony.'},

    {'topic': 'parrot-age', 'query': 'parrot colorful tropical bird',
     'slides': ['PARROT PARENTS\nGIVE EACH BABY\nA UNIQUE CALL —\nESSENTIALLY\nA NAME',
                'THE CHICK USES\nTHAT NAME FOR\nLIFE AND THE\nFLOCK CALLS\nTHEM BY IT',
                'AN AFRICAN GREY\nNAMED ALEX COULD\nIDENTIFY 100+\nOBJECTS AND\nUNDERSTOOD ZERO',
                'SOME PARROTS\nLIVE OVER 80\nYEARS — A\nLIFETIME OF\nCONVERSATION'],
     'body': 'Some parrot species live over 80 years, often outliving their owners. African Grey parrots understand abstract concepts like zero and can identify over 100 objects by name. Parrot parents give each chick a unique call — essentially a name — that the chick uses for life. Other flock members use this name to address them.'},

    {'topic': 'flamingo', 'query': 'flamingo pink water',
     'slides': ['FLAMINGOS ARE\nBORN GREY-WHITE\nNOT PINK',
                'THEY TURN PINK\nFROM PIGMENTS IN\nTHE SHRIMP AND\nALGAE THEY EAT',
                'THEY FILTER-FEED\nWITH THEIR HEAD\nUPSIDE DOWN —\nTHE ONLY BIRD\nTHAT EATS THIS WAY',
                'AND THAT ICONIC\nONE-LEG STANCE?\nIT USES ZERO\nMUSCLE EFFORT —\nJUST A LOCKED\nJOINT'],
     'body': 'Flamingos are born gray-white and gradually turn pink from the carotenoid pigments in shrimp and algae they eat. They filter-feed with their head upside down. Standing on one leg is actually their resting position — it requires zero muscular effort thanks to a locking mechanism in their joints. A group is officially called a flamboyance.'},

    {'topic': 'eagle-vision', 'query': 'bald eagle flying',
     'slides': ['EAGLES HAVE THE\nSHARPEST VISION\nOF ANY ANIMAL\nON EARTH',
                'EIGHT TIMES\nSHARPER THAN\nA HUMAN WITH\nPERFECT SIGHT',
                'THEY CAN SPOT\nA RABBIT FROM\nOVER 2 MILES\nAWAY',
                'THEY ALSO SEE\nULTRAVIOLET LIGHT\nA HIDDEN WORLD\nWE CAN\'T EVEN\nIMAGINE'],
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
                'A HUMAN GETS A\nCONCUSSION AT\n100 G\'S — THEY\nHIT OVER 500 G\'S',
                'THEIR BRAIN IS\nTINY AND TIGHTLY\nPACKED SO IT\nBARLY MOVES'],
     'body': 'Woodpeckers peck up to 20 times per second, enduring forces over 500 G\'s per impact. A human gets a concussion at 100 G\'s. Their small, tightly packed brain barely moves inside the skull, keeping stress below injury levels. Their tongue is so long it wraps around the entire skull and anchors near the nostril.'},

    # ── AMPHIBIANS ───────────────────────────────────────────────
    {'topic': 'frog-water', 'query': 'frog green colorful',
     'slides': ['FROGS DON\'T\nDRINK WATER —\nTHEY ABSORB IT\nTHROUGH THEIR SKIN',
                'THAT SAME SKIN\nCAN FREEZE SOLID\nIN WINTER — HEART\nSTOPS BLOOD\nFREEZES',
                'THEN SPRING COMES\nAND THEY THAW OUT\nAND HOP AWAY\nLIKE NOTHING\nHAPPENED',
                'A CREATURE THAT\nCAN DIE AND COME\nBACK TO LIFE\nIS CALLED A FROG'],
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
     'slides': ['GIANT SALAMANDERS\nCAN GROW UP TO\n6 FEET LONG —\nTHE LARGEST\nAMPHIBIAN ON EARTH',
                'THEY HAVE NO\nLUNGS AND BREATHE\nENTIRELY THROUGH\nTHEIR SKIN',
                'SOME SPECIES\nLIVE OVER 100\nYEARS BREATHING\nWITHOUT LUNGS',
                'THEY\'VE BARELY\nCHANGED IN 170\nMILLION YEARS —\nTHEY WALKED\nALONGSIDE\nDINOSAURS'],
     'body': 'The Chinese giant salamander can grow up to 6 feet long — the largest amphibian on Earth. Many salamander species have no lungs and breathe entirely through their moist skin. Some species can live up to 100 years. They\'ve barely changed in 170 million years — they were already walking the Earth alongside early dinosaurs.'},

    # ── WEIRD / QUIRKY ───────────────────────────────────────────
    {'topic': 'wombat-poop', 'query': 'wombat cute australian',
     'slides': ['WOMBATS POOP\nIN PERFECT CUBES',
                'THEY STACK THEM\nON ROCKS AND\nLOGS TO MARK\nTERRITORY',
                'SCIENTISTS DIDN\'T\nFIGURE OUT HOW\nUNTIL 2021',
                'THEIR INTESTINES\nHAVE VARYING\nELASTICITY THAT\nSHAPES IT'],
     'body': 'Wombat poop comes out in perfect cubes. They stack the cubes on rocks, logs, and elevated surfaces to mark territory — cube shape prevents them from rolling away. Scientists spent years trying to figure out how they do it, finally discovering in 2021 that varying elasticity in different parts of their intestines shapes the feces into cubes.'},

    {'topic': 'shrimp-heart', 'query': 'shrimp underwater marine',
     'slides': ['PISTOL SHRIMP\nCAN SNAP THEIR\nCLAW SO FAST IT\nCREATES A SONIC\nBOOM',
                'THE SNAP REACHES\n218 DECIBELS —\nLOUDER THAN A\nGUNSHOT',
                'THE BUBBLE IT\nCREATES BRIEFLY\nREACHES THE\nTEMPERATURE\nOF THE SUN',
                'ALL FROM A\nCREATURE WHOSE\nHEART IS LOCATED\nIN ITS HEAD'],
     'body': 'A shrimp\'s heart is located in its head. The pistol shrimp can snap its claw so fast it creates a cavitation bubble that produces a sonic boom reaching 218 decibels — louder than a gunshot. For a fraction of a second, that bubble reaches nearly the temperature of the sun\'s surface.'},

    {'topic': 'horned-lizard', 'query': 'horned lizard desert',
     'slides': ['HORNED LIZARDS\nCAN SHOOT BLOOD\nFROM THEIR EYES',
                'THE BLOOD STREAM\nCAN REACH UP TO\n5 FEET',
                'IT TASTES\nTERRIBLE TO\nPREDATORS',
                'THEY AIM\nDIRECTLY AT THE\nPREDATOR\'S MOUTH'],
     'body': 'When threatened, horned lizards shoot a stream of blood from their eyes that can reach up to 5 feet. The blood contains a chemical that tastes absolutely foul to canine and feline predators. They deliberately aim at the predator\'s mouth. It\'s one of the most bizarre defense mechanisms in the animal kingdom.'},

    {'topic': 'tardigrade', 'query': 'tardigrade microscope micro',
     'slides': ['TARDIGRADES CAN\nSURVIVE IN SPACE\nWITH NO SUIT',
                'THEY SURVIVE\nTEMPERATURES FROM\n-458\u00b0F TO 300\u00b0F',
                'THEY CAN GO\n30 YEARS WITHOUT\nFOOD OR WATER',
                'THEY HAVE\nSURVIVED ALL FIVE\nMASS EXTINCTIONS'],
     'body': 'Tardigrades (water bears) are the most indestructible creatures on Earth. They\'ve survived the vacuum of space, radiation 1,000 times the lethal human dose, temperatures from near absolute zero to 300\u00b0F, and pressures 6 times greater than the deepest ocean. They can go 30 years without food or water and have survived all five mass extinctions.'},

    {'topic': 'narwhal', 'query': 'narwhal arctic whale tusk',
     'slides': ['A NARWHAL\'S TUSK\nIS ACTUALLY A\nGIANT TOOTH\nGROWING THROUGH\nITS LIP',
                'IT HAS 10 MILLION\nNERVE ENDINGS\nAND CAN SENSE\nWATER CHANGES',
                'THEY CAN DIVE\nTO 5,000 FEET\nDEEP',
                'MEDIEVAL EUROPEANS\nTHOUGHT THEIR\nTUSKS WERE\nUNICORN HORNS'],
     'body': 'A narwhal\'s tusk is actually a canine tooth that grows through its upper lip in a spiral, reaching up to 10 feet long. It contains 10 million nerve endings and acts as a sensory organ, detecting changes in water temperature, salinity, and pressure. In medieval Europe, narwhal tusks sold for more than gold — people believed they were unicorn horns.'},

    {'topic': 'pangolin', 'query': 'pangolin scales wildlife',
     'slides': ['PANGOLINS ROLL\nINTO A BALL\nSO TIGHT THAT\nLIONS CAN\'T\nOPEN THEM',
                'THEIR SCALES ARE\nMADE OF KERATIN —\nTHE SAME PROTEIN\nAS YOUR\nFINGERNAILS',
                'THAT ARMOR\nPROTECTS THEM FROM\nEVERY PREDATOR\nIN NATURE',
                'EXCEPT ONE —\nTHEY\'RE THE MOST\nTRAFFICKED ANIMAL\nON EARTH BECAUSE\nOF HUMANS'],
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
     'slides': ['ALBATROSSES CAN\nFLY 10,000 MILES\nWITHOUT FLAPPING\nTHEIR WINGS ONCE',
                'THEY LOCK THEIR\nWINGSPAN AND GLIDE\nON OCEAN WIND\nFOR DAYS',
                'THEY EVEN SLEEP\nWHILE FLYING —\nHALF THEIR BRAIN\nRESTS AT A TIME',
                'ONE KNOWN\nALBATROSS IS STILL\nRAISING CHICKS\nAT AGE 73'],
     'body': 'Albatrosses can fly 10,000 miles without flapping their wings once — they lock their wingspan and glide on ocean wind currents. They sleep while flying, with half their brain resting at a time. They drink seawater and filter the salt through a special gland, sneezing it out. Some live past 70 — there\'s a known albatross still raising chicks at age 73.'},

    {'topic': 'bombardier-beetle', 'query': 'beetle insect macro colorful',
     'slides': ['THE BOMBARDIER\nBEETLE SPRAYS\nBOILING CHEMICAL\nFROM ITS REAR END',
                'THE SPRAY REACHES\n212\u00b0F — THE\nBOILING POINT\nOF WATER',
                'IT CAN AIM\nIN ANY DIRECTION\nWITH PRECISION',
                'THE CHEMICAL\nREACTION HAPPENS\n500 TIMES PER\nSECOND'],
     'body': 'When threatened, the bombardier beetle sprays a boiling chemical mixture from its abdomen at 212\u00b0F — literally the boiling point of water. It can aim the spray in any direction with pinpoint accuracy. The chemical reaction happens in rapid pulses, about 500 per second, creating a machine-gun-like spray that deters almost any predator.'},

    {'topic': 'cuttlefish', 'query': 'cuttlefish underwater colorful',
     'slides': ['CUTTLEFISH HAVE\nTHREE HEARTS\nAND GREEN BLOOD',
                'THEY HAVE THE\nLARGEST BRAIN-TO-\nBODY RATIO OF\nANY INVERTEBRATE',
                'THEY CAN CREATE\nMOVING COLOR\nPATTERNS ON\nTHEIR SKIN',
                'MALES DISGUISE AS\nFEMALES TO SNEAK\nPAST RIVAL MALES'],
     'body': 'Cuttlefish have three hearts, green blood, and the largest brain-to-body ratio of any invertebrate. Their skin contains millions of chromatophores that create moving, animated color patterns — like a living TV screen. Male cuttlefish have been observed disguising half their body as female to sneak past rival males and mate undetected.'},

    {'topic': 'capybara', 'query': 'capybara water relaxing',
     'slides': ['CAPYBARAS ARE\nBASICALLY A 140-\nPOUND GUINEA PIG',
                'AND FOR SOME\nREASON EVERY\nANIMAL ON EARTH\nLOVES THEM',
                'BIRDS MONKEYS\nRABBITS AND EVEN\nCROCODILES SIT\nON OR NEXT TO\nTHEM PEACEFULLY',
                'THEY MIGHT BE\nTHE MOST\nUNIVERSALLY LIKED\nCREATURE ALIVE'],
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
                'THEY HAVE 16\nTYPES OF COLOR\nRECEPTORS —\nHUMANS HAVE 3',
                'THEY CAN BREAK\nAQUARIUM GLASS\nWITH ONE HIT'],
     'body': 'The mantis shrimp punches with the force of a .22 caliber bullet — so fast it creates cavitation bubbles that briefly reach the temperature of the sun. They can shatter aquarium glass with a single strike. Their eyes have 16 types of photoreceptors (humans have 3), more than any known animal. Pound for pound, the most powerful creature on Earth.'},

    {'topic': 'snow-leopard', 'query': 'snow leopard mountain',
     'slides': ['SNOW LEOPARDS\nCAN\'T ROAR — THEY\nPURR AND CHUFF\nLIKE OVERSIZED\nHOUSE CATS',
                'THEY WRAP THEIR\nMASSIVE TAIL\nAROUND THEIR FACE\nLIKE A BLANKET\nTO SLEEP IN\nFREEZING COLD',
                'BUT THEY CAN\nLEAP 50 FEET IN\nA SINGLE BOUND',
                'WITH ONLY A FEW\nTHOUSAND LEFT\nTHEY\'RE ONE OF THE\nMOST ELUSIVE CATS\nON EARTH'],
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
     'slides': ['HIPPOS LOOK\nSLOW AND GENTLE\nBUT THEY KILL\nMORE HUMANS IN\nAFRICA THAN ANY\nOTHER LARGE ANIMAL',
                'THEY CAN\'T\nACTUALLY SWIM —\nTHEY RUN ALONG\nTHE RIVER BOTTOM',
                'THEIR JAW OPENS\nNEARLY 150\nDEGREES WITH\nENOUGH FORCE TO\nSNAP A CANOE',
                'THAT CUTE FACE\nIS THE MOST\nTERRITORIAL AND\nAGGRESSIVE\nANIMAL IN AFRICA'],
     'body': 'Hippos are responsible for more human deaths in Africa than any other large animal — they\'re extremely territorial and surprisingly fast. They secrete a red, oily substance nicknamed blood sweat that acts as natural sunscreen and antibiotic. They can\'t actually swim — they run along the river bottom. Their jaw opens nearly 150 degrees.'},

    {'topic': 'bioluminescence', 'query': 'bioluminescent ocean glow',
     'slides': ['90% OF DEEP SEA\nCREATURES PRODUCE\nTHEIR OWN LIGHT',
                'BUT YOU DON\'T\nHAVE TO GO DEEP —\nSOME BAYS GLOW\nBRIGHT BLUE WHEN\nYOU SWIM IN THEM',
                'THE LIGHT COMES\nFROM BILLIONS OF\nTINY ORGANISMS\nTHAT FLASH WHEN\nDISTURBED',
                'ONLY A HANDFUL\nOF BAYS ON EARTH\nDO THIS YEAR-\nROUND — AND YOU\nCAN SWIM IN THEM'],
     'body': 'In the deep ocean, 90% of creatures produce their own light. On the surface, bioluminescent bays glow electric blue when disturbed — every wave, splash, or swimming stroke lights up. Only a handful of bays around the world glow like this year-round. The light comes from billions of dinoflagellates, single-celled organisms that flash when agitated.'},
]

# ═══════════════════════════════════════════════════════════════════
# IMAGE GENERATION — photo background + bold headline (1080x1920)
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

def get_photo(query):
    """Fetch a single portrait photo from Pexels."""
    r = requests.get('https://api.pexels.com/v1/search',
        headers={'Authorization': PX},
        params={'query': query, 'orientation': 'portrait', 'per_page': 15}, timeout=15)
    pics = r.json().get('photos', [])
    if not pics:
        # Fallback: broaden the search
        r2 = requests.get('https://api.pexels.com/v1/search',
            headers={'Authorization': PX},
            params={'query': query.split()[0] + ' nature animal', 'orientation': 'portrait', 'per_page': 15}, timeout=15)
        pics = r2.json().get('photos', [])
    if not pics:
        return None
    pick = random.choice(pics[:8])
    url = pick['src']['large2x']
    print(f'  Got photo: {url[:80]}')
    img = Image.open(BytesIO(requests.get(url, timeout=30).content)).convert('RGBA')
    return img

def fitimg(img):
    """Crop and resize to 1080x1920 story dimensions."""
    pw, ph = img.size
    r = W / H
    if pw/ph > r:
        nw = int(ph * r); l = (pw - nw) // 2
        img = img.crop((l, 0, l + nw, ph))
    else:
        nh = int(pw / r); t = (ph - nh) // 4
        img = img.crop((0, t, pw, t + nh))
    return img.resize((W, H), Image.LANCZOS)

def draw_slide(photo, headline):
    """Draw a single story slide: photo background + dark gradient + PETOSHEALTHYB brand + headline."""
    img = fitimg(photo.copy())

    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(ov)

    # Gradient from center down
    grad_start = int(H * 0.45)
    for y in range(grad_start, H):
        p = (y - grad_start) / (H - grad_start)
        a = min(int((p ** 0.7) * 250), 250)
        d_ov.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)

    MARGIN = 48

    # "P E T O S H E A L T H" — small tracked-out brand label (teal)
    f_label = ft(16)
    label = 'P E T O S H E A L T H'
    lbb = f_label.getbbox(label)
    lw = lbb[2] - lbb[0]

    # Headline — massive, bold, white, centered lower third
    f_head = ft(76)
    lines = headline.split('\n')
    line_h = 84
    total_text_h = len(lines) * line_h
    text_bottom = H - 180  # more room from bottom for story UI
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

    # Small teal accent line below headline
    d.line([(W // 2 - 50, y + 8), (W // 2 + 50, y + 8)], fill=TEAL, width=3)

    out_path = Path(__file__).parent / 'petosb_story_slide.png'
    img.convert('RGB').save(out_path, quality=95)
    print(f'  Story slide: {out_path.stat().st_size} bytes')
    return out_path

# ═══════════════════════════════════════════════════════════════════
# IMAGE UPLOAD — catbox.moe with uguu.se fallback (from post_story.py)
# ═══════════════════════════════════════════════════════════════════

def upload_image(filepath):
    """Upload to a public host. Tries catbox first, then uguu.se."""
    hosts = [
        ('catbox', lambda f: requests.post('https://catbox.moe/user/api.php',
            data={'reqtype': 'fileupload'}, files={'fileToUpload': f}, timeout=90)),
        ('uguu.se', lambda f: requests.post('https://uguu.se/upload',
            files={'files[]': f}, timeout=90)),
    ]
    for host_name, upload_fn in hosts:
        for attempt in range(3):
            try:
                with open(filepath, 'rb') as f:
                    r = upload_fn(f)
                if host_name == 'uguu.se':
                    data = r.json()
                    if data.get('success') and data.get('files'):
                        url = data['files'][0]['url']
                    else:
                        print(f'  [{host_name}] Attempt {attempt+1}: {r.text[:80]}')
                        continue
                else:
                    url = r.text.strip()
                if r.status_code == 200 and url.startswith('https://'):
                    check = requests.head(url, timeout=15, allow_redirects=True)
                    if 'image' in check.headers.get('Content-Type', ''):
                        print(f'  [{host_name}] {url}')
                        return url
                    print(f'  [{host_name}] Attempt {attempt+1}: bad content-type')
                else:
                    print(f'  [{host_name}] Attempt {attempt+1}: {r.status_code} {r.text[:80]}')
            except Exception as e:
                print(f'  [{host_name}] Attempt {attempt+1}: {e}')
            time.sleep(5)
        print(f'  [{host_name}] All attempts failed, trying next...')
    return None

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    PREVIEW = '--preview' in sys.argv

    print('=== PETOSHEALTHYB — FUN FACT STORIES ===')
    log = load_log()
    recent = recently_posted(log)
    print(f'Recently posted ({REPOST_DAYS}d): {len(recent)} topics')

    # Pick a fresh fact (30-day dedup, oldest-first fallback)
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

    # Use the FIRST slide headline only for Stories
    headline = fact['slides'][0]
    print(f'Headline: {headline}')

    # Build caption
    caption = build_caption(fact['body'])
    print(f'\nCaption:\n{caption}\n')

    # Fetch photo from Pexels
    print('=== FETCHING PHOTO ===')
    photo = get_photo(fact['query'])
    if not photo:
        print('No photo available')
        sys.exit(1)

    # Generate story slide (1080x1920)
    print('\n=== GENERATING STORY SLIDE ===')
    slide_path = draw_slide(photo, headline)
    print(f'  Slide file size: {slide_path.stat().st_size} bytes')

    if PREVIEW:
        print('\nPREVIEW MODE — not posting.')
        print(f'Fact: {fact["topic"]}')
        print(f'Slide: {slide_path}')
        sys.exit(0)

    # Upload to catbox
    print('\n=== UPLOADING ===')
    url = upload_image(slide_path)
    if not url:
        print('Upload failed')
        sys.exit(1)
    print(f'  Uploaded: {url}')

    # Post as IG Story
    print('\n=== POSTING STORY ===')
    IG = f'https://graph.facebook.com/v25.0/{ACCT}'

    # Create story container
    r = requests.post(f'{IG}/media', data={
        'image_url': url,
        'media_type': 'STORIES',
        'access_token': TOKEN,
    }, timeout=30)
    print(f'  Container: {r.text[:120]}')
    r.raise_for_status()
    container_id = r.json()['id']

    time.sleep(10)

    # Publish
    pub = requests.post(f'{IG}/media_publish', data={
        'creation_id': container_id,
        'access_token': TOKEN,
    }, timeout=30)
    print(f'  Publish: {pub.text[:120]}')
    pub.raise_for_status()
    ig_id = pub.json()['id']
    print(f'\nSTORY POSTED! ID: {ig_id}')

    # Log and done
    save_log(log, fact['topic'], ig_id)
    print('DONE.')
