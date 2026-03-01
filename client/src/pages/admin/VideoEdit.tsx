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
  Sparkles,
  Calendar,
  Plus,
  Wand2,
  Tag,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useEffect, useState, useCallback } from "react";
import {
  fetchVideoById,
  saveVideo,
  type VideoInput,
  fetchCategories,
  saveScheduledPost,
} from "@/lib/content";
import {
  fetchDestinationById,
  updateDestination,
  type DestinationMediaItem,
} from "@/lib/services/destination";
import DestinationSelector from "@/components/admin/DestinationSelector";
import PassportMediaForm from "@/components/admin/PassportMediaForm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateCaption } from "@/lib/ai";
import { aiService } from "@/lib/services/ai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminVideoEdit() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, params] = useRoute("/admin/video/edit/:id");
  const [, setLocation] = useLocation();
  const videoId = params?.id ?? null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  // Repurposing state
  const [isRepurposeOpen, setIsRepurposeOpen] = useState(false);
  const [targetPlatform, setTargetPlatform] =
    useState<string>("youtube_shorts");
  const [aiCaption, setAiCaption] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Content location state
  const [contentLocation, setContentLocation] = useState<"videos" | "passport">(
    "videos"
  );
  const [selectedDestinationId, setSelectedDestinationId] =
    useState<string>("none");
  const [passportSaving, setPassportSaving] = useState(false);

  const queryClient = useQueryClient();

  const { data: existingVideo, isLoading: videoLoading } = useQuery({
    queryKey: ["admin", "video", videoId],
    queryFn: () => fetchVideoById(videoId!),
    enabled: isAuthenticated && user?.role === "admin" && Boolean(videoId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin", "categories", "video"],
    queryFn: () => fetchCategories("video"),
    enabled: isAuthenticated && user?.role === "admin",
  });

  useEffect(() => {
    if (existingVideo) {
      setTitle(existingVideo.title);
      setSlug(existingVideo.slug);
      setDescription(existingVideo.description || "");
      setVideoUrl(existingVideo.videoUrl);
      setThumbnailUrl(existingVideo.thumbnailUrl || "");
      setCategoryId(existingVideo.categoryId || "none");
      setTags(existingVideo.tags || []);
      setSeoTitle(existingVideo.seoTitle || "");
      setSeoDescription(existingVideo.seoDescription || "");
    }
  }, [existingVideo]);

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: VideoInput; id?: string }) =>
      saveVideo(data, id),
    onSuccess: (_, variables) => {
      const message = variables.id
        ? "Video updated successfully"
        : "Video created successfully";
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "videos"] });
      void queryClient.invalidateQueries({ queryKey: ["videos", "list"] });
      setLocation("/admin/video");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save video: ${message}`);
    },
  });

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        toast.error(`${file.name} is too large. Maximum size is 100MB.`);
        return;
      }

      setUploading(true);
      try {
        const storage = getFirebaseStorage();
        const fileName = `videos/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        setVideoUrl(url);
        toast.success("Video uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload video");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const handleGenerateCaption = async () => {
    setIsGeneratingAi(true);
    try {
      const caption = await generateCaption(
        targetPlatform as any,
        description || title,
        [title, categoryId || "fashion"]
      );
      setAiCaption(caption);
    } catch (error) {
      toast.error("Failed to generate caption");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleScheduleRepurpose = async () => {
    try {
      await saveScheduledPost({
        contentId: videoId || undefined,
        platform: targetPlatform as any,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        caption: aiCaption,
        mediaUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        status: "scheduled",
      });
      toast.success("Content scheduled for repurposing!");
      setIsRepurposeOpen(false);
    } catch (error) {
      toast.error("Failed to schedule content");
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!videoId) {
      setSlug(generateSlug(value));
    }
  };

  const handleGenerateDescription = async () => {
    if (!title) {
      toast.error("Please enter a title first to generate a description");
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const generatedDesc = await aiService.generateVideoDescription(title);
      setDescription(generatedDesc);
      toast.success("Description generated successfully");
    } catch (error) {
      toast.error("Failed to generate description");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleGenerateTags = async () => {
    const contentToAnalyze = description || title;
    if (!contentToAnalyze) {
      toast.error("Please enter a title or description first");
      return;
    }
    setIsGeneratingTags(true);
    try {
      const suggestedTags = await aiService.generateTags(contentToAnalyze);
      const newTagsList = Array.from(
        new Set([...tags, ...suggestedTags])
      ).slice(0, 10);
      setTags(newTagsList);
      toast.success("Tags generated successfully");
    } catch (error) {
      toast.error("Failed to generate AI tags");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleGenerateSeo = async () => {
    if (!title && !description) {
      toast.error("Please add a title and description first");
      return;
    }
    setIsGeneratingSeo(true);
    try {
      const seo = await aiService.generateSeoMeta(description || title);
      setSeoTitle(seo.metaTitle);
      setSeoDescription(seo.metaDescription);
      toast.success("SEO metadata generated successfully");
    } catch (error) {
      toast.error("Failed to generate SEO metadata");
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!title.trim() || !slug.trim() || !videoUrl.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }

      const videoData: VideoInput = {
        title,
        slug,
        description: description || undefined,
        videoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        categoryId: categoryId === "none" ? undefined : categoryId,
        tags,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        authorId:
          videoId && existingVideo
            ? existingVideo.authorId
            : (user?.uid ?? "anonymous"),
      };

      saveMutation.mutate({ data: videoData, id: videoId ?? undefined });
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error("An error occurred while submitting the form");
    }
  };

  const handlePassportSave = async (item: DestinationMediaItem) => {
    if (
      selectedDestinationId === "none" ||
      selectedDestinationId === "__new__"
    ) {
      toast.error("Please select a destination first");
      return;
    }

    setPassportSaving(true);
    try {
      const destination = await fetchDestinationById(selectedDestinationId);
      if (!destination) {
        toast.error("Destination not found");
        return;
      }

      const updatedMediaItems = [...(destination.mediaItems || []), item];
      await updateDestination(selectedDestinationId, {
        mediaItems: updatedMediaItems,
      });

      toast.success("Video added to destination!");
      queryClient.invalidateQueries({ queryKey: ["admin", "destinations"] });
      setLocation("/admin/destinations");
    } catch (error) {
      console.error("Error saving to destination:", error);
      toast.error("Failed to add video to destination");
    } finally {
      setPassportSaving(false);
    }
  };

  const handleDestinationChange = (value: string) => {
    if (value === "__new__") {
      setLocation("/admin/destinations/new");
      return;
    }
    setSelectedDestinationId(value);
  };

  if (authLoading || (videoId && videoLoading)) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/video">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={16} /> Back
                </Button>
              </Link>
              <h1 className="text-2xl font-heading font-bold">
                {videoId ? "Edit Video" : "New Video Content"}
              </h1>
            </div>
            {contentLocation === "videos" && (
              <div className="flex items-center gap-2">
                {videoId && (
                  <Dialog
                    open={isRepurposeOpen}
                    onOpenChange={setIsRepurposeOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                      >
                        <Sparkles size={16} /> Repurpose
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Repurpose Content</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Target Platform</Label>
                          <Select
                            value={targetPlatform}
                            onValueChange={setTargetPlatform}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="youtube_shorts">
                                YouTube Shorts
                              </SelectItem>
                              <SelectItem value="instagram_reel">
                                Instagram Reel
                              </SelectItem>
                              <SelectItem value="tiktok">TikTok</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>AI Caption Generator</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleGenerateCaption}
                              disabled={isGeneratingAi}
                              variant="secondary"
                            >
                              {isGeneratingAi
                                ? "Generating..."
                                : "Generate Caption"}
                            </Button>
                          </div>
                          <Textarea
                            value={aiCaption}
                            onChange={e => setAiCaption(e.target.value)}
                            placeholder="Generated caption will appear here..."
                            rows={5}
                          />
                        </div>
                        <Button
                          onClick={handleScheduleRepurpose}
                          className="w-full gap-2"
                        >
                          <Calendar size={16} /> Schedule Draft
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                >
                  <Save size={16} /> Save Video
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        {/* Content Location Selector */}
        {!videoId && (
          <Card className="p-6 mb-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Content Location
              </Label>
              <p className="text-sm text-muted-foreground">
                Where should this video content be published?
              </p>
              <Select
                value={contentLocation}
                onValueChange={v =>
                  setContentLocation(v as "videos" | "passport")
                }
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="videos">
                    🎬 Videos — video gallery
                  </SelectItem>
                  <SelectItem value="passport">
                    🛂 Passport / Destination — travel page
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* Passport Mode */}
        {contentLocation === "passport" && !videoId && (
          <div className="space-y-6">
            <Card className="p-6">
              <DestinationSelector
                value={selectedDestinationId}
                onChange={handleDestinationChange}
                onCreateNew={() => setLocation("/admin/destinations/new")}
              />
            </Card>

            {selectedDestinationId !== "none" &&
              selectedDestinationId !== "__new__" && (
                <PassportMediaForm
                  mediaType="video"
                  onSave={handlePassportSave}
                  saving={passportSaving}
                />
              )}
          </div>
        )}

        {/* Videos Mode (standard) */}
        {(contentLocation === "videos" || videoId) && (
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Enter video title"
                  className="text-lg"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="video-url-slug"
                />
                <p className="text-xs text-muted-foreground">
                  URL: /videos/{slug || "video-slug"}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">
                    Description (YouTube / Vimeo)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDesc || !title}
                    className="gap-2 h-8 text-xs border-purple-500 text-purple-600 hover:bg-purple-50"
                  >
                    {isGeneratingDesc ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    AI Description
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed description for your video..."
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>

              {/* Video URL */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      title="Upload Video"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                    >
                      <Upload size={16} />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports direct video URLs or embedded video platforms. Upload
                  max 100MB.
                </p>
                {uploading && (
                  <p className="text-sm text-blue-500">Uploading video...</p>
                )}
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail Image URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
                {thumbnailUrl && (
                  <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-muted max-w-sm">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
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

              {/* Tags Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Video Tags</h3>
                    <p className="text-sm text-muted-foreground">
                      Used for internal search and YouTube metadata.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateTags}
                    disabled={isGeneratingTags || (!title && !description)}
                    className="gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                  >
                    {isGeneratingTags ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                    Auto-Tag
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Type a tag and press Enter"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {tags.map(tag => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Search Engine Optimization
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      How this video appears in Google search results.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSeo}
                    disabled={isGeneratingSeo || (!title && !description)}
                    className="gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                  >
                    {isGeneratingSeo ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate AI SEO
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seoTitle">Meta Title</Label>
                      <span className="text-xs text-muted-foreground">
                        {seoTitle.length}/60
                      </span>
                    </div>
                    <Input
                      id="seoTitle"
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      placeholder="SEO Title (defaults to video title)"
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seoDescription">Meta Description</Label>
                      <span className="text-xs text-muted-foreground">
                        {seoDescription.length}/160
                      </span>
                    </div>
                    <Textarea
                      id="seoDescription"
                      value={seoDescription}
                      onChange={e => setSeoDescription(e.target.value)}
                      placeholder="Brief description for search results"
                      rows={2}
                      maxLength={160}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="gap-2"
                >
                  <Save size={16} />
                  {saveMutation.isPending ? "Saving..." : "Save Video"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
