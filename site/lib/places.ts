// Real Tampa Bay spots organized by category and neighborhood
// Used to populate programmatic SEO pages with real content

export interface Place {
  name: string;
  description: string;
  vibe: string;
  neighborhood: string;
  category: string;
  tag?: string;
}

export const PLACES: Place[] = [
  // FOOD - Ybor City
  { name: "Columbia Restaurant", description: "Florida's oldest restaurant. Flamenco shows on the weekend, 1905 Salad prepared tableside. Go once, go dressed.", vibe: "Iconic", neighborhood: "ybor-city", category: "food", tag: "Iconic" },
  { name: "Carmine's Restaurant & Bar", description: "Italian-American in the heart of Ybor. The chicken parm is a serious commitment.", vibe: "Classic", neighborhood: "ybor-city", category: "food" },
  { name: "La Teresita", description: "Cuban diner open nearly 24/7. Counter seating, cheap, real. The café con leche alone is worth the drive.", vibe: "Local Institution", neighborhood: "ybor-city", category: "food", tag: "Hidden Gem" },
  { name: "Teco Lounge", description: "Bar food that punches way above its weight. Go for the wings, stay for the dive bar energy.", vibe: "Lowkey", neighborhood: "ybor-city", category: "food" },

  // FOOD - Hyde Park
  { name: "Bern's Steak House", description: "One of the greatest steakhouses in America. Aged beef, a wine cellar with 500,000+ bottles, and a dessert room upstairs that's its own experience.", vibe: "Legendary", neighborhood: "hyde-park", category: "food", tag: "Must Go" },
  { name: "The Epicurean Hotel (Élevage)", description: "Modern American in a foodie hotel. The breakfast is underrated, the happy hour on the edge patio is perfect.", vibe: "Upscale", neighborhood: "hyde-park", category: "food" },
  { name: "Datz", description: "Over-the-top comfort food done right. The milkshakes are basically meals. Popular for a reason.", vibe: "Fun", neighborhood: "hyde-park", category: "food" },
  { name: "Oxford Exchange", description: "Bookshop + restaurant + coffee bar in a restored building. The brunch is the move. Come early.", vibe: "Aesthetic", neighborhood: "hyde-park", category: "food", tag: "Local Fave" },

  // FOOD - Seminole Heights
  { name: "Rooster & the Till", description: "The best restaurant in Seminole Heights, maybe all of Tampa. Small plates, rotating menu, serious craft.", vibe: "Chef's Table", neighborhood: "seminole-heights", category: "food", tag: "Top Pick" },
  { name: "Angry Chair Brewing", description: "Craft brewery with a surprisingly solid food program. The loaded fries with their stout is the pairing you didn't know you needed.", vibe: "Brewery", neighborhood: "seminole-heights", category: "food" },
  { name: "Ella's Americana Folk Art Cafe", description: "Quirky, art-filled diner with massive portions. The mimosa pitchers on weekends are dangerously good.", vibe: "Eclectic", neighborhood: "seminole-heights", category: "food" },
  { name: "Ichicoro Ramen", description: "Real ramen, not the college dorm kind. Rich broths, proper noodles, worth the wait.", vibe: "Cozy", neighborhood: "seminole-heights", category: "food", tag: "Hidden Gem" },

  // FOOD - Downtown Tampa
  { name: "Mise en Place", description: "Tampa's fine dining institution. Chef Marty Blitz has been doing it right since 1986. Pre-theater menu is a great deal.", vibe: "Fine Dining", neighborhood: "downtown-tampa", category: "food", tag: "Iconic" },
  { name: "Armature Works (Heights Public Market)", description: "15+ vendors under one roof. Grab something from each. The wood-fired pizza and the ramen are the standouts.", vibe: "Market Hall", neighborhood: "downtown-tampa", category: "food" },
  { name: "The Refinery", description: "Local, seasonal, unpretentious. Menu changes constantly based on what's good that week. That's the whole point.", vibe: "Farm-to-Table", neighborhood: "downtown-tampa", category: "food" },

  // FOOD - South Tampa
  { name: "Willa's Neighborhood Eatery", description: "Neighborhood restaurant done perfectly. The spaghetti with clams is quietly one of the best dishes in Tampa.", vibe: "Neighborhood", neighborhood: "south-tampa", category: "food", tag: "Top Pick" },
  { name: "Rocca", description: "Northern Italian from one of Tampa's best chefs. Handmade pasta, wood-fired dishes, proper wine list.", vibe: "Upscale Italian", neighborhood: "south-tampa", category: "food" },
  { name: "Green Lemon", description: "Mexican street food done fresh. The tacos al pastor are the real deal.", vibe: "Casual", neighborhood: "south-tampa", category: "food" },

  // FOOD - Channelside
  { name: "Cena Ristorante", description: "Italian overlooking the water. The outdoor seating on a cool night is hard to beat.", vibe: "Waterfront", neighborhood: "channelside", category: "food" },
  { name: "Splitsville Luxury Lanes", description: "Bowling alley + serious sushi. Sounds weird, works completely.", vibe: "Fun", neighborhood: "channelside", category: "food" },

  // FOOD - Tampa Heights
  { name: "Steelbach", description: "The anchor of Armature Works. Steakhouse quality in a stunning historic building on the river.", vibe: "Upscale", neighborhood: "tampa-heights", category: "food", tag: "Must Try" },
  { name: "Ulele", description: "Native Florida ingredients, waterfront patio, and a craft beer list made in-house. Uniquely Tampa.", vibe: "Florida-Native", neighborhood: "tampa-heights", category: "food", tag: "Unique" },

  // NIGHTLIFE - Ybor City
  { name: "The Bricks", description: "Rooftop bar in the heart of Ybor with a full view of 7th Ave. Go after 9 PM on Friday.", vibe: "Rooftop", neighborhood: "ybor-city", category: "nightlife", tag: "Rooftop" },
  { name: "The Czar Bar", description: "Basement bar under Columbia. Live music, dark, intimate. One of the coolest rooms in Tampa.", vibe: "Underground", neighborhood: "ybor-city", category: "nightlife", tag: "Hidden Gem" },
  { name: "New World Brewery", description: "Outdoor patio, live music 5+ nights a week, cheap drinks. The unofficial headquarters of Seminole Heights/Ybor culture.", vibe: "Outdoor/Live Music", neighborhood: "ybor-city", category: "nightlife" },
  { name: "Coyote Ugly", description: "Yes, that one. It's actually a Tampa institution at this point. Friday nights go off.", vibe: "Party", neighborhood: "ybor-city", category: "nightlife" },
  { name: "Gaspar's Grotto", description: "Tampa's pirate bar. The signature rum drinks are dangerously good. Peak Ybor.", vibe: "Pirate Bar", neighborhood: "ybor-city", category: "nightlife", tag: "Only in Tampa" },

  // NIGHTLIFE - Hyde Park
  { name: "Fly Bar & Restaurant", description: "Rooftop with city views and a solid cocktail menu. The signature cocktails are worth the price.", vibe: "Rooftop", neighborhood: "hyde-park", category: "nightlife", tag: "Rooftop" },
  { name: "The Ritz Ybor (SoHo)", description: "Multi-level nightclub with different vibes on each floor. Tampa's biggest night out venue.", vibe: "Club", neighborhood: "hyde-park", category: "nightlife" },
  { name: "MacDinton's Irish Pub", description: "SoHo's reliable late-night Irish pub. Live music most nights, good craic.", vibe: "Irish Pub", neighborhood: "hyde-park", category: "nightlife" },

  // NIGHTLIFE - Seminole Heights
  { name: "Deviant Libation", description: "$5 shows on Sunday nights. Underground music, local acts, a genuinely cool room.", vibe: "Underground Music", neighborhood: "seminole-heights", category: "nightlife", tag: "Hidden Gem" },
  { name: "Baer's Acoustic Bar", description: "Truly a neighborhood bar. No attitude, good beer, live acoustic music most nights.", vibe: "Neighborhood Bar", neighborhood: "seminole-heights", category: "nightlife" },

  // NIGHTLIFE - Downtown Tampa
  { name: "M.Bird at Armature Works", description: "Rooftop bar on the Hillsborough River. The best view in Tampa, full stop.", vibe: "Rooftop", neighborhood: "downtown-tampa", category: "nightlife", tag: "Best View" },
  { name: "The Hub", description: "Tampa's oldest dive bar. Cash only, cheap drinks, no frills, no BS.", vibe: "Dive Bar", neighborhood: "downtown-tampa", category: "nightlife", tag: "Local Institution" },

  // EVENTS - Various
  { name: "Gasparilla Pirate Festival", description: "Tampa's biggest annual event. Pirates invade the city every January. Parade, floats, beads. You have to go at least once.", vibe: "Festival", neighborhood: "downtown-tampa", category: "events", tag: "Must Experience" },
  { name: "Gasparilla Music Festival", description: "Three-day music festival at Meridian Fields. National and local acts, great lineup every year.", vibe: "Music Festival", neighborhood: "downtown-tampa", category: "events" },
  { name: "Tampa Riverwalk Events", description: "Free outdoor events at Curtis Hixon Park throughout the year. Movies, markets, concerts.", vibe: "Outdoor", neighborhood: "downtown-tampa", category: "events" },
  { name: "Florida State Fair", description: "Annual February tradition at the fairgrounds. Fried everything, rides, livestock shows. A Tampa rite of passage.", vibe: "Fair", neighborhood: "tampa-heights", category: "events" },
  { name: "Ybor City Saturday Market", description: "Every Saturday morning on Centennial Park. Local vendors, food, vintage finds. Free.", vibe: "Market", neighborhood: "ybor-city", category: "events", tag: "Weekly" },

  // OUTDOORS - Various
  { name: "Bayshore Boulevard", description: "The longest continuous sidewalk in the US. 4.5 miles along Tampa Bay. Morning runs, evening walks, sunset views.", vibe: "Waterfront", neighborhood: "south-tampa", category: "outdoors", tag: "Iconic" },
  { name: "Lettuce Lake Regional Park", description: "Boardwalk over a cypress swamp, gators included. Kayak rentals on weekends. Genuinely wild and 20 minutes from downtown.", vibe: "Nature", neighborhood: "carrollwood", category: "outdoors", tag: "Hidden Gem" },
  { name: "Tampa Riverwalk", description: "2.6-mile waterfront path from Channelside to Armature Works. Parks, art, restaurants, and water taxis along the way.", vibe: "Urban Walk", neighborhood: "downtown-tampa", category: "outdoors" },
  { name: "Hillsborough River State Park", description: "Kayaking, camping, and swimming in the river. The rapids section is the only one in South Florida.", vibe: "State Park", neighborhood: "tampa-heights", category: "outdoors" },
  { name: "Philippe Park", description: "Safety Harbor waterfront park with a Native American mound and massive oak trees. One of Tampa Bay's best hidden parks.", vibe: "Historic Park", neighborhood: "channelside", category: "outdoors", tag: "Hidden Gem" },

  // ARTS - Various
  { name: "Tampa Museum of Art", description: "On the Riverwalk with rotating exhibitions and a stunning permanent collection. Friday nights are free after 5.", vibe: "Museum", neighborhood: "downtown-tampa", category: "arts", tag: "Free Fridays" },
  { name: "The Straz Center", description: "Tampa's performing arts venue. Broadway tours, the Florida Orchestra, and one-night special events.", vibe: "Performing Arts", neighborhood: "downtown-tampa", category: "arts" },
  { name: "American Stage", description: "Tampa Bay's oldest professional theater company. Outdoor performances at Demens Landing in St. Pete are the move.", vibe: "Theater", neighborhood: "channelside", category: "arts" },
  { name: "MOSI (Museum of Science & Industry)", description: "Tampa's science museum with an IMAX dome. Better than it sounds. The butterfly garden is genuinely great.", vibe: "Museum", neighborhood: "new-tampa", category: "arts" },

  // SPORTS
  { name: "Raymond James Stadium (Buccaneers)", description: "Home of the Super Bowl champion Tampa Bay Buccaneers. Tailgate culture is real here.", vibe: "NFL", neighborhood: "westshore", category: "sports", tag: "NFL" },
  { name: "Amalie Arena (Lightning)", description: "One of the best arenas in the NHL. The Lightning are always competitive. Electric atmosphere.", vibe: "NHL", neighborhood: "channelside", category: "sports", tag: "NHL" },
  { name: "George M. Steinbrenner Field (Yankees Spring Training)", description: "Watch the Yankees warm up for the season every March. Cheap tickets, great views, authentic baseball.", vibe: "Spring Training", neighborhood: "westshore", category: "sports", tag: "Spring Training" },

  // WELLNESS
  { name: "Sacred Lands Yoga", description: "Seminole Heights' yoga studio with a cult following. Drop-in classes, a real community.", vibe: "Yoga", neighborhood: "seminole-heights", category: "wellness" },
  { name: "Tampa Farmers Market (Curtis Hixon)", description: "Saturday mornings. Local produce, prepared food, plants. Worth getting up early.", vibe: "Farmers Market", neighborhood: "downtown-tampa", category: "wellness", tag: "Weekly" },
  { name: "Alafia River State Park", description: "Mountain biking, hiking, and river access in Riverview. One of the best trail systems in the county.", vibe: "Active", neighborhood: "riverview", category: "wellness" },

  // COFFEE
  { name: "Felicitous Coffee & Tea House", description: "Ybor's best coffee spot. Single-origin pour-overs in a century-old building.", vibe: "Specialty Coffee", neighborhood: "ybor-city", category: "food", tag: "Coffee" },
  { name: "Buddy Brew Coffee", description: "Tampa's homegrown specialty roaster. Multiple locations, the Heights location is the best.", vibe: "Local Roaster", neighborhood: "tampa-heights", category: "food", tag: "Coffee" },
  { name: "Mazzaro's Italian Market", description: "Not just coffee — Italian deli, wine, cheese, and espresso from St. Pete. A full experience.", vibe: "Italian Market", neighborhood: "channelside", category: "food", tag: "Unique" },
];

export function getPlacesByNeighborhoodAndCategory(neighborhood: string, category: string): Place[] {
  const direct = PLACES.filter(p => p.neighborhood === neighborhood && p.category === category);
  if (direct.length >= 3) return direct;
  // Fall back to category-wide picks if neighborhood has fewer than 3
  const categoryWide = PLACES.filter(p => p.category === category && !direct.find(d => d.name === p.name));
  return [...direct, ...categoryWide].slice(0, 6);
}

export function getPlacesByCategory(category: string): Place[] {
  return PLACES.filter(p => p.category === category);
}
