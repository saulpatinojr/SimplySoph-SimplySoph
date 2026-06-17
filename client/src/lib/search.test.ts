import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchContent } from "./search";

const mocks = vi.hoisted(() => ({
  collection: vi.fn((_, name: string) => ({ name })),
  query: vi.fn((...args: unknown[]) => args),
  where: vi.fn((...args: unknown[]) => ({ where: args })),
  limit: vi.fn((value: number) => ({ limit: value })),
  getDocs: vi.fn(),
}));

vi.mock("./firebase", () => ({
  getFirebaseFirestore: vi.fn(() => ({})),
}));

vi.mock("firebase/firestore", () => ({
  collection: mocks.collection,
  query: mocks.query,
  where: mocks.where,
  limit: mocks.limit,
  getDocs: mocks.getDocs,
}));

function snapshot(
  docs: Array<{ id: string; data: Record<string, unknown> }>
) {
  return {
    forEach: (callback: (doc: any) => void) => {
      docs.forEach(doc =>
        callback({
          id: doc.id,
          data: () => doc.data,
        })
      );
    },
  };
}

describe("searchContent with Firestore search tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDocs.mockResolvedValue(snapshot([]));
  });

  it("performs search and maps results", async () => {
    const publishedAt = new Date("2023-01-01");
    mocks.getDocs
      .mockResolvedValueOnce(
        snapshot([
          {
            id: "blog1",
            data: {
              title: "Recycling Guide",
              excerpt: "How to recycle properly",
              category: "Sustainability",
              slug: "recycling-guide",
              publishedAt: { toDate: () => publishedAt },
            },
          },
        ])
      )
      .mockResolvedValueOnce(snapshot([]))
      .mockResolvedValueOnce(snapshot([]));

    const results = await searchContent("recycling");

    expect(mocks.where).toHaveBeenCalledWith(
      "searchTokens",
      "array-contains-any",
      ["recycling"]
    );
    expect(mocks.limit).toHaveBeenCalledWith(20);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "blog1",
      type: "blog",
      title: "Recycling Guide",
      url: "/blog/recycling-guide",
    });
    expect(results[0].publishedAt).toBe(publishedAt);
  });

  it("filters by content type", async () => {
    mocks.getDocs.mockResolvedValueOnce(
      snapshot([
        {
          id: "blog1",
          data: {
            title: "Blog 1",
            slug: "blog-1",
            publishedAt: { toDate: () => new Date(1000) },
          },
        },
      ])
    );

    const results = await searchContent("something", "blog");

    expect(mocks.collection).toHaveBeenCalledTimes(1);
    expect(mocks.collection).toHaveBeenCalledWith({}, "blogPosts");
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("blog");
  });

  it("handles errors gracefully", async () => {
    mocks.getDocs.mockRejectedValueOnce(new Error("Firestore error"));

    const results = await searchContent("error", "blog");

    expect(results).toEqual([]);
  });
});
