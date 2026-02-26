import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Redirect, useRoute, useLocation } from "wouter";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useEffect, useState, Suspense, lazy, useCallback } from "react";
import {
  fetchBlogPostById,
  saveBlogPost,
  type BlogPostInput,
  fetchCategories,
} from "@/lib/content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { optimizeImage } from "@/lib/utils";

const RichTextEditor = lazy(() => import("@/components/RichTextEditor").then(module => ({ default: module.RichTextEditor })));

export default function AdminBlogEdit() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, params] = useRoute("/admin/blog/edit/:id");
  const [, setLocation] = useLocation();
  const postId = params?.id ?? null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: existingPost,
    isLoading: postLoading,
  } = useQuery({
    queryKey: ["admin", "post", postId],
    queryFn: () => fetchBlogPostById(postId!),
    enabled: isAuthenticated && user?.role === "admin" && Boolean(postId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin", "categories", "blog"],
    queryFn: () => fetchCategories("blog"),
    enabled: isAuthenticated && user?.role === "admin",
  });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setExcerpt(existingPost.excerpt || "");
      setContent(existingPost.content);
      setCoverImage(existingPost.coverImage || "");
      setStatus(existingPost.status);
      setCategoryId(existingPost.categoryId || "");
    }
  }, [existingPost]);

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: BlogPostInput; id?: string }) =>
      saveBlogPost(data, id),
    onSuccess: (_, variables) => {
      const message = variables.id ? "Post updated successfully" : "Post created successfully";
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      void queryClient.invalidateQueries({ queryKey: ["blog", "list"] });
      setLocation("/admin/blog");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save post: ${message}`);
    },
  });

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File too large (max 10MB)");
    }

    const storage = getFirebaseStorage();
    const baseFileName = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}`;
    let blobToUpload = file;
    let fileName = `blog/${baseFileName}.webp`;

    try {
      // Try to optimize, fall back to original if it fails
      try {
        const optimized = await optimizeImage(file);
        blobToUpload = optimized.original as File; // Use the optimized original (WebP)
      } catch (e) {
        console.warn("Image optimization failed, using original", e);
        fileName = `blog/${baseFileName}-${file.name}`;
      }

      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, blobToUpload);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  }, []);

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverImage(url);
      toast.success("Cover image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleEditorImageUpload = useCallback(async (file: File) => {
    try {
      const url = await uploadImage(file);
      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
      throw error;
    }
  }, [uploadImage]);

  if (authLoading || (postId && postLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Redirect to={LOGIN_PATH} />;
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!postId) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = (e: React.FormEvent, newStatus: "draft" | "published") => {
    e.preventDefault();

    try {
      if (!title.trim() || !slug.trim() || !content.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }

      const postData: BlogPostInput = {
        title,
        slug,
        excerpt: excerpt || undefined,
        content,
        coverImage: coverImage || undefined,
        status: newStatus,
        categoryId: categoryId || undefined,
        authorId:
          postId && existingPost
            ? existingPost.authorId
            : user?.id ?? "anonymous",
      };

      saveMutation.mutate({ data: postData, id: postId ?? undefined });
    } catch (err) {
      console.error('Form submission error:', err);
      toast.error('An error occurred while submitting the form');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/blog">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={16} /> Back
                </Button>
              </Link>
              <h1 className="text-2xl font-heading font-bold">
                {postId ? "Edit Post" : "New Post"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={saveMutation.isPending}
              >
                Save Draft
              </Button>
              <Button
                onClick={(e) => handleSubmit(e, "published")}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                <Save size={16} /> Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        <Card className="p-8">
          <form className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter post title"
                className="text-lg"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-url-slug"
              />
              <p className="text-xs text-muted-foreground">
                URL: /blog/{slug || "post-slug"}
              </p>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description for post preview"
                rows={3}
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      id="cover-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      disabled={isUploading}
                    />
                    <Label htmlFor="cover-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 cursor-pointer"
                        asChild
                        disabled={isUploading}
                      >
                        <span>
                          <Upload size={16} />
                          {isUploading ? "Uploading..." : "Upload"}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {coverImage && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted max-w-md border">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setCoverImage("")}
                      type="button"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Suspense fallback={
                <div className="min-h-75 border border-dashed border-muted-foreground/25 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading editor...</p>
                  </div>
                </div>
              }>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your post content here..."
                  onImageUpload={handleEditorImageUpload}
                />
              </Suspense>
              <p className="text-xs text-muted-foreground">
                Rich text editor with formatting, images, videos, and links. Use the toolbar above to style your content.
              </p>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
