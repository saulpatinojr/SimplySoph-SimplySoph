import type { PhotoAlbum, BlogPost, VideoEntry } from "./types";
import type {
  Destination,
  DestinationFeaturedLook,
  DestinationRelatedLink,
} from "./destination";

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
  type: "blog" | "video" | "album" | "external";
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
  if (
    destination.seasonLabel ||
    destination.budgetLabel ||
    (destination.highlights && destination.highlights.length > 0) ||
    (destination.vibeTags && destination.vibeTags.length > 0)
  ) {
    return {
      seasonLabel: destination.seasonLabel || inferSeasonLabel(destination),
      budgetLabel: destination.budgetLabel || "Plan by itinerary",
      highlights:
        destination.highlights && destination.highlights.length > 0
          ? destination.highlights
          : [
              "Outfit planning tied to the day’s pace",
              "Packing formulas instead of one-off looks",
              "Editorial details that still travel well",
            ],
      vibeTags:
        destination.vibeTags && destination.vibeTags.length > 0
          ? destination.vibeTags
          : tokenize(destination.city, destination.country).slice(0, 3),
    };
  }

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
  const featuredLook = destination.featuredLook as DestinationFeaturedLook | null | undefined;
  if (!featuredLook || featuredLook.items.length === 0) return null;

  return {
    id: `${destination.id}-look`,
    title: featuredLook.title,
    description: featuredLook.description,
    imageUrl: featuredLook.imageUrl,
    destinationSlugs: [destination.slug],
    items: featuredLook.items.map(item => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      imageUrl: item.imageUrl,
      productUrl: item.productUrl,
      retailer: item.retailer || item.brand,
      tags: tokenize(item.name, item.brand, item.notes),
    })),
  };
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
  if (destination.relatedLinks && destination.relatedLinks.length > 0) {
    return (destination.relatedLinks as DestinationRelatedLink[])
      .slice(0, maxItems)
      .map(link => ({
        id: link.id,
        type: link.type,
        title: link.title,
        description: link.description,
        imageUrl: link.imageUrl,
        url: link.url,
        matchReason: link.matchReason || "Curated by editor",
      }));
  }

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
