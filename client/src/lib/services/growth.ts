import type { PhotoAlbum, BlogPost, VideoEntry } from "./types";
import type { Destination } from "./destination";

export type NewsletterInterest =
  | "travel-style"
  | "capsule-packing"
  | "beauty-notes"
  | "creator-updates"
  | "brand-partnerships";

export interface NewsletterInterestOption {
  id: NewsletterInterest;
  label: string;
  description: string;
}

export interface GrowthProduct {
  id: string;
  name: string;
  brand: string;
  price?: string;
  imageUrl: string;
  productUrl: string;
  tags: string[];
  retailer: string;
}

export interface GrowthLook {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  destinationSlugs: string[];
  items: GrowthProduct[];
}

export interface RelatedStoryCard {
  id: string;
  type: "blog" | "video" | "album";
  title: string;
  description?: string;
  imageUrl?: string;
  url: string;
  matchReason: string;
}

export interface DestinationProfile {
  seasonLabel: string;
  budgetLabel: string;
  highlights: string[];
  vibeTags: string[];
}

export interface MediaKitOffering {
  title: string;
  description: string;
  outcomes: string[];
}

export interface MediaKitProofPoint {
  title: string;
  description: string;
}

export const NEWSLETTER_INTEREST_OPTIONS: NewsletterInterestOption[] = [
  {
    id: "travel-style",
    label: "Travel style",
    description: "Packing notes, destination outfits, and airport-to-dinner looks.",
  },
  {
    id: "capsule-packing",
    label: "Capsule packing",
    description: "Edit-first packing lists and repeat-wear outfit formulas.",
  },
  {
    id: "beauty-notes",
    label: "Beauty notes",
    description: "Travel-proof routines, skin prep, and carry-on beauty favorites.",
  },
  {
    id: "creator-updates",
    label: "Creator updates",
    description: "Behind-the-scenes drops, launches, and studio notes.",
  },
  {
    id: "brand-partnerships",
    label: "Brand partnerships",
    description: "Occasional partnership announcements and creator-business updates.",
  },
];

export const PHASE4_LEAD_MAGNET = {
  title: "Capsule Packing List",
  description: "A destination-ready carry-on checklist with outfit formulas and beauty essentials.",
};

export const MEDIA_KIT_OFFERINGS: MediaKitOffering[] = [
  {
    title: "Destination storytelling",
    description:
      "Multi-format travel narratives that connect a place, an outfit system, and a brand partner in one editorial story.",
    outcomes: ["Hero reel or video", "Editorial stills", "Blog or guide placement"],
  },
  {
    title: "Launch amplification",
    description:
      "Launch-week content designed to create a coordinated narrative across short-form, long-form, and owned channels.",
    outcomes: ["Launch-day asset set", "Usage-rights friendly delivery", "Follow-up recap content"],
  },
  {
    title: "Performance-minded UGC",
    description:
      "Creator-shot social assets for paid, lifecycle, and landing-page usage with a stronger editorial point of view.",
    outcomes: ["Vertical cutdowns", "Hook variations", "Clean product close-ups"],
  },
  {
    title: "Longer-term partnerships",
    description:
      "A retained collaboration model that ties content releases, seasonal drops, and campaign reporting together.",
    outcomes: ["Monthly cadence", "Quarterly concept planning", "Audience-fit feedback loop"],
  },
];

export const MEDIA_KIT_PROOF_POINTS: MediaKitProofPoint[] = [
  {
    title: "Cross-format publishing",
    description: "Concepts are planned to work across blog, short-form video, still imagery, and destination storytelling.",
  },
  {
    title: "Brand-safe workflow",
    description: "Deliverables, usage expectations, and disclosure needs are aligned before production begins.",
  },
  {
    title: "Creative with utility",
    description: "Content is designed to inspire but also to answer practical questions like what to pack, wear, and save.",
  },
  {
    title: "Conversion-minded curation",
    description: "Every story can connect to products, destinations, or next-step content without breaking editorial tone.",
  },
];

const DESTINATION_PROFILES: Record<string, DestinationProfile> = {
  tokyo: {
    seasonLabel: "City layering",
    budgetLabel: "Flexible",
    highlights: ["Texture-first outfits", "Day-to-night itinerary energy", "Compact packing wins"],
    vibeTags: ["city", "layering", "editorial"],
  },
  paris: {
    seasonLabel: "Transitional dressing",
    budgetLabel: "Premium mix",
    highlights: ["Tailored outerwear", "Walkable wardrobe planning", "Cafe-to-gallery styling"],
    vibeTags: ["tailored", "romantic", "classic"],
  },
  milan: {
    seasonLabel: "Fashion-week ready",
    budgetLabel: "Premium",
    highlights: ["Statement accessories", "Show-day polish", "Smart outfit repetition"],
    vibeTags: ["fashion", "luxury", "street-style"],
  },
};

const GROWTH_LOOKS: GrowthLook[] = [
  {
    id: "city-transit-uniform",
    title: "City Transit Uniform",
    description: "A carry-on-friendly formula built around one strong layer, one comfortable shoe, and accessories that sharpen every repeat wear.",
    imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
    destinationSlugs: ["tokyo", "paris", "milan"],
    items: [
      {
        id: "trench-coat",
        name: "Water-resistant trench coat",
        brand: "Nordstrom",
        price: "From $149",
        imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
        productUrl: "https://www.nordstrom.com/sr?keyword=trench+coat",
        tags: ["layering", "travel", "outerwear"],
        retailer: "Nordstrom",
      },
      {
        id: "crossbody-bag",
        name: "Hands-free crossbody bag",
        brand: "Madewell",
        price: "From $98",
        imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",
        productUrl: "https://www.madewell.com/search?q=crossbody+bag",
        tags: ["travel", "bag", "day-to-night"],
        retailer: "Madewell",
      },
      {
        id: "walking-loafer",
        name: "Walk-all-day loafer",
        brand: "Everlane",
        price: "From $128",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        productUrl: "https://www.everlane.com/search?q=loafer",
        tags: ["shoe", "travel", "comfort"],
        retailer: "Everlane",
      },
    ],
  },
  {
    id: "sunset-resort-edit",
    title: "Sunset Resort Edit",
    description: "Soft color, low-bulk fabric choices, and a polished sandal that still packs flat.",
    imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    destinationSlugs: ["bali", "tulum", "amalfi"],
    items: [
      {
        id: "linen-set",
        name: "Linen matching set",
        brand: "J.Crew",
        price: "From $118",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
        productUrl: "https://www.jcrew.com/search?q=linen+set",
        tags: ["resort", "linen", "summer"],
        retailer: "J.Crew",
      },
      {
        id: "minimal-sandal",
        name: "Minimal leather sandal",
        brand: "Sézane",
        price: "From $155",
        imageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=600&q=80",
        productUrl: "https://www.sezane.com/us/search?query=sandals",
        tags: ["resort", "shoe", "summer"],
        retailer: "Sézane",
      },
    ],
  },
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(...values: Array<string | undefined>): string[] {
  return values
    .filter(Boolean)
    .flatMap(value => normalize(value as string).split(/[^a-z0-9]+/g))
    .filter(token => token.length > 2);
}

function inferSeasonLabel(destination: Destination): string {
  const month = destination.date.getMonth();
  if (month >= 2 && month <= 4) return "Spring edit";
  if (month >= 5 && month <= 7) return "Summer packing";
  if (month >= 8 && month <= 10) return "Autumn layering";
  return "Winter textures";
}

export function getDestinationProfile(destination: Destination): DestinationProfile {
  const keyed = DESTINATION_PROFILES[normalize(destination.slug)];
  if (keyed) return keyed;

  return {
    seasonLabel: inferSeasonLabel(destination),
    budgetLabel: "Plan by itinerary",
    highlights: [
      "Outfit planning tied to the day’s pace",
      "Packing formulas instead of one-off looks",
      "Editorial details that still travel well",
    ],
    vibeTags: tokenize(destination.city, destination.country).slice(0, 3),
  };
}

export function getDestinationLook(destination: Destination): GrowthLook | null {
  return (
    GROWTH_LOOKS.find(look =>
      look.destinationSlugs.includes(normalize(destination.slug))
    ) ?? null
  );
}

function scoreTextMatch(tokens: string[], corpus: string[]): number {
  return tokens.reduce((score, token) => score + (corpus.includes(token) ? 1 : 0), 0);
}

export function buildRelatedStories(
  destination: Destination,
  blogs: BlogPost[],
  videos: VideoEntry[],
  albums: PhotoAlbum[],
  maxItems: number = 6
): RelatedStoryCard[] {
  const profile = getDestinationProfile(destination);
  const destinationTokens = [
    ...tokenize(destination.city, destination.country, destination.slug),
    ...profile.vibeTags.map(normalize),
  ];

  const stories: Array<RelatedStoryCard & { score: number }> = [];

  for (const post of blogs) {
    const corpus = [
      ...tokenize(post.title, post.excerpt, post.slug),
      ...(post.tags ?? []).map(normalize),
    ];
    const score = scoreTextMatch(destinationTokens, corpus);
    if (score > 0) {
      stories.push({
        id: post.id,
        type: "blog",
        title: post.title,
        description: post.excerpt,
        imageUrl: post.coverImage,
        url: `/blog/${post.slug}`,
        matchReason: score > 2 ? "Editorial match" : "Related story",
        score,
      });
    }
  }

  for (const video of videos) {
    const corpus = [
      ...tokenize(video.title, video.description, video.slug),
      ...(video.tags ?? []).map(normalize),
    ];
    const score = scoreTextMatch(destinationTokens, corpus);
    if (score > 0) {
      stories.push({
        id: video.id,
        type: "video",
        title: video.title,
        description: video.description,
        imageUrl: video.thumbnailUrl,
        url: `/videos/${video.slug}`,
        matchReason: score > 2 ? "Video companion" : "Related video",
        score,
      });
    }
  }

  for (const album of albums) {
    const corpus = [
      ...tokenize(album.title, album.description, album.slug),
      ...(album.tags ?? []).map(normalize),
    ];
    const score = scoreTextMatch(destinationTokens, corpus);
    if (score > 0) {
      stories.push({
        id: album.id,
        type: "album",
        title: album.title,
        description: album.description,
        imageUrl: album.coverImage,
        url: `/photos/${album.slug}`,
        matchReason: score > 2 ? "Photo companion" : "Related gallery",
        score,
      });
    }
  }

  return stories
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, maxItems)
    .map(({ score, ...story }) => story);
}

export function filterDestinations(
  destinations: Destination[],
  searchTerm: string,
  countryFilter: string
): Destination[] {
  const search = normalize(searchTerm);
  const country = normalize(countryFilter);

  return destinations.filter(destination => {
    const matchesSearch =
      !search ||
      normalize(destination.city).includes(search) ||
      normalize(destination.country ?? "").includes(search);

    const matchesCountry =
      !country || normalize(destination.country ?? "") === country;

    return matchesSearch && matchesCountry;
  });
}

export function listDestinationCountries(destinations: Destination[]): string[] {
  return Array.from(
    new Set(destinations.map(destination => destination.country).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b));
}
