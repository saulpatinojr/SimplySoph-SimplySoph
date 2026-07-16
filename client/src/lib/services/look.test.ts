import { describe, expect, it } from "vitest";
import { filterLooks, listLookOccasions, Look, lookToGrowthLook } from "./look";

function makeLook(overrides: Partial<Look>): Look {
  return {
    id: "l1",
    slug: "l1",
    title: "Airport Set",
    heroImageUrl: "https://example.com/hero.webp",
    gallery: [],
    occasionTags: [],
    products: [],
    featured: false,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: "a1",
    ...overrides,
  };
}

describe("lookToGrowthLook", () => {
  it("maps look fields and products into the ShopTheLook shape", () => {
    const look = makeLook({
      subtitle: "carry-on chic",
      destinationSlug: "san-diego",
      products: [
        {
          id: "pr1",
          name: "Linen Set",
          brand: "Brandy",
          imageUrl: "img",
          productUrl: "https://shop.example/x",
          price: "$58",
          retailer: "LTK",
        },
      ],
    });

    const growth = lookToGrowthLook(look);
    expect(growth.title).toBe("Airport Set");
    expect(growth.description).toBe("carry-on chic");
    expect(growth.destinationSlugs).toEqual(["san-diego"]);
    expect(growth.items).toHaveLength(1);
    expect(growth.items[0]).toMatchObject({
      name: "Linen Set",
      retailer: "LTK",
      tags: [],
    });
  });

  it("handles missing destination and retailer", () => {
    const growth = lookToGrowthLook(
      makeLook({
        products: [
          {
            id: "pr1",
            name: "Hat",
            brand: "B",
            imageUrl: "i",
            productUrl: "u",
          },
        ],
      })
    );
    expect(growth.destinationSlugs).toEqual([]);
    expect(growth.items[0].retailer).toBe("");
  });
});

describe("filterLooks / listLookOccasions", () => {
  const LOOKS = [
    makeLook({ id: "1", season: "summer", occasionTags: ["airport", "dinner"] }),
    makeLook({ id: "2", season: "winter", occasionTags: ["dinner"] }),
    makeLook({ id: "3", occasionTags: [] }),
  ];

  it("filters by season and occasion", () => {
    expect(filterLooks(LOOKS, { season: "summer" }).map(l => l.id)).toEqual(["1"]);
    expect(filterLooks(LOOKS, { occasion: "dinner" }).map(l => l.id)).toEqual(["1", "2"]);
    expect(filterLooks(LOOKS, {}).map(l => l.id)).toEqual(["1", "2", "3"]);
  });

  it("lists unique occasions sorted", () => {
    expect(listLookOccasions(LOOKS)).toEqual(["airport", "dinner"]);
  });
});
