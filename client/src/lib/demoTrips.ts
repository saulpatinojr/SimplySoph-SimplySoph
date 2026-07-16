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

export type TripPlaylist = {
  /** On-air station name shown on the mini radio */
  station: string;
  title: string;
  /** FM frequency that positions the tuner needle on the dial */
  freq: number;
  /** Public Apple Music playlist URL (music.apple.com/...) — embeds when set */
  appleMusicUrl?: string;
};

export type TripPlate = {
  /** State name across the top of the plate */
  region: string;
  /** Small slogan under the serial (e.g. "Empire State") */
  slogan: string;
  /** The plate serial itself */
  serial: string;
  /** Plate face background (CSS) */
  bg: string;
  /** Serial/border color */
  color: string;
  /** Region lettering color (e.g. California script red) */
  regionColor: string;
  /** Italic script region name (California-style) instead of block letters */
  script?: boolean;
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
  /** Drifting glow blob colors that keep the background alive */
  glow: [string, string, string];
  stamp: string;
  plate: TripPlate;
  playlist: TripPlaylist;
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
    bg: ["#0d0a24", "#241442", "#3d1554"],
    glow: ["#7c3aed", "#f59e0b", "#ec4899"],
    stamp: "JFK ✈ NYC",
    plate: {
      region: "NEW YORK",
      slogan: "Empire State",
      serial: "SOPH·NYC",
      bg: "linear-gradient(180deg, #fef6dc 0%, #fbc02d 100%)",
      color: "#1a2a6b",
      regionColor: "#1a2a6b",
    },
    playlist: {
      station: "SOPH.FM",
      title: "nyc in my headphones 🗽",
      freq: 101.3,
    },
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
      {
        id: "c1",
        videoId: "7658845622870543647",
        author: "@citylightsmaya",
        text: "the way the skyline hits ... unreal 😭",
        likes: 214,
      },
      {
        id: "c2",
        videoId: "7658845622870543647",
        author: "@brooklynbabe",
        text: "ok but WHERE is that outfit from, asking for me",
        likes: 156,
      },
      {
        id: "c3",
        videoId: "7658470873501912350",
        author: "@jetsetjules",
        text: "the airport fit going straight into a yellow cab 😭✨",
        likes: 342,
      },
      {
        id: "c4",
        videoId: "7658470873501912350",
        author: "@feedmenyc",
        text: "the excitement is CONTAGIOUS, have the best trip",
        likes: 98,
      },
      {
        id: "c5",
        videoId: "7658790547368332575",
        author: "@thriftqueen",
        text: "the milly rock with the suitcase?? iconic",
        likes: 421,
      },
      {
        id: "c6",
        videoId: "7658790547368332575",
        author: "@lvlover",
        text: "so glad you didn't back out, this trip is content GOLD",
        likes: 87,
      },
      {
        id: "c7",
        videoId: "7659188578966146335",
        author: "@sophfanpage",
        text: "mother-daughter content is always elite 🥹",
        likes: 190,
      },
      {
        id: "c8",
        videoId: "7659188578966146335",
        author: "@delilahstan",
        text: "hey there delilah over NYC clips... you understood the assignment",
        likes: 265,
      },
      {
        id: "c9",
        videoId: "7658845622870543647",
        author: "@stylistkat",
        text: "night-out looks in the city that never sleeps, we need a part 2",
        likes: 133,
      },
      {
        id: "c19",
        videoId: "7658470873501912350",
        author: "@gatecheckgang",
        text: "screaming at the cab pulling up right on cue 🚕",
        likes: 176,
      },
      {
        id: "c20",
        videoId: "7658790547368332575",
        author: "@packedandready",
        text: "the suitcase matching the fit... intentional and I love it",
        likes: 249,
      },
      {
        id: "c21",
        videoId: "7658845622870543647",
        author: "@midtownmoments",
        text: "this is why I'll never leave this city 🏙️",
        likes: 305,
      },
      {
        id: "c22",
        videoId: "7659188578966146335",
        author: "@momsoftiktok",
        text: "your mom's smile at the end 😭 protect her at all costs",
        likes: 512,
      },
      {
        id: "c23",
        videoId: "7659188578966146335",
        author: "@travelwithtia",
        text: "adding mother-daughter NYC trip to the vision board immediately",
        likes: 228,
      },
      {
        id: "c29",
        videoId: "7658470873501912350",
        author: "@windowseatwins",
        text: "the anticipation in this video is a whole mood ✈️",
        likes: 144,
      },
      {
        id: "c30",
        videoId: "7658470873501912350",
        author: "@nycornothing",
        text: "welcome to the greatest city on earth 🗽",
        likes: 267,
      },
      {
        id: "c31",
        videoId: "7658790547368332575",
        author: "@luggagegoals",
        text: "girl the OUTFIT the BAG the DANCE, a full production",
        likes: 318,
      },
      {
        id: "c32",
        videoId: "7658790547368332575",
        author: "@nervoustraveler",
        text: "'almost backed out' is me before literally every trip 😭",
        likes: 205,
      },
      {
        id: "c33",
        videoId: "7658845622870543647",
        author: "@neonnightsny",
        text: "shot on what camera?? the night quality is insane",
        likes: 189,
      },
      {
        id: "c34",
        videoId: "7658845622870543647",
        author: "@empirestatemind",
        text: "the cab, the lights, the fit — a love letter to NYC fr",
        likes: 276,
      },
      {
        id: "c35",
        videoId: "7659188578966146335",
        author: "@heytherefan",
        text: "not the song choice making me call my mom immediately",
        likes: 351,
      },
      {
        id: "c36",
        videoId: "7659188578966146335",
        author: "@brooklynmama",
        text: "take her to a broadway show next!! she deserves it",
        likes: 163,
      },
    ],
  },
  {
    id: "san-diego",
    city: "San Diego",
    tagline: "salt air & golden hour",
    dates: "endless summer",
    accent: "#FF8A5C",
    bg: ["#0e2a3a", "#1d4550", "#6e2f47"],
    glow: ["#f97316", "#14b8a6", "#facc15"],
    stamp: "SAN ✈ SD",
    plate: {
      region: "California",
      slogan: "The Golden State",
      serial: "SOPH·SD",
      bg: "linear-gradient(180deg, #ffffff 0%, #eef0f2 100%)",
      color: "#1a2a6b",
      regionColor: "#c62828",
      script: true,
    },
    playlist: {
      station: "SOPH.FM",
      title: "sun-chasing in san diego 🌴",
      freq: 88.5,
    },
    videos: [
      {
        id: "7649263971114945822",
        title: "fun day tdy 💝😇",
        caption: "seaport village at golden hour",
        cover: ["#1f4a52", "#e07a5f"],
        emoji: "🌅",
        embedUrl: "https://www.tiktok.com/embed/v2/7649263971114945822",
      },
      {
        id: "7649167372766514462",
        title: "ootd but make it beachy 🌞🐬",
        caption: "boardwalk fit check",
        cover: ["#7a3b4f", "#f2a65a"],
        emoji: "🐬",
        embedUrl: "https://www.tiktok.com/embed/v2/7649167372766514462",
      },
      {
        id: "7649291598685130014",
        title: "aesthetic queen era 🧁",
        caption: "preppy pastels all day",
        cover: ["#12303f", "#c65f4e"],
        emoji: "🧁",
        embedUrl: "https://www.tiktok.com/embed/v2/7649291598685130014",
      },
      {
        id: "7650004410579422494",
        title: "one of my fav days ever 💝",
        caption: "la jolla cliffs & sunshine",
        cover: ["#1a3b4f", "#f2c14e"],
        emoji: "🌊",
        embedUrl: "https://www.tiktok.com/embed/v2/7650004410579422494",
      },
      {
        id: "7650912812125965598",
        title: "last day in sd 😭",
        caption: "pacific beach send-off",
        cover: ["#0d2b38", "#8fd3c4"],
        emoji: "✈️",
        embedUrl: "https://www.tiktok.com/embed/v2/7650912812125965598",
      },
    ],
    comments: [
      {
        id: "c10",
        videoId: "7649263971114945822",
        author: "@wavesandwaffles",
        text: "seaport village at golden hour has main character energy",
        likes: 178,
      },
      {
        id: "c11",
        videoId: "7649263971114945822",
        author: "@socalsurfer",
        text: "this is giving vacation mode: fully activated",
        likes: 245,
      },
      {
        id: "c12",
        videoId: "7649167372766514462",
        author: "@packlightlaura",
        text: "the fit is doing NUMBERS today",
        likes: 389,
      },
      {
        id: "c13",
        videoId: "7649167372766514462",
        author: "@goldenhourgal",
        text: "beach ootd but make it a whole moodboard",
        likes: 122,
      },
      {
        id: "c14",
        videoId: "7649291598685130014",
        author: "@tacotuesdayted",
        text: "preppy pastel era has me restocking my whole closet",
        likes: 456,
      },
      {
        id: "c15",
        videoId: "7649291598685130014",
        author: "@oldtownlocal",
        text: "aesthetic queen was an understatement honestly",
        likes: 203,
      },
      {
        id: "c16",
        videoId: "7650004410579422494",
        author: "@dawnpatrolz",
        text: "la jolla cliffs in the background... unreal",
        likes: 94,
      },
      {
        id: "c17",
        videoId: "7650004410579422494",
        author: "@sophfanpage",
        text: "this looks like the best day of the whole trip ngl",
        likes: 167,
      },
      {
        id: "c18",
        videoId: "7650912812125965598",
        author: "@alpastorfan",
        text: "the last-day sads are so real, don't go 😭",
        likes: 310,
      },
      {
        id: "c24",
        videoId: "7649263971114945822",
        author: "@mistymorningsurf",
        text: "add seaport village to my itinerary immediately please",
        likes: 142,
      },
      {
        id: "c25",
        videoId: "7649167372766514462",
        author: "@capsulecloset",
        text: "the confidence in this walk >>>",
        likes: 274,
      },
      {
        id: "c26",
        videoId: "7649291598685130014",
        author: "@salsaverdestan",
        text: "every frame of this could be its own pinterest board",
        likes: 198,
      },
      {
        id: "c27",
        videoId: "7650004410579422494",
        author: "@vitaminsea_",
        text: "the seals better have made an appearance out there",
        likes: 331,
      },
      {
        id: "c28",
        videoId: "7650912812125965598",
        author: "@goldenstateofmind",
        text: "pacific beach really said goodbye in style",
        likes: 156,
      },
      {
        id: "c37",
        videoId: "7649167372766514462",
        author: "@pointlomalocal",
        text: "boardwalk fits should always hit this hard",
        likes: 217,
      },
      {
        id: "c38",
        videoId: "7649291598685130014",
        author: "@surfratsummer",
        text: "the pastel palette is doing some serious heavy lifting",
        likes: 184,
      },
      {
        id: "c39",
        videoId: "7650004410579422494",
        author: "@resortwearrachel",
        text: "la jolla in one video, iconic",
        likes: 296,
      },
      {
        id: "c40",
        videoId: "7650912812125965598",
        author: "@sandiegonights",
        text: "already counting down to the next sd trip fr",
        likes: 138,
      },
      {
        id: "c41",
        videoId: "7649263971114945822",
        author: "@tacometrics",
        text: "golden hour by the water, that's the whole vibe",
        likes: 244,
      },
      {
        id: "c42",
        videoId: "7649291598685130014",
        author: "@oldtownabuela",
        text: "mija the preppy fit is giving so much sunshine",
        likes: 402,
      },
      {
        id: "c43",
        videoId: "7650912812125965598",
        author: "@morningmarine",
        text: "no because why did this make me tear up a little",
        likes: 129,
      },
      {
        id: "c44",
        videoId: "7650004410579422494",
        author: "@crunchycornersd",
        text: "the cliffs, the sun, the whole day... a perfect 10",
        likes: 173,
      },
    ],
  },
];
