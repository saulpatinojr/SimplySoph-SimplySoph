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
        id: "7658470873501912350",
        title: "the day has finally come guys 🙌🚕",
        caption: "wheels down in the city",
        cover: ["#0b1026", "#3d2b6b"],
        emoji: "🚕",
        embedUrl: "https://www.tiktok.com/embed/v2/7658470873501912350",
      },
      {
        id: "7658790547368332575",
        title: "almost backed out 🥹🥰",
        caption: "louis vuitton, a suitcase & a milly rock",
        cover: ["#1a1f3d", "#6b2d5c"],
        emoji: "🧳",
        embedUrl: "https://www.tiktok.com/embed/v2/7658790547368332575",
      },
      {
        id: "7658845622870543647",
        title: "city never sleeps 🏙️🚕",
        caption: "ootd meets the skyline",
        cover: ["#2b1e4f", "#4a3a8c"],
        emoji: "🌃",
        embedUrl: "https://www.tiktok.com/embed/v2/7658845622870543647",
      },
      {
        id: "7659188578966146335",
        title: "me and my momma 🥰💓",
        caption: "hey there delilah, but make it NYC",
        cover: ["#0f1533", "#5a2d6b"],
        emoji: "💓",
        embedUrl: "https://www.tiktok.com/embed/v2/7659188578966146335",
      },
    ],
    comments: [
      { id: "c1", videoId: "7658845622870543647", author: "@citylightsmaya", text: "the way the skyline hits ... unreal 😭", likes: 214 },
      { id: "c2", videoId: "7658845622870543647", author: "@brooklynbabe", text: "ok but WHERE is that outfit from, asking for me", likes: 156 },
      { id: "c3", videoId: "7658470873501912350", author: "@jetsetjules", text: "the airport fit going straight into a yellow cab 😭✨", likes: 342 },
      { id: "c4", videoId: "7658470873501912350", author: "@feedmenyc", text: "the excitement is CONTAGIOUS, have the best trip", likes: 98 },
      { id: "c5", videoId: "7658790547368332575", author: "@thriftqueen", text: "the milly rock with the suitcase?? iconic", likes: 421 },
      { id: "c6", videoId: "7658790547368332575", author: "@lvlover", text: "so glad you didn't back out, this trip is content GOLD", likes: 87 },
      { id: "c7", videoId: "7659188578966146335", author: "@sophfanpage", text: "mother-daughter content is always elite 🥹", likes: 190 },
      { id: "c8", videoId: "7659188578966146335", author: "@delilahstan", text: "hey there delilah over NYC clips... you understood the assignment", likes: 265 },
      { id: "c9", videoId: "7658845622870543647", author: "@stylistkat", text: "night-out looks in the city that never sleeps, we need a part 2", likes: 133 },
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
