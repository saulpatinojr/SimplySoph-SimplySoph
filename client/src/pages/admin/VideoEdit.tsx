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
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useEffect, useMemo, useState, useCallback } from "react";
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

export default function VideoEdit() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, params] = useRoute("/admin/videos/:id");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const videoId = params?.id;
  const isEditing = Boolean(videoId);

  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => (videoId ? fetchVideoById(videoId) : Promise.resolve(null)),
    enabled: isAuthenticated && !!videoId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: isAuthenticated,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [copyHint, setCopyHint] = useState("");

  useEffect(() => {
    if (!video) return;
    setTitle(video.title ?? "");
    setDescription(video.description ?? "");
    setThumbnailUrl(video.thumbnailUrl ?? "");
    setCategoryId(video.categoryId ?? "");
    setTags((video.tags ?? []).join(", "));
    setSeoTitle(video.seoTitle ?? "");
    setSeoDescription(video.seoDescription ?? "");
    setPublishAt(video.publishAt ? new Date(video.publishAt).toISOString().slice(0, 16) : "");
  }, [video]);

  const tagList = useMemo(() => tags.split(",").map(tag => tag.trim()).filter(Boolean), [tags]);

  if (authLoading || videoLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
    setSaving(true);
    try {
      const payload: VideoInput = {
        title,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        categoryId: categoryId || undefined,
        tags: tagList,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        publishAt: publishAt ? new Date(publishAt) : undefined,
      };
      const id = await saveVideo(payload, videoId);
      toast.success(isEditing ? "Video updated" : "Video created");
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      navigate(`/admin/videos/${id}`);
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
        <Link href="/admin/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to videos
        </Link>
        <span className="text-sm text-muted-foreground">{isEditing ? "Edit video" : "New video"}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{isEditing ? "Edit video" : "Create video"}</h1>
            <p className="text-sm text-muted-foreground">Keep the editorial tone sharp, the metadata current, and the publishing workflow predictable.</p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a video title" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write a short description" rows={6} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input id="thumbnail" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Uncategorized</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fashion, tutorial, haul" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="publishAt">Publish at</Label>
              <Input id="publishAt" type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Search-friendly title" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea id="seoDescription" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} placeholder="Search-friendly description" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleGenerateCaption} disabled={captionLoading}>
              <Sparkles className="mr-2 h-4 w-4" /> {captionLoading ? "Generating..." : "Refresh SEO copy"}
            </Button>
            <Button variant="outline" onClick={handleGenerateScheduledPost}>
              <Calendar className="mr-2 h-4 w-4" /> Save schedule
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save video"}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-medium"><Info className="h-4 w-4" /> Quick checks</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Keep the title concise enough for share cards.</li>
              <li>Use tags sparingly, focusing on discoverability.</li>
              <li>SEO fields should mirror the public description.</li>
            </ul>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-medium">Publishing status</div>
            <p className="mt-2 text-sm text-muted-foreground">
              {publishAt ? `Scheduled for ${new Date(publishAt).toLocaleString()}` : "No publish date set."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
