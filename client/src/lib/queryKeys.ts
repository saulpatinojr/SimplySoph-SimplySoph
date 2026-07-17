/**
 * Central React Query key factories.
 *
 * Every content type has ONE public root (e.g. ["blog"]) so an admin
 * mutation can refresh every public view of that type with a single
 * prefix invalidation: `invalidateQueries({ queryKey: queryKeys.blog.root })`.
 * Admin-only caches live under ["admin", ...] and are invalidated separately.
 *
 * Do not hand-write key arrays in pages — drift between the key a public
 * page reads and the key an admin mutation invalidates is how stale-content
 * bugs happen (see CODE_REVIEW plan, Phase A4).
 */
export const queryKeys = {
  blog: {
    root: ["blog"] as const,
    published: (limit?: number) =>
      limit === undefined
        ? (["blog", "published"] as const)
        : (["blog", "published", limit] as const),
    list: () => ["blog", "list"] as const,
    detail: (slug: string) => ["blog", "detail", slug] as const,
  },
  videos: {
    root: ["videos"] as const,
    published: () => ["videos", "published"] as const,
    detail: (slug: string) => ["videos", "detail", slug] as const,
  },
  albums: {
    root: ["albums"] as const,
    published: () => ["albums", "published"] as const,
    detail: (slug: string) => ["albums", "detail", slug] as const,
    photos: (albumId: string | undefined) =>
      ["albums", "photos", albumId] as const,
    recentPhotos: () => ["albums", "recent-photos"] as const,
  },
  destinations: {
    root: ["destinations"] as const,
    published: () => ["destinations", "published"] as const,
  },
  categories: {
    root: ["categories"] as const,
    byType: (type: string) => ["categories", type] as const,
  },
  looks: {
    root: ["looks"] as const,
    list: (scope: "all" | "published") => ["looks", scope] as const,
    detail: (slug: string, isAdmin: boolean) =>
      ["looks", "detail", slug, isAdmin] as const,
  },
  menagerie: {
    root: ["menagerie"] as const,
    list: (scope: "all" | "published") => ["menagerie", scope] as const,
    detail: (slug: string, isAdmin: boolean) =>
      ["menagerie", "detail", slug, isAdmin] as const,
  },
  menagerieBlogs: {
    root: ["menagerieBlogs"] as const,
    list: (scope: "all" | "published") => ["menagerieBlogs", scope] as const,
  },
  mediaPlacements: {
    root: ["media-placements"] as const,
    byTarget: (targetKey: string) => ["media-placements", targetKey] as const,
  },
  siteConfig: {
    root: ["site-config"] as const,
  },
  creatorProfile: () => ["creator-profile"] as const,
  admin: {
    posts: () => ["admin", "posts"] as const,
    post: (id: string) => ["admin", "post", id] as const,
    videos: () => ["admin", "videos"] as const,
    video: (id: string) => ["admin", "video", id] as const,
    albums: () => ["admin", "albums"] as const,
    album: (id: string) => ["admin", "album", id] as const,
    albumPhotos: (id: string) => ["admin", "album", "photos", id] as const,
    destinations: () => ["admin", "destinations"] as const,
    categories: () => ["admin", "categories"] as const,
    category: (id: string) => ["admin", "category", id] as const,
    categoriesByType: (type: string) =>
      ["admin", "categories", type] as const,
    looks: () => ["admin", "looks"] as const,
    look: (id: string) => ["admin", "looks", id] as const,
    menagerie: () => ["admin", "menagerie"] as const,
    menagerieItem: (id: string) => ["admin", "menagerie", id] as const,
    menagerieBlogs: () => ["admin", "menagerieBlogs"] as const,
    menagerieBlog: (id: string) => ["admin", "menagerieBlogs", id] as const,
    mediaAssets: () => ["admin", "media-assets"] as const,
  },
} as const;
