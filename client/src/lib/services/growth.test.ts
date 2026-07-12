import { describe, expect, it } from "vitest";
import { buildRelatedStories, filterDestinations, getDestinationProfile } from "./growth";

describe("growth helpers", () => {
  const destination = {
    id: "dest-1",
    slug: "tokyo",
    city: "Tokyo",
    country: "Japan",
    date: new Date("2026-05-01"),
    coverStampUrl: "/tokyo.png",
    mediaItems: [],
    status: "published",
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
    authorId: "admin-1",
  } as const;

  it("filters destinations by search and country", () => {
    const destinations = [
      destination,
      { ...destination, id: "dest-2", slug: "paris", city: "Paris", country: "France" },
    ];

    const filtered = filterDestinations(destinations, "par", "France");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].slug).toBe("paris");
  });

  it("builds related stories from matching city and vibe tokens", () => {
    const stories = buildRelatedStories(
      destination,
      [
        {
          id: "blog-1",
          title: "Tokyo layering notes",
          slug: "tokyo-layering-notes",
          excerpt: "Packing for a city trip.",
          content: "",
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: "admin-1",
          tags: ["layering"],
        },
      ],
      [],
      []
    );

    expect(stories).toHaveLength(1);
    expect(stories[0].url).toBe("/blog/tokyo-layering-notes");
  });

  it("falls back to inferred destination profile metadata", () => {
    const profile = getDestinationProfile({
      ...destination,
      slug: "unknown-city",
      city: "Reykjavik",
      country: "Iceland",
      date: new Date("2026-12-01"),
    });

    expect(profile.seasonLabel).toBe("Winter textures");
    expect(profile.highlights.length).toBeGreaterThan(0);
  });
});
