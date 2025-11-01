import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Content queries
import { blogPosts, categories, videos, photoAlbums, photos, comments, BlogPost, Category, Video, PhotoAlbum, Photo } from "../drizzle/schema";
import { desc, and, like, sql } from "drizzle-orm";

export async function getAllCategories(type?: "blog" | "video" | "photo"): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  
  const query = type 
    ? db.select().from(categories).where(eq(categories.type, type))
    : db.select().from(categories);
  
  return query;
}

export async function getPublishedBlogPosts(limit?: number): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));
  
  if (limit) {
    query = query.limit(limit) as any;
  }
  
  return query;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result[0];
}

export async function getAllVideos(limit?: number): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(videos).orderBy(desc(videos.publishedAt));
  
  if (limit) {
    query = query.limit(limit) as any;
  }
  
  return query;
}

export async function getAllPhotoAlbums(): Promise<PhotoAlbum[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(photoAlbums).orderBy(desc(photoAlbums.createdAt));
}

export async function getPhotosByAlbumId(albumId: number): Promise<Photo[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(photos)
    .where(eq(photos.albumId, albumId))
    .orderBy(photos.order);
}

export async function incrementBlogViews(postId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(blogPosts)
    .set({ views: sql`${blogPosts.views} + 1` })
    .where(eq(blogPosts.id, postId));
}

export async function getApprovedComments(postId: number): Promise<typeof comments.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.status, "approved")))
    .orderBy(desc(comments.createdAt));
}
