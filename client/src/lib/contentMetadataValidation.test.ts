import { describe, expect, it } from "vitest";
import {
  getEditorSaveGuard,
  validateContentMetadata,
} from "@/lib/contentMetadataValidation";

describe("validateContentMetadata", () => {
  it("returns valid when featured products and related links are well-formed", () => {
    const result = validateContentMetadata({
      featuredProducts: [
        {
          id: "p1",
          name: "Travel Blazer",
          brand: "SimplySoph",
          imageUrl: "https://cdn.example.com/blazer.jpg",
          productUrl: "https://shop.example.com/blazer",
        },
      ],
      relatedLinks: [
        {
          id: "r1",
          type: "destination",
          title: "Lisbon Guide",
          url: "/passport/lisbon",
        },
      ],
    });

    expect(result.isValid).toBe(true);
    expect(result.totalIssues).toBe(0);
    expect(result.issues).toEqual([]);
  });

  it("returns issues when featured products and related links are malformed", () => {
    const result = validateContentMetadata({
      featuredProducts: [
        {
          id: "p1",
          name: "",
          brand: "SimplySoph",
          imageUrl: "not-a-url",
          productUrl: "also-not-a-url",
        },
      ],
      relatedLinks: [
        {
          id: "r1",
          type: "external",
          title: "",
          url: "example.com",
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.totalIssues).toBeGreaterThan(0);
    expect(result.firstIssue).toBeTruthy();
    expect(result.issues.join(" ")).toContain("Featured product 1");
    expect(result.issues.join(" ")).toContain("Related link 1");
  });
});

describe("getEditorSaveGuard", () => {
  it("allows draft saves when publish-only fields are missing but metadata is valid", () => {
    const result = getEditorSaveGuard({
      intent: "draft",
      featuredProducts: [
        {
          id: "p1",
          name: "Travel Blazer",
          brand: "SimplySoph",
          imageUrl: "https://cdn.example.com/blazer.jpg",
          productUrl: "https://shop.example.com/blazer",
        },
      ],
      relatedLinks: [
        {
          id: "r1",
          type: "destination",
          title: "Lisbon Guide",
          url: "/passport/lisbon",
        },
      ],
    });

    expect(result.shouldBlockSave).toBe(false);
    expect(result.totalIssues).toBe(0);
  });

  it("blocks publish saves when canonical URL, disclosure, and image alt text are missing", () => {
    const result = getEditorSaveGuard({
      intent: "published",
      featuredProducts: [
        {
          id: "p1",
          name: "Travel Blazer",
          brand: "SimplySoph",
          imageUrl: "https://cdn.example.com/blazer.jpg",
          productUrl: "https://shop.example.com/blazer",
        },
      ],
      relatedLinks: [
        {
          id: "r1",
          type: "destination",
          title: "Lisbon Guide",
          url: "/passport/lisbon",
        },
      ],
      coverImage: "https://cdn.example.com/cover.jpg",
      canonicalUrl: "",
      disclosureText: "",
      coverImageAlt: "",
    });

    expect(result.shouldBlockSave).toBe(true);
    expect(result.issues).toContain("Canonical URL is required before publishing.");
    expect(result.issues).toContain("Disclosure text is required before publishing.");
    expect(result.issues).toContain(
      "Cover image alt text is required when a cover image is set."
    );
  });

  it("blocks publish saves when photo captions are missing", () => {
    const result = getEditorSaveGuard({
      intent: "published",
      canonicalUrl: "https://simplysoph.com/photos/paris",
      disclosureText: "Affiliate links may be included.",
      photoCaptions: ["Sunny day in Paris", ""],
    });

    expect(result.shouldBlockSave).toBe(true);
    expect(result.issues.some(issue => issue.includes("Photo 2"))).toBe(true);
  });

  it("passes publish saves when all publish checks are satisfied", () => {
    const result = getEditorSaveGuard({
      intent: "published",
      canonicalUrl: "https://simplysoph.com/blog/lisbon-guide",
      disclosureText: "This article includes affiliate links.",
      coverImage: "https://cdn.example.com/lisbon.jpg",
      coverImageAlt: "View of Lisbon rooftops at golden hour",
      thumbnailUrl: "https://cdn.example.com/video-thumb.jpg",
      thumbnailAlt: "Creator presenting travel looks",
      photoCaptions: ["Street market in Lisbon"],
      featuredProducts: [
        {
          id: "p1",
          name: "Travel Blazer",
          brand: "SimplySoph",
          imageUrl: "https://cdn.example.com/blazer.jpg",
          productUrl: "https://shop.example.com/blazer",
        },
      ],
      relatedLinks: [
        {
          id: "r1",
          type: "destination",
          title: "Lisbon Guide",
          url: "/passport/lisbon",
        },
      ],
    });

    expect(result.shouldBlockSave).toBe(false);
    expect(result.totalIssues).toBe(0);
  });
});
