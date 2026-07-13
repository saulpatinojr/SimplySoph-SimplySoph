import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, Redirect, useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Wand2,
  Sparkles,
  RefreshCw,
  Tag,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useEffect, useState, Suspense, lazy, useCallback } from "react";
import {
  fetchBlogPostById,
  saveBlogPost,
  type BlogPostInput,
  type ContentProduct,
  type ContentRelatedLink,
  fetchCategories,
  aiService,
} from "@/lib/content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { optimizeImage } from "@/lib/utils";
import { SyndicationPanel } from "@/components/admin/SyndicationPanel";
import DashboardLayout from "@/components/DashboardLayout";

const RichTextEditor = lazy(() =>
  import("@/components/RichTextEditor").then(module => ({
    default: module.RichTextEditor,
  }))
);

function parseJsonArray<T>(raw: string): T[] {
  const value = raw.trim();
  if (!value) return [];
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

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
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft"
  );
  const [categoryId, setCategoryId] = useState<string>("none");
  const [tags, setTags] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [cityGuideNotesRaw, setCityGuideNotesRaw] = useState("");
  const [featuredProductsRaw, setFeaturedProductsRaw] = useState("");
  const [relatedLinksRaw, setRelatedLinksRaw] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [titleVariants, setTitleVariants] = useState<string[]>([]);
  const [aiPrediction, setAiPrediction] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: existingPost, isLoading: postLoading } = useQuery({
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
      setCategoryId(existingPost.categoryId || "none");
      setTags(existingPost.tags || []);
      setSeoTitle(existingPost.seoTitle || "");
      setSeoDescription(existingPost.seoDescription || "");
      setCityGuideNotesRaw((existingPost.cityGuideNotes || []).join("\n"));
      setFeaturedProductsRaw(
        JSON.stringify(existingPost.featuredProducts || [], null, 2)
      );
      setRelatedLinksRaw(JSON.stringify(existingPost.relatedLinks || [], null, 2));
    }
  }, [existingPost]);

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: BlogPostInput; id?: string }) =>
      saveBlogPost(data, id),
    onSuccess: (_, variables) => {
      const message = variables.id
        ? "Post updated successfully"
        : "Post created successfully";
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

  const handleCoverImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const handleEditorImageUpload = useCallback(
    async (file: File) => {
      try {
        const url = await uploadImage(file);
        return url;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(message);
        throw error;
      }
    },
    [uploadImage]
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (content.length > 50) {
        setIsPredicting(true);
        try {
          const prediction = await aiService.predictPerformance(
            content,
            title,
            tags
          );
          setAiPrediction(prediction);
        } catch (err) {
          // silent
        } finally {
          setIsPredicting(false);
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, title, tags]);

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

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to={LOGIN_PATH} />;
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!postId) {
      setSlug(generateSlug(value));
    }
  };

  const generateTitleWithAI = async () => {
    if (!title && !content) {
      toast.error("Please provide some title or content to generate ideas.");
      return;
    }
    setIsGeneratingTitle(true);
    try {
      const variants = await aiService.generateTitleIdeas(title || content);
      setTitleVariants(variants);
      toast.success("Generated title ideas!");
    } catch (err) {
      toast.error("Failed to generate titles");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const generateAbVariantsForTitle = async () => {
    if (!title) {
      toast.error("Please enter a base title first.");
      return;
    }
    setIsGeneratingTitle(true);
    try {
      const variants = await aiService.generateAbVariants(title);
      setTitleVariants(variants);
      toast.success("Generated A/B variants!");
    } catch (err) {
      toast.error("Failed to generate A/B variants");
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const generateTagsWithAI = async () => {
    if (!content) {
      toast.error("Please write some content to generate tags.");
      return;
    }
    setIsGeneratingTags(true);
    try {
      const aiTags = await aiService.generateTags(content);
      const mergedTags = Array.from(new Set([...tags, ...aiTags]));
      setTags(mergedTags.slice(0, 10)); // max 10 tags
      toast.success("Auto-tagged successfully!");
    } catch (err) {
      toast.error("Failed to generate tags");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const generateSeoWithAI = async () => {
    if (!content) {
      toast.error("Please write some content to generate SEO metadata.");
      return;
    }
    setIsGeneratingSeo(true);
    try {
      const meta = await aiService.generateSeoMeta(content);
      setSeoTitle(meta.metaTitle);
      setSeoDescription(meta.metaDescription);
      toast.success("SEO metadata generated!");
    } catch (err) {
      toast.error("Failed to generate SEO");
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleSubmit = (
    e: React.FormEvent,
    newStatus: "draft" | "published"
  ) => {
    e.preventDefault();

    try {
      if (!title.trim() || !slug.trim() || !content.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }

      const postData: BlogPostInput = {
        cityGuideNotes: cityGuideNotesRaw
          .split("\n")
          .map(note => note.trim())
          .filter(Boolean),
        featuredProducts: parseJsonArray<ContentProduct>(featuredProductsRaw),
        relatedLinks: parseJsonArray<ContentRelatedLink>(relatedLinksRaw),
        title,
        slug,
        excerpt: excerpt || undefined,
        content,
        coverImage: coverImage || undefined,
        status: newStatus,
        categoryId: categoryId === "none" ? undefined : categoryId,
        tags: tags.length > 0 ? tags : undefined,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        authorId:
          postId && existingPost
            ? existingPost.authorId
            : (user?.uid ?? "anonymous"),
      };

      saveMutation.mutate({ data: postData, id: postId ?? undefined });
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error("An error occurred while submitting the form");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      

      {/* Main Content */}
      <div>
        {/* Performance Overview AI Card */}
        {aiPrediction && (
          <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center justify-center p-4 bg-background rounded-full border border-primary/20 shadow-sm h-24 w-24 shrink-0">
                <Gauge size={24} className="text-primary mb-1" />
                <span className="text-2xl font-bold text-primary">
                  {aiPrediction.score}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Score
                </span>
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    AI Performance Prediction
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Based on your current content, title, and tags.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-background rounded p-2 border">
                    <span className="block text-xs text-muted-foreground mb-1">
                      Title Strength
                    </span>
                    <span className="capitalize font-medium">
                      {aiPrediction.factors.titleStrength}
                    </span>
                  </div>
                  <div className="bg-background rounded p-2 border">
                    <span className="block text-xs text-muted-foreground mb-1">
                      Readability
                    </span>
                    <span className="capitalize font-medium">
                      {aiPrediction.factors.readability}
                    </span>
                  </div>
                  <div className="bg-background rounded p-2 border">
                    <span className="block text-xs text-muted-foreground mb-1">
                      Engagement
                    </span>
                    <span className="capitalize font-medium">
                      {aiPrediction.factors.engagementPotential}
                    </span>
                  </div>
                </div>

                {aiPrediction.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Suggestions
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      {aiPrediction.suggestions.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-8">
          <form className="space-y-6">
            {/* Title */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Title *</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateTitleWithAI}
                      disabled={isGeneratingTitle}
                      size="sm"
                      className="gap-2 h-8"
                    >
                      <Sparkles size={14} className="text-primary" />
                      Ideas
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateAbVariantsForTitle}
                      disabled={isGeneratingTitle || !title}
                      size="sm"
                      className="gap-2 h-8"
                    >
                      <Wand2 size={14} className="text-primary" />
                      A/B Variants
                    </Button>
                  </div>
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Enter post title"
                  className="text-lg"
                />
              </div>

              {titleVariants.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-4 space-y-3 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Sparkles size={14} className="text-primary" />
                      AI Title Suggestions
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setTitleVariants([])}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {titleVariants.map((variant, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          handleTitleChange(
                            variant.replace(/^\[Variation [A-Z]\] /, "")
                          );
                          setTitleVariants([]);
                        }}
                        className="text-left text-sm p-2 hover:bg-background rounded transition-colors border border-transparent hover:border-border"
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={e => setSlug(e.target.value)}
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
                onChange={e => setExcerpt(e.target.value)}
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
                    onChange={e => setCoverImage(e.target.value)}
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
                      title="Upload cover image"
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
                  <SelectItem value="none">No category</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label>Tags</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateTagsWithAI}
                  disabled={isGeneratingTags || !content}
                  size="sm"
                  className="gap-2 h-8"
                >
                  <Tag size={14} className="text-primary" />
                  Auto-Tag
                </Button>
              </div>
              <Input
                value={tags.join(", ")}
                onChange={e =>
                  setTags(
                    e.target.value
                      .split(",")
                      .map(t => t.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="fashion, style, spring..."
              />
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span
                    key={i}
                    className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        setTags(tags.filter((_, idx) => idx !== i))
                      }
                      className="hover:text-primary/70"
                      title={`Remove tag ${t}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Suspense
                fallback={
                  <div className="min-h-75 border border-dashed border-muted-foreground/25 rounded-md flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading editor...
                      </p>
                    </div>
                  </div>
                }
              >
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your post content here..."
                  onImageUpload={handleEditorImageUpload}
                />
              </Suspense>
              <p className="text-xs text-muted-foreground">
                Rich text editor with formatting, images, videos, and links. Use
                the toolbar above to style your content.
              </p>
            </div>

            {/* SEO */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">SEO Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Optimize how this post appears in search engines.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSeoWithAI}
                  disabled={isGeneratingSeo || !content}
                  size="sm"
                  className="gap-2 h-8"
                >
                  <Sparkles size={14} className="text-primary" />
                  Generate AI SEO
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoTitle">Meta Title</Label>
                <Input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder="Optimized title for search engines"
                  maxLength={60}
                />
                <span className="text-xs text-muted-foreground flex justify-end">
                  {seoTitle.length || 0}/60
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">Meta Description</Label>
                <Textarea
                  id="seoDescription"
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  placeholder="Brief description for search results"
                  rows={3}
                  maxLength={160}
                />
                <span className="text-xs text-muted-foreground flex justify-end">
                  {seoDescription.length || 0}/160
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border">
              <div>
                <h3 className="text-lg font-medium">Growth and City Guide</h3>
                <p className="text-sm text-muted-foreground">
                  Add relationship and commerce metadata to connect this post with destinations, videos, galleries, and products.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cityGuideNotes">City Guide Notes (one line per note)</Label>
                <Textarea
                  id="cityGuideNotes"
                  value={cityGuideNotesRaw}
                  onChange={e => setCityGuideNotesRaw(e.target.value)}
                  rows={4}
                  placeholder={"Book dinner reservations early\nUse ride-share after 10pm"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featuredProducts">Featured Products (JSON array)</Label>
                <Textarea
                  id="featuredProducts"
                  value={featuredProductsRaw}
                  onChange={e => setFeaturedProductsRaw(e.target.value)}
                  rows={7}
                  placeholder='[{"id":"prod-1","name":"Linen Set","brand":"SimplySoph","imageUrl":"https://...","productUrl":"https://..."}]'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relatedLinks">Related Links (JSON array)</Label>
                <Textarea
                  id="relatedLinks"
                  value={relatedLinksRaw}
                  onChange={e => setRelatedLinksRaw(e.target.value)}
                  rows={7}
                  placeholder='[{"id":"rel-1","type":"destination","title":"Lisbon Guide","url":"/passport/lisbon"}]'
                />
              </div>
            </div>

            <SyndicationPanel title={title} content={content} />
          </form>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
}
