import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseStorage } from "@/lib/firebase";
import {
  deleteMediaAsset,
  fetchAllBlogPosts,
  fetchAllDestinations,
  fetchMediaAssets,
  fetchVideos,
  placeMediaAsset,
  saveMediaAsset,
  type MediaAsset,
} from "@/lib/content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Link2, Trash2, Upload, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";

const SOURCE_OPTIONS = ["upload", "youtube", "instagram", "tiktok", "external"] as const;

function inferType(url: string): "image" | "video" {
  return /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url) ? "image" : "video";
}

export default function MediaLibrary() {
  const { user, loading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [source, setSource] = useState<(typeof SOURCE_OPTIONS)[number]>("upload");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("");
  const [targetKey, setTargetKey] = useState("home");

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["admin", "media-assets"],
    queryFn: fetchMediaAssets,
    enabled: isAuthenticated && user?.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMediaAsset,
    onSuccess: () => {
      toast.success("Media removed from the library");
      void queryClient.invalidateQueries({ queryKey: ["admin", "media-assets"] });
    },
    onError: () => toast.error("Could not remove this media item"),
  });

  const filteredAssets = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return assets;
    return assets.filter(asset =>
      [asset.title, asset.source, ...asset.tags].some(value => value.toLowerCase().includes(needle))
    );
  }, [assets, filter]);

  const { data: blogPosts = [] } = useQuery({ queryKey: ["admin", "posts"], queryFn: fetchAllBlogPosts, enabled: isAuthenticated && user?.role === "admin" });
  const { data: videos = [] } = useQuery({ queryKey: ["admin", "videos"], queryFn: () => fetchVideos(), enabled: isAuthenticated && user?.role === "admin" });
  const { data: destinations = [] } = useQuery({ queryKey: ["admin", "destinations"], queryFn: fetchAllDestinations, enabled: isAuthenticated && user?.role === "admin" });

  const placementTargets = useMemo(() => [
    { key: "home", label: "Home · Featured media" },
    { key: "passport", label: "Passport · Featured media" },
    ...blogPosts.map(post => ({ key: `blog:${post.id}`, label: `Blog · ${post.title}` })),
    ...videos.map(video => ({ key: `video:${video.id}`, label: `Video · ${video.title}` })),
    ...destinations.map(destination => ({ key: `destination:${destination.id}`, label: `Destination · ${destination.city}` })),
  ], [blogPosts, videos, destinations]);

  const placeAsset = async (asset: MediaAsset) => {
    try {
      await placeMediaAsset(asset, targetKey);
      toast.success(`Placed on ${placementTargets.find(target => target.key === targetKey)?.label ?? "the selected page"}`);
    } catch {
      toast.error("Could not place this media item");
    }
  };

  if (loading) return <div className="min-h-screen" />;

  const uploadFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Choose an image or video file.");
      return;
    }
    setUploading(true);
    try {
      const storage = getFirebaseStorage();
      const kind = file.type.startsWith("image/") ? "images" : "videos";
      const storageItem = ref(storage, `media-library/${kind}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageItem, file);
      setUrl(await getDownloadURL(snapshot.ref));
      setMediaType(kind === "images" ? "image" : "video");
      setSource("upload");
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      toast.success("Ready to add to the library");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const addAsset = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error("Add a title and upload a file or paste a link.");
      return;
    }
    try {
      await saveMediaAsset({
        title: title.trim(),
        url: url.trim(),
        mediaType: source === "upload" ? mediaType : inferType(url),
        source,
        tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
      });
      setTitle(""); setUrl(""); setTags(""); setSource("upload");
      toast.success("Added to Media Library");
      void queryClient.invalidateQueries({ queryKey: ["admin", "media-assets"] });
    } catch {
      toast.error("Could not save this media item");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Media Library</h1>
          <p className="mt-1 text-muted-foreground">Upload once, tag it, then place it wherever it fits.</p>
        </div>

        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2"><Label htmlFor="media-title">Title</Label><Input id="media-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Summer lookbook" /></div>
            <div className="space-y-2"><Label htmlFor="media-url">Media link</Label><Input id="media-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste YouTube, Instagram, TikTok, or file URL" /></div>
            <div className="space-y-2"><Label htmlFor="media-source">Source</Label><select id="media-source" value={source} onChange={e => setSource(e.target.value as typeof source)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{SOURCE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="media-tags">Tags</Label><Input id="media-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="fashion, travel" /></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Label className="inline-flex cursor-pointer items-center gap-2"><Input className="sr-only" type="file" accept="image/*,video/*" onChange={e => void uploadFile(e.target.files?.[0])} /><Button type="button" variant="outline" asChild disabled={uploading}><span><Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : "Upload media"}</span></Button></Label>
            <Label className="inline-flex cursor-pointer items-center gap-2"><Input className="sr-only" type="file" accept="image/*,video/*" capture="environment" onChange={e => void uploadFile(e.target.files?.[0])} /><Button type="button" variant="outline" asChild><span><Image className="mr-2 h-4 w-4" />Use camera</span></Button></Label>
            <Button onClick={() => void addAsset()} disabled={uploading}><Link2 className="mr-2 h-4 w-4" />Add to library</Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-semibold">Place media</h2><p className="text-sm text-muted-foreground">Choose a page, then use “Place here” on a media item.</p></div>
          <select value={targetKey} onChange={event => setTargetKey(event.target.value)} className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm md:w-96">{placementTargets.map(target => <option key={target.key} value={target.key}>{target.label}</option>)}</select>
        </Card>
        <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">Your media</h2><Input className="max-w-xs" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search tags or title" /></div>
        {isLoading ? <Card className="p-8 text-muted-foreground">Loading media…</Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredAssets.map(asset => <MediaCard key={asset.id} asset={asset} onPlace={() => void placeAsset(asset)} onDelete={() => deleteMutation.mutate(asset.id)} deleting={deleteMutation.isPending} />)}</div>}
      </div>
    </DashboardLayout>
  );
}

function MediaCard({ asset, onPlace, onDelete, deleting }: { asset: MediaAsset; onPlace: () => void; onDelete: () => void; deleting: boolean }) {
  const isImage = asset.mediaType === "image";
  return <Card className="overflow-hidden"><div className="flex aspect-video items-center justify-center bg-muted">{isImage ? <img src={asset.url} alt={asset.title} className="h-full w-full object-cover" /> : <Video className="h-8 w-8 text-muted-foreground" />}</div><div className="space-y-3 p-4"><div><p className="font-medium">{asset.title}</p><p className="text-xs capitalize text-muted-foreground">{asset.source} · {asset.mediaType}</p></div><div className="flex flex-wrap gap-1">{asset.tags.map(tag => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">{tag}</span>)}</div><div className="grid grid-cols-2 gap-2"><Button onClick={onPlace}>Place here</Button><Button variant="outline" onClick={onDelete} disabled={deleting}><Trash2 className="mr-2 h-4 w-4" />Remove</Button></div></div></Card>;
}
