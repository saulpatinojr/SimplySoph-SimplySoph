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
  Camera,
  Save,
  Upload,
  Sparkles,
  Calendar,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  fetchVideoById,
  saveVideo,
  type VideoInput,
  type ContentProduct,
  type ContentRelatedLink,
  fetchCategories,
  saveScheduledPost,
} from "@/lib/content";
import { getEditorSaveGuard } from "@/lib/contentMetadataValidation";
import FeaturedProductsEditor from "@/components/admin/FeaturedProductsEditor";
import RelatedLinksEditor from "@/components/admin/RelatedLinksEditor";
import EditorQaSummary from "@/components/admin/EditorQaSummary";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateCaption } from "@/lib/ai";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function VideoEdit() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, editParams] = useRoute("/admin/video/edit/:id");
  const [isNewRoute] = useRoute("/admin/video/new");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const videoId = isNewRoute ? undefined : editParams?.id;
  const isEditing = Boolean(videoId);

  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => (videoId ? fetchVideoById(videoId) : Promise.resolve(null)),
    enabled: isAuthenticated && Boolean(videoId),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: isAuthenticated,
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [disclosureText, setDisclosureText] = useState("");
  const [thumbnailAlt, setThumbnailAlt] = useState("");
  const [cityGuideNotesRaw, setCityGuideNotesRaw] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<ContentProduct[]>(
    []
  );
  const [relatedLinks, setRelatedLinks] = useState<ContentRelatedLink[]>([]);
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);

  useEffect(() => {
    if (!video) return;
    setTitle(video.title ?? "");
    setSlug(video.slug ?? "");
    setDescription(video.description ?? "");
    setVideoUrl(video.videoUrl ?? "");
    setThumbnailUrl(video.thumbnailUrl ?? "");
    setCategoryId(video.categoryId ?? "");
    setTags((video.tags ?? []).join(", "));
    setSeoTitle(video.seoTitle ?? "");
    setSeoDescription(video.seoDescription ?? "");
    setCanonicalUrl(video.canonicalUrl ?? "");
    setDisclosureText(video.disclosureText ?? "");
    setThumbnailAlt(video.thumbnailAlt ?? "");
    setCityGuideNotesRaw((video.cityGuideNotes ?? []).join("\n"));
    setFeaturedProducts(video.featuredProducts ?? []);
    setRelatedLinks(video.relatedLinks ?? []);
    setPublishAt(
      video.publishAt ? new Date(video.publishAt).toISOString().slice(0, 16) : ""
    );
  }, [video]);

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean),
    [tags]
  );

  const publishQa = useMemo(
    () =>
      getEditorSaveGuard({
        intent: "published",
        canonicalUrl,
        disclosureText,
        thumbnailUrl,
        thumbnailAlt,
        featuredProducts,
        relatedLinks,
      }),
    [
      canonicalUrl,
      disclosureText,
      thumbnailUrl,
      thumbnailAlt,
      featuredProducts,
      relatedLinks,
    ]
  );

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing) {
      setSlug(generateSlug(value));
    }
  };

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        e.target.value = "";
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 100MB.`);
        e.target.value = "";
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
        e.target.value = "";
      }
    },
    []
  );

  if (authLoading || videoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to={LOGIN_PATH} />;
  }

  async function handleGenerateCaption() {
    if (!title.trim() && !description.trim()) {
      toast.error("Add a title or description first.");
      return;
    }
    setCaptionLoading(true);
    try {
      const result = await generateCaption({
        title,
        description,
        platform: "video",
      });
      setSeoTitle(result.title || seoTitle);
      setSeoDescription(result.description || seoDescription);
      toast.success("SEO copy refreshed");
    } catch (error) {
      console.error(error);
      toast.error("Could not generate SEO copy");
    } finally {
      setCaptionLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !slug.trim() || !videoUrl.trim()) {
      toast.error("Title, slug, and video URL are required.");
      return;
    }

    const saveGuard = getEditorSaveGuard({
      intent: "published",
      canonicalUrl,
      disclosureText,
      thumbnailUrl,
      thumbnailAlt,
      featuredProducts,
      relatedLinks,
    });
    if (saveGuard.shouldBlockSave) {
      toast.error(
        saveGuard.firstIssue ||
          `Fix ${saveGuard.totalIssues} metadata validation issue(s).`
      );
      return;
    }

    setSaving(true);
    try {
      const payload: VideoInput = {
        cityGuideNotes: cityGuideNotesRaw
          .split("\n")
          .map(note => note.trim())
          .filter(Boolean),
        featuredProducts,
        relatedLinks,
        title,
        slug,
        videoUrl,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        categoryId: categoryId || undefined,
        tags: tagList,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        canonicalUrl: canonicalUrl || undefined,
        disclosureText: disclosureText || undefined,
        thumbnailAlt: thumbnailAlt || undefined,
        publishAt: publishAt ? new Date(publishAt) : undefined,
        authorId: video?.authorId ?? user?.uid ?? "anonymous",
      };
      const id = await saveVideo(payload, videoId);
      toast.success(isEditing ? "Video updated" : "Video created");
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      navigate(`/admin/video/edit/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save video");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateScheduledPost() {
    try {
      await saveScheduledPost({
        title: title || "Untitled video",
        type: "video",
        publishAt: publishAt ? new Date(publishAt) : new Date(),
      });
      toast.success("Scheduled post saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save scheduled post");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/video"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to videos
        </Link>
        <span className="text-sm text-muted-foreground">
          {isEditing ? "Edit video" : "New video"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {isEditing ? "Edit video" : "Create video"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Keep the editorial tone sharp, the metadata current, and the
              publishing workflow predictable.
            </p>
          </div>

          <EditorQaSummary title="Publish QA" issues={publishQa.issues} />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Enter a video title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Write a short description"
                rows={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    accept="video/*"
                    title="Upload Video"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    id="video-upload"
                  />
                  <input
                    type="file"
                    accept="video/*"
                    capture="environment"
                    title="Record Video"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    id="video-capture"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={uploading}
                    asChild
                  >
                    <Label htmlFor="video-upload" className="cursor-pointer">
                      <Upload size={16} />
                      {uploading ? "Uploading..." : "Choose Video"}
                    </Label>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={uploading}
                    asChild
                  >
                    <Label htmlFor="video-capture" className="cursor-pointer">
                      <Camera size={16} />
                      Record Video
                    </Label>
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
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnailAlt">Thumbnail Alt Text</Label>
              <Input
                id="thumbnailAlt"
                value={thumbnailAlt}
                onChange={e => setThumbnailAlt(e.target.value)}
                placeholder="Describe the thumbnail image"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Uncategorized</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="fashion, tutorial, haul"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="publishAt">Publish at</Label>
              <Input
                id="publishAt"
                type="datetime-local"
                value={publishAt}
                onChange={e => setPublishAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                placeholder="Search-friendly title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea
                id="seoDescription"
                value={seoDescription}
                onChange={e => setSeoDescription(e.target.value)}
                rows={3}
                placeholder="Search-friendly description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input
                id="canonicalUrl"
                value={canonicalUrl}
                onChange={e => setCanonicalUrl(e.target.value)}
                placeholder="https://simplysoph.com/videos/your-video"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disclosureText">Disclosure</Label>
              <Textarea
                id="disclosureText"
                value={disclosureText}
                onChange={e => setDisclosureText(e.target.value)}
                rows={3}
                placeholder="Example: This video contains sponsored product links."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cityGuideNotes">City guide notes (one line per note)</Label>
              <Textarea
                id="cityGuideNotes"
                value={cityGuideNotesRaw}
                onChange={e => setCityGuideNotesRaw(e.target.value)}
                rows={4}
                placeholder={"Metro closes early in this area\nBest light for filming is 5-7pm"}
              />
            </div>
            <div className="grid gap-2">
              <FeaturedProductsEditor
                value={featuredProducts}
                onChange={setFeaturedProducts}
                title="Featured products"
                compact
              />
            </div>
            <div className="grid gap-2">
              <RelatedLinksEditor
                value={relatedLinks}
                onChange={setRelatedLinks}
                title="Related links"
                compact
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleGenerateCaption}
              disabled={captionLoading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {captionLoading ? "Generating..." : "Refresh SEO copy"}
            </Button>
            <Button variant="outline" onClick={handleGenerateScheduledPost}>
              <Calendar className="mr-2 h-4 w-4" /> Save schedule
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save video"}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" /> Quick checks
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Keep the title concise enough for share cards.</li>
              <li>Use tags sparingly, focusing on discoverability.</li>
              <li>SEO fields should mirror the public description.</li>
            </ul>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-medium">Publishing status</div>
            <p className="mt-2 text-sm text-muted-foreground">
              {publishAt
                ? `Scheduled for ${new Date(publishAt).toLocaleString()}`
                : "No publish date set."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
