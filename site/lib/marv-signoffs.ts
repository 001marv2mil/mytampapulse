// Unique Marv sign-offs — one per issue, rotating after exhausted.
// Each should sound like a different mood: fired up, reflective, dry, hype, chill, etc.
// Never formal. Always sounds like a group chat message.

export const marvSignoffs: string[] = [
  // 1
  `New year. Same Tampa, but we're paying closer attention this time.\n\nGo do something this week that you'd actually tell someone about.\n\n— Marv`,

  // 2
  `Tampa went from 82 degrees to 37 in four days. This city does not care about your plans.\n\nStay warm. See you Thursday.\n\n— Marv`,

  // 3
  `Bundle up. Tampa cold is still Tampa — it'll be 75 again before you know it.\n\nDon't waste the weird weather. Go find something.\n\n— Marv`,

  // 4
  `Gasparilla season is basically Tampa's Super Bowl. Treat it accordingly.\n\nSee you on the other side.\n\n— Marv`,

  // 5
  `The coldest Gasparilla on record. Pirates in puffer jackets. Only in Tampa.\n\nI love this city.\n\n— Marv`,

  // 6
  `Super Bowl week. State Fair. Tampa doing the most as always.\n\nEat something at the fair that you'll regret. That's the point.\n\n— Marv`,

  // 7
  `Valentine's Day in Ybor hits different. Go find out why.\n\nTake someone. Or go alone. Both are valid.\n\n— Marv`,

  // 8
  `Tattoos, 5Ks, and spring training in the same weekend. This city has range.\n\nPick one. Do it. Tell me how it went.\n\n— Marv`,

  // 9
  `Barry Manilow's last tour. Gasparilla Arts. IndyCar on the streets.\n\nThis was a big one. Hope you made it out.\n\n— Marv`,

  // 10
  `Strawberry season and spring training. Tampa Bay in its best form.\n\nGo outside. It's too nice to be inside right now.\n\n— Marv`,

  // 11
  `St. Patrick's week in Tampa is genuinely unhinged. I mean that as a compliment.\n\nSee you next Thursday. Drink water.\n\n— Marv`,

  // 12
  `March Madness hits different when it's in your city. Tampa keeps showing up.\n\nDon't sleep on this weekend.\n\n— Marv`,

  // 13
  `World record Cuban sandwich attempts and sand sculptures the size of your apartment.\n\nThis is Tampa. I will never get tired of this.\n\n— Marv`,

  // 14+ (rotating extras for future issues)
  `I write this every week hoping you actually go do something. Based on the DMs I get, you are. Keep it up.\n\n— Marv`,

  `Tampa's got something going on every single weekend and most of you are still on the couch. This is an intervention.\n\n— Marv`,

  `If you found one new spot this week because of the Pulse, that's the whole point. We're good.\n\nSee you Thursday.\n\n— Marv`,

  `Every week I think "there's no way Tampa has more going on than last week" and every week Tampa proves me wrong.\n\n— Marv`,

  `Hot take: Tampa is one of the most underrated cities in the country and we're the only ones who know it. Let's keep it that way.\n\n— Marv`,

  `Somewhere in Tampa right now there's a hidden gem nobody's written about yet. I'm going to find it.\n\nBack Thursday.\n\n— Marv`,

  `The best part of doing this is the replies. Keep sending them. I read every one.\n\n— Marv`,
];

export function getMarvSignoff(issueNumber: number): string {
  // Issues 1-13 get their specific sign-off. After that, rotate through the extras.
  if (issueNumber <= 13) {
    return marvSignoffs[issueNumber - 1];
  }
  const extras = marvSignoffs.slice(13);
  return extras[(issueNumber - 14) % extras.length];
}
