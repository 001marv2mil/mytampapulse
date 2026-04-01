export interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  image: string;
  isPremium?: boolean;
}

export interface DigestItem {
  id: string;
  text: string;
}

export interface HiddenGem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
}

export interface LiveMusic {
  id: string;
  artist: string;
  venue: string;
  date: string;
  image: string;
}

export interface NewsletterIssue {
  id: string;
  number: number;
  date: string;
  title: string;
  image: string;
  eventCount: number;
}

export interface Category {
  name: string;
  icon: string;
  description: string;
  count: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CommunityResponse {
  id: string;
  name: string;
  text: string;
  date: string;
}

export interface CommunityPost {
  id: string;
  type: "poll" | "question" | "announcement" | "community_event";
  title: string;
  content: string;
  date: string;
  author: string;
  pollOptions?: PollOption[];
  responses?: CommunityResponse[];
  interestedCount?: number;
  eventDate?: string;
  eventLocation?: string;
  image?: string;
  pinned?: boolean;
}

export interface Headline {
  id: string;
  category: string;
  text: string;
}

export const headlines: Headline[] = [
  { id: "h1", category: "NOW", text: "Sugar Sand Festival is open in Clearwater through April 12. $16 admission, free for kids 5 and under." },
  { id: "h2", category: "TRAFFIC", text: "Bayshore Blvd lane closures this weekend for utility work. Use Gandy or Kennedy as alternates." },
  { id: "h3", category: "NEW OPENING", text: "The Landon just opened at 717 S Howard. Chef Robert Hesse from Hell's Kitchen is running the show." },
  { id: "h4", category: "THIS WEEKEND", text: "Cuban Sandwich Festival Sunday at Centennial Park. Free admission. They're going for a 370-foot world record." },
  { id: "h5", category: "REAL ESTATE", text: "Central Park St. Pete food hall opening soon downtown. Five stories, nine dining concepts, four bars." },
  { id: "h6", category: "HEADS UP", text: "Gasparilla Music Fest tickets are moving. Mt. Joy, Shakey Graves, Jai Wolf. April 10-12 at Meridian Fields." },
  { id: "h7", category: "FYI", text: "Tropicana Field renovations on schedule. Rays home opener set for April 6 vs Cubs." },
  { id: "h8", category: "TRENDING", text: "Trailer Daddy on Central Ave in St. Pete is the most talked about new bar this month. Flamingo glasses." },
];

export const communityPosts: CommunityPost[] = [
  {
    id: "cp1",
    type: "announcement",
    title: "We hit 1,000 subscribers",
    content: "Tampa. We did it. 1,000 of you are now getting the Pulse every Thursday. When I started this thing it was just me sending emails to like 40 friends. Now it's a real thing. Thank you for reading, sharing, and actually going out and doing the stuff we write about. That's the whole point. Here's to the next 1,000.",
    date: "Mar 25, 2026",
    author: "Tampa Pulse Team",
    pinned: true,
  },
  {
    id: "cp2",
    type: "poll",
    title: "Best rooftop bar in Tampa?",
    content: "Settle this once and for all. Which rooftop bar in Tampa is actually worth going to? Not the one with the best Instagram. The one you'd actually take your friends to on a Saturday night.",
    date: "Mar 24, 2026",
    author: "Tampa Pulse Team",
    pollOptions: [
      { id: "p1", text: "Edge Rooftop at Epicurean", votes: 127 },
      { id: "p2", text: "Fly Bar", votes: 89 },
      { id: "p3", text: "M.Bird at Armature Works", votes: 203 },
      { id: "p4", text: "Sky Bar at Club Prana", votes: 54 },
    ],
  },
  {
    id: "cp3",
    type: "question",
    title: "What neighborhood deserves more coverage?",
    content: "I feel like we cover Ybor and SoHo a lot (because there's a lot happening there). But Tampa is way bigger than two neighborhoods. What area do you want to see more of in the Pulse?",
    date: "Mar 22, 2026",
    author: "Tampa Pulse Team",
    responses: [
      { id: "r1", name: "Jessica M.", text: "Seminole Heights. There's so much happening on Florida Ave that never gets talked about.", date: "Mar 22" },
      { id: "r2", name: "David R.", text: "West Tampa. Willa's put it on the map but there's way more over there.", date: "Mar 22" },
      { id: "r3", name: "Kayla T.", text: "Dunedin! I know it's technically not Tampa but the brewery scene there is insane.", date: "Mar 23" },
      { id: "r4", name: "Marcus L.", text: "Temple Terrace is sleeping on itself. Kunafa King alone deserves a whole feature.", date: "Mar 23" },
    ],
  },
  {
    id: "cp4",
    type: "community_event",
    title: "Tampa Pulse Meetup at Sparkman Wharf",
    content: "First ever Tampa Pulse reader meetup. No agenda. No speeches. Just show up, grab food from one of the trucks, and meet the people who read this thing. I'll be there. Drinks on me for the first 10 people who show up.",
    date: "Mar 20, 2026",
    author: "Tampa Pulse Team",
    eventDate: "April 12, 2026 at 6 PM",
    eventLocation: "Sparkman Wharf, 615 Channelside Dr",
    interestedCount: 84,
  },
  {
    id: "cp5",
    type: "poll",
    title: "Overrated or underrated: Ybor City?",
    content: "I keep hearing both sides. Some people say Ybor is the heart of Tampa nightlife. Others say it peaked 5 years ago. Where do you stand?",
    date: "Mar 18, 2026",
    author: "Tampa Pulse Team",
    pollOptions: [
      { id: "p5", text: "Underrated. Ybor is still the move.", votes: 312 },
      { id: "p6", text: "Overrated. It's not what it used to be.", votes: 145 },
      { id: "p7", text: "Depends on the night.", votes: 267 },
    ],
  },
  {
    id: "cp6",
    type: "announcement",
    title: "Pulse+ is coming",
    content: "We've been working on something. Pulse+ is a paid tier that gives you early access to the newsletter, VIP perks at partner venues across Tampa, exclusive invite-only events, and a members-only group chat. It's not ready yet but it's close. If you want to be first in line, join the waitlist on the Pulse+ page.",
    date: "Mar 15, 2026",
    author: "Tampa Pulse Team",
  },
  {
    id: "cp7",
    type: "question",
    title: "Best hidden gem you've found from the Pulse?",
    content: "I write about hidden gems every week but I want to hear from you. What spot did you discover because of Tampa Pulse that you now go back to regularly?",
    date: "Mar 12, 2026",
    author: "Tampa Pulse Team",
    responses: [
      { id: "r5", name: "Chris B.", text: "Madame Fortune in Ybor. Went once and now it's my go-to date spot. Nobody knows about it.", date: "Mar 12" },
      { id: "r6", name: "Alina V.", text: "The Thai Temple Sunday Market. Changed my Sundays forever.", date: "Mar 13" },
      { id: "r7", name: "Tony S.", text: "Deviant Libation. $5 Sunday shows. Unreal.", date: "Mar 13" },
    ],
  },
  {
    id: "cp8",
    type: "community_event",
    title: "Pulse Readers at Gasparilla Music Fest",
    content: "Gasparilla Music Fest is April 10-12. Mt. Joy, Shakey Graves, Jai Wolf, Drive-By Truckers. A bunch of us are going Saturday. If you want to meet up, drop a comment. We might do a Pulse+ exclusive pre-party if we get enough interest.",
    date: "Mar 10, 2026",
    author: "Tampa Pulse Team",
    eventDate: "April 11, 2026",
    eventLocation: "Meridian Fields, Tampa",
    interestedCount: 126,
  },
];

// Sample data
export const categories: Category[] = [
  { name: "Events", icon: "01", description: "Curated events worth leaving the house for", count: 16 },
  { name: "Nightlife", icon: "02", description: "Rooftop bars, speakeasies, and the best after-dark spots", count: 8 },
  { name: "Food Spots", icon: "03", description: "The restaurants, trucks, and hidden kitchens locals swear by", count: 12 },
  { name: "Hidden Gems", icon: "04", description: "Secret spots and lowkey-fire finds only insiders know", count: 6 },
];

export const weekAtAGlance = [
  "Pride of Tampa kicks off its inaugural celebration in Ybor. Free festival Saturday",
  "International Cuban Sandwich Festival goes for a 370-foot world record Sunday",
  "The Landon just opened in SoHo. Fine dining from a Hell's Kitchen chef",
  "Sugar Sand Festival opens in Clearwater. 24,000 sq ft of sand sculptures",
  "Katt Williams brings The Golden Age Tour to town Friday night",
  "Tampa Food Truck Central quietly opened on E. Broadway with Colombian-Venezuelan fusion",
  "Mainsail Art Festival takes over Vinoy Park with 250+ artists this weekend",
];

export const digest: DigestItem[] = [
  { id: "d1", text: "🔥 Pride of Tampa launches its inaugural celebration. Free festival Saturday at the Cuban Club with hourly drag shows noon to 5 PM" },
  { id: "d2", text: "🥪 Cuban Sandwich Festival returns Sunday to Centennial Park. 370-foot world record attempt, free admission, live salsa" },
  { id: "d3", text: "🎨 Mainsail Art Festival brings 250+ juried artists to Vinoy Park this weekend. 51 years running, free admission" },
  { id: "d4", text: "🍽️ Oro is opening at Rome Collective. Spanish restaurant doing wood-fired paella and tapas" },
  { id: "d5", text: "🎵 Into the Woods at American Stage. Outdoor Sondheim at Demens Landing, runs through April 26" },
  { id: "d6", text: "🌮 SoDough Square in St. Pete. New Detroit-style pizza on 4th St N, not a lot of people know yet" },
  { id: "d7", text: "🎪 Asian Pacific Islander Cultural Festival at Curtis Hixon Saturday. Free admission, live performances" },
];

export const events: Event[] = [
  {
    id: "e1",
    title: "Pride of Tampa Festival",
    category: "Events",
    date: "28.03",
    time: "11:00 AM",
    location: "Cuban Club, Ybor City",
    description: "Inaugural celebration. Hourly drag shows, live music, comedy. Free.",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    isPremium: true,
  },
  {
    id: "e2",
    title: "Cuban Sandwich Festival",
    category: "Food Spots",
    date: "29.03",
    time: "12:00 PM",
    location: "Centennial Park, Ybor",
    description: "370-foot world record attempt. Live salsa. Free admission.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
    isPremium: true,
  },
  {
    id: "e3",
    title: "Sugar Sand Festival",
    category: "Events",
    date: "27.03",
    time: "10:00 AM",
    location: "Clearwater Beach",
    description: "24,000 sq ft of sand sculptures. Concerts. Fireworks. Through April 12.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  },
  {
    id: "e4",
    title: "Katt Williams: Golden Age Tour",
    category: "Nightlife",
    date: "27.03",
    time: "8:00 PM",
    location: "Benchmark International Arena",
    description: "The Golden Age Tour hits Tampa. Enough said.",
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
  },
  {
    id: "e5",
    title: "Mainsail Art Festival",
    category: "Events",
    date: "28.03",
    time: "9:00 AM",
    location: "Vinoy Park, St. Pete",
    description: "250+ juried artists. 51st year. $60K in prizes. Free admission.",
    image: "https://images.unsplash.com/photo-1543372953-6bcc0b0c5d1f?w=800&q=80",
  },
  {
    id: "e6",
    title: "ZooBrews",
    category: "Nightlife",
    date: "28.03",
    time: "7:30 PM",
    location: "Zoo Tampa at Lowry Park",
    description: "Adults-only. Unlimited drinks, food, live music. $84-$159.",
    image: "https://images.unsplash.com/photo-1470093851219-69951fcbb533?w=800&q=80",
  },
];

export const liveMusic: LiveMusic[] = [
  { id: "m1", artist: "The Beach Boys", venue: "Hard Rock Tampa", date: "Thu", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80" },
  { id: "m2", artist: "Warren G", venue: "Busch Gardens", date: "Fri", image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80" },
  { id: "m3", artist: "Gimme Gimme Disco", venue: "The Orpheum", date: "Sat", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80" },
  { id: "m4", artist: "Gladys Knight", venue: "Hard Rock Tampa", date: "Wed", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80" },
  { id: "m5", artist: "Hell's Kitchen Musical", venue: "Straz Center", date: "Fri-Sun", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80" },
];

export const hiddenGems: HiddenGem[] = [
  {
    id: "g1",
    name: "Trailer Daddy",
    tagline: "Trailer-park cocktail bar",
    description: "New on Central Ave in St. Pete. Sounds ridiculous. The drinks are actually really well done.",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  },
  {
    id: "g2",
    name: "Tampa Food Truck Central",
    tagline: "New food truck park",
    description: "Five vendors on E. Broadway. Colombian-Venezuelan fusion from Sancocho y Lena is the standout.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  },
  {
    id: "g3",
    name: "Secondhand Market",
    tagline: "St. Pete Youth Farm thrift",
    description: "Saturday mornings, 9 AM to noon. Thrift finds at a literal youth farm. Tell everyone later.",
    image: "https://images.unsplash.com/photo-1602607360790-93a67a3e4e2b?w=800&q=80",
  },
  {
    id: "g4",
    name: "Smith's Provisions",
    tagline: "Old-school burger stand",
    description: "New at Sparkman Wharf. Roadside burger concept right on the water. Simple menu, big flavors.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  },
];

export const archiveIssues: NewsletterIssue[] = [
  // #13: Cuban Sandwich Festival + Sugar Sand Festival
  { id: "i0", number: 13, date: "Mar 27, 2026", title: "World Record Cubans & Sand Castles", image: "https://www.cubansandwichfestival.com/uploads/1/3/9/7/13978720/487836106-1217464973286287-5979796674992837620-n_orig.jpg", eventCount: 14 },
  // #12: NCAA March Madness at Benchmark Arena + DroneArt
  { id: "i1", number: 12, date: "Mar 20, 2026", title: "March Madness Comes to Tampa", image: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Amalie_Arena_2015.jpg", eventCount: 11 },
  // #11: St. Patrick's Day, River O' Green, Reggae Rise Up
  { id: "i2", number: 11, date: "Mar 13, 2026", title: "St. Patrick's Week Takeover", image: "https://images.unsplash.com/photo-1521024221340-efe7d7e05e34?w=800&q=80", eventCount: 13 },
  // #10: Strawberry Festival + Spring Training baseball
  { id: "i3", number: 10, date: "Mar 6, 2026", title: "Strawberry Fields & Spring Training", image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80", eventCount: 12 },
  // #9: Barry Manilow farewell, Gasparilla Arts, IndyCar Grand Prix
  { id: "i4", number: 9, date: "Feb 27, 2026", title: "Barry's Last Bow & Art on the River", image: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800&q=80", eventCount: 10 },
  // #8: Cigar City Tattoo Fest, Gasparilla Distance Classic, Fiesta Day
  { id: "i5", number: 8, date: "Feb 20, 2026", title: "Ink, Runs & Spring Training", image: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&q=80", eventCount: 12 },
  // #7: Valentine's Day, Knight Parade in Ybor, Lunar Lantern Fest
  { id: "i6", number: 7, date: "Feb 13, 2026", title: "Valentine's in Ybor", image: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=800&q=80", eventCount: 9 },
  // #6: Super Bowl LX watch parties, Florida State Fair, MOSI
  { id: "i7", number: 6, date: "Feb 6, 2026", title: "Super Bowl Snacks & State Fair Vibes", image: "https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=800&q=80", eventCount: 11 },
  // #5: Coldest Gasparilla, Kings of Leon, pirates in the cold
  { id: "i8", number: 5, date: "Jan 30, 2026", title: "The Coldest Gasparilla Ever", image: "https://images.unsplash.com/photo-1545672999-6a0e0e430c93?w=800&q=80", eventCount: 13 },
  // #4: Children's Gasparilla, Bookends Fantasy Fair, pre-Gasparilla buzz
  { id: "i9", number: 4, date: "Jan 23, 2026", title: "Gasparilla Season Begins", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80", eventCount: 10 },
  // #3: MLK Week, Bull Bash, cold snap, Village People at Busch Gardens
  { id: "i10", number: 3, date: "Jan 16, 2026", title: "Bundle Up, Tampa", image: "https://images.unsplash.com/photo-1566232392379-afd9298e6a46?w=800&q=80", eventCount: 8 },
  // #2: Winter Jam, cold snap 82 to 37, Renee Fleming at Straz
  { id: "i11", number: 2, date: "Jan 9, 2026", title: "Cold Snap & Hot Takes", image: "https://assets.simpleviewinc.com/simpleview/image/upload/crm/visitflorida/50244_jj0vwsfycztf2x28aej8k65wjmjwe96v_9650e327-5056-a36a-0bb6d4c5c36dcaa2.jpg", eventCount: 9 },
  // #1: New Year, Ringling Bros, Crowbar final year, Winter Village
  { id: "i12", number: 1, date: "Jan 2, 2026", title: "New Year, New Moves", image: "https://images.unsplash.com/photo-1546271876-af6caec5fae5?w=800&q=80", eventCount: 7 },
];
