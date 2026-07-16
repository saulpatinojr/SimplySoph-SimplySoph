import { describe, expect, it } from "vitest";
import {
  filterPlushies,
  getDailySpotlight,
  getMenagerieStats,
  listPlushSpecies,
  Plush,
} from "./menagerie";

function makePlush(overrides: Partial<Plush>): Plush {
  return {
    id: "p1",
    slug: "p1",
    name: "Bartholomew",
    species: "Bashful Bunny",
    adoptionDate: new Date("2022-06-01"),
    heroPhoto: { url: "" },
    gallery: [],
    travelsWithMe: false,
    featured: false,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: "a1",
    ...overrides,
  };
}

const CREW: Plush[] = [
  makePlush({ id: "1", name: "Bartholomew", species: "Bashful Bunny", travelsWithMe: true, featured: true, adoptionDate: new Date("2019-03-01"), size: "medium", personalityTraits: ["shy"] }),
  makePlush({ id: "2", name: "Otto", species: "Amuseable Avocado", adoptionDate: new Date("2021-08-15"), size: "small", personalityTraits: ["snack enthusiast"] }),
  makePlush({ id: "3", name: "Fern", species: "Bashful Bunny", travelsWithMe: true, adoptionDate: new Date("2023-01-10"), size: "huge" }),
];

describe("filterPlushies", () => {
  it("filters by species", () => {
    const result = filterPlushies(CREW, { species: "Bashful Bunny" });
    expect(result.map(p => p.id)).toEqual(["1", "3"]);
  });

  it("filters by size and travel flag", () => {
    expect(filterPlushies(CREW, { size: "huge" }).map(p => p.id)).toEqual(["3"]);
    expect(
      filterPlushies(CREW, { travelBuddiesOnly: true }).map(p => p.id)
    ).toEqual(["1", "3"]);
  });

  it("searches across name, nickname, species, and traits", () => {
    expect(filterPlushies(CREW, { search: "snack" }).map(p => p.id)).toEqual(["2"]);
    expect(filterPlushies(CREW, { search: "OTTO" }).map(p => p.id)).toEqual(["2"]);
    expect(filterPlushies(CREW, { search: "dragon" })).toEqual([]);
  });
});

describe("listPlushSpecies / getMenagerieStats", () => {
  it("lists unique species sorted", () => {
    expect(listPlushSpecies(CREW)).toEqual([
      "Amuseable Avocado",
      "Bashful Bunny",
    ]);
  });

  it("computes collection stats", () => {
    expect(getMenagerieStats(CREW)).toEqual({
      total: 3,
      speciesCount: 2,
      memberSinceYear: 2019,
      travelBuddyCount: 2,
    });
  });

  it("handles an empty collection", () => {
    expect(getMenagerieStats([])).toEqual({
      total: 0,
      speciesCount: 0,
      memberSinceYear: null,
      travelBuddyCount: 0,
    });
  });
});

describe("getDailySpotlight", () => {
  it("is deterministic for a given day and prefers featured plushies", () => {
    const day = new Date("2026-07-16T15:30:00");
    const pick1 = getDailySpotlight(CREW, day);
    const pick2 = getDailySpotlight(CREW, new Date("2026-07-16T08:00:00"));
    expect(pick1).toBe(pick2);
    expect(pick1?.featured).toBe(true);
  });

  it("falls back to the whole crew when nothing is featured", () => {
    const noFeatured = CREW.map(p => ({ ...p, featured: false }));
    expect(getDailySpotlight(noFeatured, new Date())).not.toBeNull();
  });

  it("returns null for an empty collection", () => {
    expect(getDailySpotlight([], new Date())).toBeNull();
  });
});
