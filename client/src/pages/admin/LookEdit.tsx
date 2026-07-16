import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";
import { optimizeImage } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import FeaturedProductsEditor from "@/components/admin/FeaturedProductsEditor";
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
import { getEditorSaveGuard } from "@/lib/contentMetadataValidation";
import {
  createLook,
  fetchAllDestinations,
  fetchLookById,
  LookInput,
  LookSeason,
  updateLook,
} from "@/lib/content";

const SEASONS: LookSeason[] = ["spring", "summer", "autumn", "winter"];

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function LookEdit() {
  const params = useParams();
  const id = params.id;
  const isNew = !id;

  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [uploadingCount, setUploadingCount] = useState(0);

  const [formData, setFormData] = useState<LookInput>({
    slug: "",
    title: "",
    subtitle: "",
    heroImageUrl: "",
    gallery: [],
    season: undefined,
    occasionTags: [],
    products: [],
    affiliateDisclosure: "",
    destinationSlug: undefined,
    body: "",
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
    queryKey: ["admin", "looks", id],
    queryFn: () => fetchLookById(id!),
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
        title: existing.title,
        subtitle: existing.subtitle || "",
        heroImageUrl: existing.heroImageUrl,
        gallery: existing.gallery || [],
        season: existing.season,
        occasionTags: existing.occasionTags || [],
        products: existing.products || [],
        affiliateDisclosure: existing.affiliateDisclosure || "",
        destinationSlug: existing.destinationSlug,
        body: existing.body || "",
        featured: existing.featured,
        publishedAt: existing.publishedAt,
        status: existing.status,
        authorId: existing.authorId,
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        await createLook(formData);
      } else {
        await updateLook(id!, formData);
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Look created!" : "Look updated!");
      void queryClient.invalidateQueries({ queryKey: ["admin", "looks"] });
      void queryClient.invalidateQueries({ queryKey: ["looks"] });
      setLocation("/admin/looks");
    },
    onError: () => {
      toast.error("Error saving look");
    },
  });

  async function uploadImage(file: File): Promise<string> {
    const storage = getFirebaseStorage();
    const optimized = await optimizeImage(file);
    const base = `looks/${Date.now()}_${generateSlug(file.name.replace(/\.[^.]+$/, ""))}`;
    const snapshot = await uploadBytes(
      ref(storage, `${base}_large.webp`),
      optimized.large
    );
    return getDownloadURL(snapshot.ref);
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingCount(c => c + 1);
      toast.info("Uploading hero image...");
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, heroImageUrl: url }));
      toast.success("Hero image uploaded!");
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
      const urls = await Promise.all(files.map(uploadImage));
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...urls.map(url => ({ url }))],
      }));
      toast.success("Gallery photos uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingCount(c => c - 1);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      toast.error("Title and slug are required");
      return;
    }
    if (formData.status === "published" && !formData.heroImageUrl) {
      toast.error("A hero image is required to publish");
      return;
    }

    // FTC-compliance gate: products can't publish without a disclosure.
    const guard = getEditorSaveGuard({
      intent: formData.status,
      featuredProducts: formData.products,
      canonicalUrl: `https://simplysoph.com/looks/${formData.slug}`,
      disclosureText: formData.affiliateDisclosure,
      coverImage: formData.heroImageUrl,
      coverImageAlt: formData.title,
    });
    if (guard.shouldBlockSave) {
      toast.error("Fix before saving", { description: guard.firstIssue ?? "" });
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
          <Link href="/admin/looks">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">
            {isNew ? "New Look" : `Edit ${formData.title || "Look"}`}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    title: e.target.value,
                    ...(isNew ? { slug: generateSlug(e.target.value) } : {}),
                  }))
                }
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle || ""}
                onChange={e =>
                  setFormData(prev => ({ ...prev, subtitle: e.target.value }))
                }
                placeholder="One-line hook for the lookbook card"
              />
            </div>

            <div className="space-y-2">
              <Label>Season</Label>
              <Select
                value={formData.season ?? ""}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    season: (value || undefined) as LookSeason | undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map(season => (
                    <SelectItem key={season} value={season}>
                      {season}
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
              <Label htmlFor="occasions">Occasion tags (comma-separated)</Label>
              <Input
                id="occasions"
                value={formData.occasionTags.join(", ")}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    occasionTags: e.target.value
                      .split(",")
                      .map(t => t.trim().toLowerCase())
                      .filter(Boolean),
                  }))
                }
                placeholder="airport, dinner, beach club"
              />
            </div>

            <div className="space-y-2">
              <Label>Worn in (destination)</Label>
              <Select
                value={formData.destinationSlug ?? "none"}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    destinationSlug: value === "none" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link a trip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked trip</SelectItem>
                  {destinations.map(dest => (
                    <SelectItem key={dest.id} value={dest.slug}>
                      {dest.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="body">Styling notes / story</Label>
              <Textarea
                id="body"
                rows={5}
                value={formData.body || ""}
                onChange={e =>
                  setFormData(prev => ({ ...prev, body: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="disclosure">
                Affiliate disclosure {formData.products.length > 0 && "*"}
              </Label>
              <Textarea
                id="disclosure"
                rows={2}
                value={formData.affiliateDisclosure || ""}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    affiliateDisclosure: e.target.value,
                  }))
                }
                placeholder="Some links are affiliate links — I may earn a commission at no extra cost to you."
              />
              <p className="text-xs text-muted-foreground">
                Required before publishing a look with products (FTC).
              </p>
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
              <Label htmlFor="featured">Featured look</Label>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Hero image {formData.status === "published" && "*"}</Label>
            <div className="flex items-center gap-4">
              {formData.heroImageUrl && (
                <img
                  src={formData.heroImageUrl}
                  alt="Hero"
                  className="h-24 w-24 rounded object-cover border"
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
                      src={photo.url}
                      alt={photo.caption || `Gallery ${index + 1}`}
                      className="aspect-square w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          gallery: prev.gallery.filter((_, i) => i !== index),
                        }))
                      }
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

          <FeaturedProductsEditor
            title="Shop the look — products"
            value={formData.products}
            onChange={products => setFormData(prev => ({ ...prev, products }))}
          />

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
                : "Save Look"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
