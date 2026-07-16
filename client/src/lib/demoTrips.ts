/**
 * Demo data for the trip-grouped video story frames on /videos.
 *
 * Placeholder until real videos land in Firestore. The intended production
 * mapping: videos tagged `trip:<tripId>` are grouped into a frame, and
 * comments come from the /api/tiktok/comments proxy per video. Swap
 * `videos[].embedUrl` in when the real video pages are provided.
 */

export type TripVideo = {
  id: string;
  title: string;
  caption: string;
  /** CSS gradient stops for the placeholder cover */
  cover: [string, string];
  emoji: string;
  embedUrl?: string;
};

export type TripComment = {
  id: string;
  videoId: string;
  author: string;
  text: string;
  likes: number;
};

export type Trip = {
  id: string;
  city: string;
  tagline: string;
  dates: string;
  /** Accent color used for highlights, progress bars, pins */
  accent: string;
  /** Frame background gradient */
  bg: [string, string, string];
  stamp: string;
  videos: TripVideo[];
  comments: TripComment[];
};

export const DEMO_TRIPS: Trip[] = [
  {
    id: "nyc",
    city: "New York City",
    tagline: "five boroughs, one carry-on",
    dates: "spring in the city",
    accent: "#FFC745",
    bg: ["#0b1026", "#1a1f3d", "#2b1e4f"],
    stamp: "JFK ✈ NYC",
    videos: [
      {
        id: "nyc-1",
        title: "GRWM: rooftop night in SoHo",
        caption: "the outfit had to match the skyline",
        cover: ["#2b1e4f", "#4a3a8c"],
        emoji: "🌃",
      },
      {
        id: "nyc-2",
        title: "what $40 gets you in Chinatown",
        caption: "dumpling crawl, zero regrets",
        cover: ["#1a1f3d", "#6b2d5c"],
        emoji: "🥟",
      },
      {
        id: "nyc-3",
        title: "vintage haul on the Lower East Side",
        caption: "three shops, one perfect leather jacket",
        cover: ["#0b1026", "#3d2b6b"],
        emoji: "🧥",
      },
    ],
    comments: [
      { id: "c1", videoId: "nyc-1", author: "@citylightsmaya", text: "the way the skyline hits at 0:14 ... unreal 😭", likes: 214 },
      { id: "c2", videoId: "nyc-1", author: "@brooklynbabe", text: "ok but WHERE is that top from, asking for me", likes: 156 },
      { id: "c3", videoId: "nyc-2", author: "@dumplingdiary", text: "you missed Mei Lai Wah!! next trip pls 🙏", likes: 342 },
      { id: "c4", videoId: "nyc-2", author: "@feedmenyc", text: "$40?! I spend that on one brunch, taking notes", likes: 98 },
      { id: "c5", videoId: "nyc-3", author: "@thriftqueen", text: "that leather jacket find is CRIMINAL. so good", likes: 421 },
      { id: "c6", videoId: "nyc-3", author: "@lesvintage", text: "come back, we just got a new denim rack in 👀", likes: 87 },
      { id: "c7", videoId: "nyc-1", author: "@sophfanpage", text: "the confidence walking out of that elevator!!", likes: 190 },
      { id: "c8", videoId: "nyc-2", author: "@noodleworld", text: "the soup dumpling slow-mo deserves an award", likes: 265 },
      { id: "c9", videoId: "nyc-3", author: "@stylistkat", text: "styling it three ways next video? pretty please", likes: 133 },
    ],
  },
  {
    id: "san-diego",
    city: "San Diego",
    tagline: "salt air & golden hour",
    dates: "endless summer",
    accent: "#FF8A5C",
    bg: ["#12303f", "#1f4a52", "#7a3b4f"],
    stamp: "SAN ✈ SD",
    videos: [
      {
        id: "sd-1",
        title: "sunrise surf check at Pacific Beach",
        caption: "6am never looked this good",
        cover: ["#1f4a52", "#e07a5f"],
        emoji: "🏄‍♀️",
      },
      {
        id: "sd-2",
        title: "beach-to-dinner outfit switch",
        caption: "one bag, two completely different looks",
        cover: ["#7a3b4f", "#f2a65a"],
        emoji: "👗",
      },
      {
        id: "sd-3",
        title: "taco crawl through Old Town",
        caption: "ranking every al pastor I could find",
        cover: ["#12303f", "#c65f4e"],
        emoji: "🌮",
      },
    ],
    comments: [
      { id: "c10", videoId: "sd-1", author: "@wavesandwaffles", text: "PB at sunrise is a personality trait and I respect it", likes: 178 },
      { id: "c11", videoId: "sd-1", author: "@socalsurfer", text: "the marine layer breaking at the end 🤌", likes: 245 },
      { id: "c12", videoId: "sd-2", author: "@packlightlaura", text: "the sarong-to-skirt trick just changed my life", likes: 389 },
      { id: "c13", videoId: "sd-2", author: "@goldenhourgal", text: "need the sandal link IMMEDIATELY", likes: 122 },
      { id: "c14", videoId: "sd-3", author: "@tacotuesdayted", text: "you ranked them CORRECTLY. rare to see", likes: 456 },
      { id: "c15", videoId: "sd-3", author: "@oldtownlocal", text: "the hidden salsa bar shoutout!! locals know 🤫", likes: 203 },
      { id: "c16", videoId: "sd-1", author: "@dawnpatrolz", text: "posting this while snoozing my 6am alarm, inspiring", likes: 94 },
      { id: "c17", videoId: "sd-2", author: "@sophfanpage", text: "the dinner reveal spin?? cinema.", likes: 167 },
      { id: "c18", videoId: "sd-3", author: "@alpastorfan", text: "flying to SD this weekend because of this video, no joke", likes: 310 },
    ],
  },
];
