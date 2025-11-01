import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Public content routes
  blog: router({
    list: publicProcedure.query(async () => {
      const { getPublishedBlogPosts } = await import("./db");
      return getPublishedBlogPosts();
    }),
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const { getBlogPostBySlug, incrementBlogViews } = await import("./db");
        const post = await getBlogPostBySlug(input.slug);
        if (post) {
          await incrementBlogViews(post.id);
        }
        return post;
      }),
    comments: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        const { getApprovedComments } = await import("./db");
        return getApprovedComments(input.postId);
      }),
  }),
  
  video: router({
    list: publicProcedure.query(async () => {
      const { getAllVideos } = await import("./db");
      return getAllVideos();
    }),
  }),
  
  photo: router({
    albums: publicProcedure.query(async () => {
      const { getAllPhotoAlbums } = await import("./db");
      return getAllPhotoAlbums();
    }),
    byAlbum: publicProcedure
      .input(z.object({ albumId: z.number() }))
      .query(async ({ input }) => {
        const { getPhotosByAlbumId } = await import("./db");
        return getPhotosByAlbumId(input.albumId);
      }),
  }),
  
  category: router({
    list: publicProcedure
      .input(z.object({ type: z.enum(["blog", "video", "photo"]).optional() }).optional())
      .query(async ({ input }) => {
        const { getAllCategories } = await import("./db");
        return getAllCategories(input?.type);
      }),
  }),

  // Admin routes
  admin: router({
    // Blog management
    createPost: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        excerpt: z.string().optional(),
        content: z.string(),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(),
        status: z.enum(["draft", "published"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { blogPosts } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const result = await db.insert(blogPosts).values({
          ...input,
          authorId: ctx.user.id,
          publishedAt: input.status === "published" ? new Date() : null,
        });
        return { success: true, id: result[0].insertId };
      }),

    updatePost: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(),
        status: z.enum(["draft", "published"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { blogPosts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        const { id, ...updates } = input;
        const updateData: any = { ...updates };
        
        if (updates.status === "published") {
          updateData.publishedAt = new Date();
        }

        await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id));
        return { success: true };
      }),

    deletePost: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { blogPosts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
        return { success: true };
      }),

    // Get all posts (including drafts)
    allPosts: adminProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { blogPosts } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return [];
      
      return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    }),

    // Video management
    createVideo: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { videos } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const result = await db.insert(videos).values({
          ...input,
          authorId: ctx.user.id,
        });
        return { success: true, id: result[0].insertId };
      }),

    // Photo album management
    createAlbum: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { photoAlbums } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const result = await db.insert(photoAlbums).values({
          ...input,
          authorId: ctx.user.id,
        });
        return { success: true, id: result[0].insertId };
      }),

    // Upload handler
    getUploadUrl: adminProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        const fileKey = `${ctx.user.id}/${Date.now()}-${input.filename}`;
        // Return the key for client to use
        return { fileKey, contentType: input.contentType };
      }),
  }),
});

export type AppRouter = typeof appRouter;
