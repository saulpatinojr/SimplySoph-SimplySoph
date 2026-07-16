import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";
import { optimizeImage } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  createPlush,
  fetchPlushById,
  fetchAllDestinations,
  PlushInput,
  PlushPhoto,
  PlushSize,
  updatePlush,
} from "@/lib/content";

const SIZES: PlushSize[] = ["tiny", "small", "medium", "large", "huge"];

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function MenagerieEdit() {
  const params = useParams();
  const id = params.id;
  const isNew = !id;

  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [uploadingCount, setUploadingCount] = useState(0);

  const [formData, setFormData] = useState<PlushInput>({
    slug: "",
    name: "",
    species: "",
    nickname: "",
    size: undefined,
    colorPalette: [],
    adoptionDate: new Date(),
    originStory: "",
    personalityTraits: [],
    heroPhoto: { url: "" },
    gallery: [],
    travelsWithMe: false,
    destinationSlugs: [],
    featured: false,
    status: "draft",
    authorId: user?.uid || "",
  });

  useEffect(() => {
    if (user && formData.authorId === "") {
      setFormData(prev => ({ ...prev, authorId: user.uid }));
    }
  }, [formData.authorId, user]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin", "menagerie", id],
    queryFn: () => fetchPlushById(id!),
    enabled: Boolean(id),
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ["admin", "destinations"],
    queryFn: fetchAllDestinations,
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        slug: existing.slug,
        name: existing.name,
        species: existing.species,
        nickname: existing.nickname || "",
        size: existing.size,
        colorPalette: existing.colorPalette || [],
        adoptionDate: existing.adoptionDate,
        originStory: existing.originStory || "",
        personalityTraits: existing.personalityTraits || [],
        heroPhoto: existing.heroPhoto || { url: "" },
        gallery: existing.gallery || [],
        travelsWithMe: existing.travelsWithMe,
        destinationSlugs: existing.destinationSlugs || [],
        featured: existing.featured,
        status: existing.status,
        authorId: existing.authorId,
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        await createPlush(formData);
      } else {
        await updatePlush(id!, formData);
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Plush adopted!" : "Plush updated!");
      void queryClient.invalidateQueries({ queryKey: ["admin", "menagerie"] });
      void queryClient.invalidateQueries({ queryKey: ["menagerie"] });
      setLocation("/admin/menagerie");
    },
    onError: () => {
      toast.error("Error saving plush");
    },
  });

  async function uploadPhoto(file: File): Promise<PlushPhoto> {
    const storage = getFirebaseStorage();
    const optimized = await optimizeImage(file);
    const base = `menagerie/${Date.now()}_${generateSlug(file.name.replace(/\.[^.]+$/, ""))}`;

    const [mainSnap, thumbSnap] = await Promise.all([
      uploadBytes(ref(storage, `${base}_large.webp`), optimized.large),
      uploadBytes(ref(storage, `${base}_thumb.webp`), optimized.thumbnail),
    ]);
    const [url, thumbnailUrl] = await Promise.all([
      getDownloadURL(mainSnap.ref),
      getDownloadURL(thumbSnap.ref),
    ]);
    return { url, thumbnailUrl };
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCount(c => c + 1);
      toast.info("Uploading hero photo...");
      const photo = await uploadPhoto(file);
      setFormData(prev => ({ ...prev, heroPhoto: photo }));
      toast.success("Hero photo uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingCount(c => c - 1);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      setUploadingCount(c => c + 1);
      toast.info(`Uploading ${files.length} photo(s)...`);
      const photos = await Promise.all(files.map(uploadPhoto));
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...photos] }));
      toast.success("Gallery photos uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingCount(c => c - 1);
    }
  }

  function removeGalleryPhoto(index: number) {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.species || !formData.slug) {
      toast.error("Name, species, and slug are required");
      return;
    }
    if (formData.status === "published" && !formData.heroPhoto.url) {
      toast.error("A hero photo is required to publish");
      return;
    }
    saveMutation.mutate();
  }

  if (!isNew && isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/menagerie">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">
            {isNew ? "New Plush" : `Edit ${formData.name || "Plush"}`}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    name: e.target.value,
                    ...(isNew ? { slug: generateSlug(e.target.value) } : {}),
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Species / Jellycat line *</Label>
              <Input
                id="species"
                value={formData.species}
                onChange={e =>
                  setFormData(prev => ({ ...prev, species: e.target.value }))
                }
                placeholder="Bashful Bunny"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={e =>
                  setFormData(prev => ({ ...prev, slug: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={formData.nickname || ""}
                onChange={e =>
                  setFormData(prev => ({ ...prev, nickname: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adoptionDate">Adoption date *</Label>
              <Input
                id="adoptionDate"
                type="date"
                value={formData.adoptionDate.toISOString().split("T")[0]}
                onChange={e => {
                  const date = new Date(e.target.value);
                  if (!Number.isNaN(date.getTime())) {
                    setFormData(prev => ({ ...prev, adoptionDate: date }));
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Select
                value={formData.size ?? ""}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    size: (value || undefined) as PlushSize | undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map(size => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "published") =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="palette">Color palette (comma-separated)</Label>
              <Input
                id="palette"
                value={(formData.colorPalette || []).join(", ")}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    colorPalette: e.target.value
                      .split(",")
                      .map(c => c.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="#e8b4c8, cream"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="traits">Personality traits (comma-separated)</Label>
              <Input
                id="traits"
                value={(formData.personalityTraits || []).join(", ")}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    personalityTraits: e.target.value
                      .split(",")
                      .map(t => t.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="shy, snack enthusiast, window-seat lover"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="originStory">Adoption story</Label>
              <Textarea
                id="originStory"
                rows={5}
                value={formData.originStory || ""}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    originStory: e.target.value,
                  }))
                }
                placeholder="Where they came from, how they got their name..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="travelsWithMe"
                type="checkbox"
                checked={formData.travelsWithMe}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    travelsWithMe: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="travelsWithMe">Travels with me</Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="featured"
                type="checkbox"
                checked={formData.featured}
                onChange={e =>
                  setFormData(prev => ({ ...prev, featured: e.target.checked }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="featured">Spotlight eligible</Label>
            </div>
          </div>

          {formData.travelsWithMe && (
            <div className="space-y-2">
              <Label>Destinations visited</Label>
              <div className="flex flex-wrap gap-2">
                {destinations.map(dest => {
                  const selected = (formData.destinationSlugs || []).includes(
                    dest.slug
                  );
                  return (
                    <Button
                      key={dest.id}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          destinationSlugs: selected
                            ? (prev.destinationSlugs || []).filter(
                                s => s !== dest.slug
                              )
                            : [...(prev.destinationSlugs || []), dest.slug],
                        }))
                      }
                    >
                      {dest.city}
                    </Button>
                  );
                })}
                {destinations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No destinations yet — add them under Passport Destinations.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Label>Hero photo {formData.status === "published" && "*"}</Label>
            <div className="flex items-center gap-4">
              {formData.heroPhoto.url && (
                <img
                  src={formData.heroPhoto.thumbnailUrl || formData.heroPhoto.url}
                  alt="Hero"
                  className="h-24 w-24 rounded-full object-cover border"
                />
              )}
              <Input type="file" accept="image/*" onChange={handleHeroUpload} />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Gallery</Label>
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryUpload}
                />
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  <Plus size={16} /> Add photos
                </span>
              </label>
            </div>
            {formData.gallery.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No gallery photos yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                {formData.gallery.map((photo, index) => (
                  <div key={photo.url} className="group relative">
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.caption || `Gallery ${index + 1}`}
                      className="aspect-square w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryPhoto(index)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending || uploadingCount > 0}
            className="w-full"
          >
            {saveMutation.isPending || uploadingCount > 0 ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {uploadingCount > 0
              ? "Uploading..."
              : saveMutation.isPending
                ? "Saving..."
                : "Save Plush"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
