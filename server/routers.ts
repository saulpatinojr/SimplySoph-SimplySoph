import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";

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
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      if (ctx.user) {
        await sdk.revokeUserSessions(ctx.user.id);
      }
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
      .input(z.object({ postId: z.string() }))
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
      .input(z.object({ albumId: z.string() }))
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
        categoryId: z.string().optional(),
        status: z.enum(["draft", "published"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createBlogPost } = await import("./db");
        const id = await createBlogPost({
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt,
          content: input.content,
          coverImage: input.coverImage,
          categoryId: input.categoryId,
          status: input.status,
          authorId: ctx.user.id,
        });
        return { success: true, id };
      }),

    updatePost: adminProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
        categoryId: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateBlogPost } = await import("./db");
        const { id, ...updates } = input;
        await updateBlogPost(id, updates);
        return { success: true };
      }),

    deletePost: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { deleteBlogPost } = await import("./db");
        await deleteBlogPost(input.id);
        return { success: true };
      }),

    // Get all posts (including drafts)
    allPosts: adminProcedure.query(async () => {
      const { getAllBlogPosts } = await import("./db");
      return getAllBlogPosts();
    }),

    // Video management
    createVideo: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        categoryId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createVideo } = await import("./db");
        const id = await createVideo({
          title: input.title,
          slug: input.slug,
          description: input.description,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
          categoryId: input.categoryId,
          authorId: ctx.user.id,
        });
        return { success: true, id };
      }),

    // Photo album management
    createAlbum: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        categoryId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createPhotoAlbum } = await import("./db");
        const id = await createPhotoAlbum({
          title: input.title,
          slug: input.slug,
          description: input.description,
          coverImage: input.coverImage,
          categoryId: input.categoryId,
          authorId: ctx.user.id,
        });
        return { success: true, id };
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
