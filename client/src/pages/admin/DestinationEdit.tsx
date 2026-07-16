import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import {
  DestinationInput,
  DestinationItineraryBlock,
  DestinationMediaItem,
  DestinationProduct,
  DestinationRelatedLink,
  createDestination,
  updateDestination,
  fetchDestinationById,
} from "@/lib/content";
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
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Save,
  Link2,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";

function emptyRelatedLink(): DestinationRelatedLink {
  return {
    id: crypto.randomUUID(),
    type: "blog",
    title: "",
    description: "",
    imageUrl: "",
    url: "",
    matchReason: "Curated by editor",
  };
}

function emptyProduct(): DestinationProduct {
  return {
    id: crypto.randomUUID(),
    name: "",
    brand: "",
    price: "",
    imageUrl: "",
    productUrl: "",
    retailer: "",
    notes: "",
  };
}

function emptyItineraryBlock(): DestinationItineraryBlock {
  return {
    title: "",
    timeLabel: "",
    neighborhood: "",
    description: "",
  };
}

export default function DestinationEdit() {
  const params = useParams();
  const id = params.id;
  const isNew = !id || id === "new";

  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const [formData, setFormData] = useState<DestinationInput>({
    slug: "",
    city: "",
    country: "",
    storySummary: "",
    date: new Date(),
    coverStampUrl: "",
    mediaItems: [],
    coordinates: null,
    seasonLabel: "",
    budgetLabel: "",
    vibeTags: [],
    highlights: [],
    itineraryBlocks: [],
    featuredLook: null,
    relatedLinks: [],
    status: "draft",
    authorId: user?.uid || "",
  });

  useEffect(() => {
    if (user && formData.authorId === "") {
      setFormData(prev => ({ ...prev, authorId: user.uid }));
    }
  }, [formData.authorId, user]);

  useEffect(() => {
    if (!isNew && id) {
      void loadDestination(id);
    }
  }, [id, isNew]);

  async function loadDestination(destinationId: string) {
    try {
      const data = await fetchDestinationById(destinationId);
      if (data) {
        setFormData({
          slug: data.slug,
          city: data.city,
          country: data.country || "",
          storySummary: data.storySummary || "",
          date: data.date,
          coverStampUrl: data.coverStampUrl,
          mediaItems: data.mediaItems || [],
          coordinates: data.coordinates || null,
          seasonLabel: data.seasonLabel || "",
          budgetLabel: data.budgetLabel || "",
          vibeTags: data.vibeTags || [],
          highlights: data.highlights || [],
          itineraryBlocks: data.itineraryBlocks || [],
          featuredLook: data.featuredLook || null,
          relatedLinks: data.relatedLinks || [],
          status: data.status,
          authorId: data.authorId,
        });
      } else {
        toast.error("Destination not found");
        setLocation("/admin/destinations");
      }
    } catch {
      toast.error("Error loading destination");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "city" && isNew
        ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
        : {}),
    }));
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = new Date(e.target.value);
    setFormData(prev => ({ ...prev, date }));
  }

  function handleStatusChange(value: "draft" | "published") {
    setFormData(prev => ({ ...prev, status: value }));
  }

  function handleTagListChange(key: "vibeTags" | "highlights", value: string, splitter: RegExp) {
    setFormData(prev => ({
      ...prev,
      [key]: value
        .split(splitter)
        .map(item => item.trim())
        .filter(Boolean),
    }));
  }

  function updateCoordinates(key: "lat" | "lng", value: string) {
    if (!value) {
      setFormData(prev => ({ ...prev, coordinates: null }));
      return;
    }
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return;
    setFormData(prev => ({
      ...prev,
      coordinates: {
        lat: key === "lat" ? parsed : prev.coordinates?.lat ?? 0,
        lng: key === "lng" ? parsed : prev.coordinates?.lng ?? 0,
      },
    }));
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCount(prev => prev + 1);
      const storage = getFirebaseStorage();
      const storageRef = ref(storage, `destinations/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      toast.info("Uploading cover stamp...");
      await uploadTask;
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      setFormData(prev => ({ ...prev, coverStampUrl: downloadURL }));
      toast.success("Cover stamp uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingCount(prev => prev - 1);
    }
  }

  function addMediaItem() {
    setFormData(prev => ({
      ...prev,
      mediaItems: [
        ...prev.mediaItems,
        { type: "image", url: "", visaThumbnailUrl: "", title: "" },
      ],
    }));
  }

  function updateMediaItem(
    index: number,
    key: keyof DestinationMediaItem,
    value: string
  ) {
    const newItems = [...formData.mediaItems];
    newItems[index] = {
      ...newItems[index],
      [key]: value,
    } as DestinationMediaItem;
    setFormData(prev => ({ ...prev, mediaItems: newItems }));
  }

  function removeMediaItem(index: number) {
    setFormData(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function uploadMediaItemFile(
    index: number,
    key: "url" | "visaThumbnailUrl",
    file: File
  ) {
    try {
      setUploadingCount(prev => prev + 1);
      const storage = getFirebaseStorage();
      const storageRef = ref(
        storage,
        `destinations/media/${Date.now()}_${file.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      toast.info("Uploading file...");
      await uploadTask;
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      updateMediaItem(index, key, downloadURL);
      toast.success("File uploaded successfully!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingCount(prev => prev - 1);
    }
  }

  function addItineraryBlock() {
    setFormData(prev => ({
      ...prev,
      itineraryBlocks: [...(prev.itineraryBlocks || []), emptyItineraryBlock()],
    }));
  }

  function updateItineraryBlock(
    index: number,
    key: keyof DestinationItineraryBlock,
    value: string
  ) {
    const blocks = [...(formData.itineraryBlocks || [])];
    blocks[index] = { ...blocks[index], [key]: value };
    setFormData(prev => ({ ...prev, itineraryBlocks: blocks }));
  }

  function removeItineraryBlock(index: number) {
    setFormData(prev => ({
      ...prev,
      itineraryBlocks: (prev.itineraryBlocks || []).filter((_, blockIndex) => blockIndex !== index),
    }));
  }

  function ensureFeaturedLook() {
    if (formData.featuredLook) return;
    setFormData(prev => ({
      ...prev,
      featuredLook: {
        title: "",
        description: "",
        imageUrl: "",
        items: [],
      },
    }));
  }

  function updateFeaturedLook(key: "title" | "description" | "imageUrl", value: string) {
    setFormData(prev => ({
      ...prev,
      featuredLook: {
        title: prev.featuredLook?.title || "",
        description: prev.featuredLook?.description || "",
        imageUrl: prev.featuredLook?.imageUrl || "",
        items: prev.featuredLook?.items || [],
        [key]: value,
      },
    }));
  }

  function addFeaturedProduct() {
    ensureFeaturedLook();
    setFormData(prev => ({
      ...prev,
      featuredLook: {
        title: prev.featuredLook?.title || "",
        description: prev.featuredLook?.description || "",
        imageUrl: prev.featuredLook?.imageUrl || "",
        items: [...(prev.featuredLook?.items || []), emptyProduct()],
      },
    }));
  }

  function updateFeaturedProduct(
    index: number,
    key: keyof DestinationProduct,
    value: string
  ) {
    const items = [...(formData.featuredLook?.items || [])];
    items[index] = { ...items[index], [key]: value };
    setFormData(prev => ({
      ...prev,
      featuredLook: prev.featuredLook
        ? { ...prev.featuredLook, items }
        : { title: "", description: "", imageUrl: "", items },
    }));
  }

  function removeFeaturedProduct(index: number) {
    const items = (formData.featuredLook?.items || []).filter((_, itemIndex) => itemIndex !== index);
    setFormData(prev => ({
      ...prev,
      featuredLook: prev.featuredLook ? { ...prev.featuredLook, items } : null,
    }));
  }

  function addRelatedLink() {
    setFormData(prev => ({
      ...prev,
      relatedLinks: [...(prev.relatedLinks || []), emptyRelatedLink()],
    }));
  }

  function updateRelatedLink(
    index: number,
    key: keyof DestinationRelatedLink,
    value: string
  ) {
    const links = [...(formData.relatedLinks || [])];
    links[index] = { ...links[index], [key]: value } as DestinationRelatedLink;
    setFormData(prev => ({ ...prev, relatedLinks: links }));
  }

  function removeRelatedLink(index: number) {
    setFormData(prev => ({
      ...prev,
      relatedLinks: (prev.relatedLinks || []).filter((_, linkIndex) => linkIndex !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.city || !formData.coverStampUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await createDestination(formData);
        toast.success("Destination created successfully!");
      } else {
        await updateDestination(id, formData);
        toast.success("Destination updated successfully!");
      }
      setLocation("/admin/destinations");
    } catch {
      toast.error("Error saving destination");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;


  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/destinations")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-heading font-bold">
            {isNew ? "New Destination" : "Edit Destination"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" value={formData.country} onChange={handleChange} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="storySummary">Story Summary</Label>
              <Textarea
                id="storySummary"
                name="storySummary"
                value={formData.storySummary || ""}
                onChange={handleChange}
                placeholder="Editorial summary used on the destination page."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date.toISOString().split("T")[0]}
                onChange={handleDateChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seasonLabel">Season Label</Label>
              <Input id="seasonLabel" name="seasonLabel" value={formData.seasonLabel || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetLabel">Budget Label</Label>
              <Input id="budgetLabel" name="budgetLabel" value={formData.budgetLabel || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="number" step="0.000001" value={formData.coordinates?.lat ?? ""} onChange={event => updateCoordinates("lat", event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" type="number" step="0.000001" value={formData.coordinates?.lng ?? ""} onChange={event => updateCoordinates("lng", event.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vibeTags">Vibe Tags</Label>
              <Input
                id="vibeTags"
                value={(formData.vibeTags || []).join(", ")}
                onChange={event => handleTagListChange("vibeTags", event.target.value, /,/g)}
                placeholder="city, layering, editorial"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="highlights">Story Highlights</Label>
              <Textarea
                id="highlights"
                value={(formData.highlights || []).join("\n")}
                onChange={event => handleTagListChange("highlights", event.target.value, /\n/g)}
                placeholder="One highlight per line"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Cover Stamp Image * (Landing Page Thumbnail)</Label>
            <div className="flex items-center gap-4">
              {formData.coverStampUrl && (
                <img src={formData.coverStampUrl} alt="Cover" className="h-24 w-24 object-contain rounded border bg-white/5" />
              )}
              <Input type="file" accept="image/*" onChange={handleCoverUpload} />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <Label className="text-xl">Media Items (Visa Stamps)</Label>
              <Button type="button" variant="outline" onClick={addMediaItem}>
                <Plus size={16} className="mr-2" /> Add Media
              </Button>
            </div>

            {formData.mediaItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">No media items added yet.</p>
            ) : (
              <div className="space-y-6">
                {formData.mediaItems.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4 bg-white/5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">Item #{index + 1}</h3>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeMediaItem(index)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={item.type} onValueChange={value => updateMediaItem(index, "type", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="url">URL / Iframe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Title (Optional)</Label>
                        <Input value={item.title || ""} onChange={e => updateMediaItem(index, "title", e.target.value)} placeholder="E.g., Eiffel Tower" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Visa Stamp Thumbnail (Image shown in passport)</Label>
                      <div className="flex items-center gap-4">
                        {item.visaThumbnailUrl && <img src={item.visaThumbnailUrl} alt="Thumb" className="h-16 w-16 object-contain rounded bg-white/5" />}
                        <Input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadMediaItemFile(index, "visaThumbnailUrl", e.target.files[0])} />
                      </div>
                      <Input placeholder="Or enter image URL" value={item.visaThumbnailUrl} onChange={e => updateMediaItem(index, "visaThumbnailUrl", e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Full Media URL (What opens on click)</Label>
                      {item.type !== "url" && (
                        <div className="flex items-center gap-4">
                          <Input type="file" accept={item.type === "image" ? "image/*" : "video/*"} onChange={e => e.target.files?.[0] && uploadMediaItemFile(index, "url", e.target.files[0])} />
                        </div>
                      )}
                      <Input placeholder={item.type === "url" ? "Enter external URL or embed link" : "Or enter media URL"} value={item.url} onChange={e => updateMediaItem(index, "url", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-4 w-4" /> Itinerary Blocks</h2>
                <p className="text-sm text-muted-foreground">Stops rendered in the public destination list view.</p>
              </div>
              <Button type="button" variant="outline" onClick={addItineraryBlock}>
                <Plus className="mr-2 h-4 w-4" /> Add stop
              </Button>
            </div>
            {(formData.itineraryBlocks || []).map((block, index) => (
              <div key={index} className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
                <Input value={block.title} onChange={event => updateItineraryBlock(index, "title", event.target.value)} placeholder="Stop title" />
                <Input value={block.timeLabel || ""} onChange={event => updateItineraryBlock(index, "timeLabel", event.target.value)} placeholder="Time label" />
                <Input value={block.neighborhood || ""} onChange={event => updateItineraryBlock(index, "neighborhood", event.target.value)} placeholder="Neighborhood" className="md:col-span-2" />
                <Textarea value={block.description} onChange={event => updateItineraryBlock(index, "description", event.target.value)} placeholder="What happens here" className="md:col-span-2" />
                <div className="md:col-span-2 flex justify-end">
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeItineraryBlock(index)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove stop
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold"><ShoppingBag className="h-4 w-4" /> Featured Look</h2>
                <p className="text-sm text-muted-foreground">Admin-managed product authoring for the public shop-the-look module.</p>
              </div>
              <Button type="button" variant="outline" onClick={ensureFeaturedLook}>Initialize look</Button>
            </div>

            {formData.featuredLook && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input value={formData.featuredLook.title} onChange={event => updateFeaturedLook("title", event.target.value)} placeholder="Look title" />
                  <Input value={formData.featuredLook.imageUrl} onChange={event => updateFeaturedLook("imageUrl", event.target.value)} placeholder="Hero image URL" />
                  <Textarea value={formData.featuredLook.description || ""} onChange={event => updateFeaturedLook("description", event.target.value)} placeholder="Why this look works" className="md:col-span-2" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base">Products</Label>
                  <Button type="button" variant="outline" onClick={addFeaturedProduct}><Plus className="mr-2 h-4 w-4" /> Add product</Button>
                </div>
                {(formData.featuredLook.items || []).map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
                    <Input value={item.name} onChange={event => updateFeaturedProduct(index, "name", event.target.value)} placeholder="Product name" />
                    <Input value={item.brand} onChange={event => updateFeaturedProduct(index, "brand", event.target.value)} placeholder="Brand" />
                    <Input value={item.price || ""} onChange={event => updateFeaturedProduct(index, "price", event.target.value)} placeholder="Price" />
                    <Input value={item.retailer || ""} onChange={event => updateFeaturedProduct(index, "retailer", event.target.value)} placeholder="Retailer" />
                    <Input value={item.imageUrl} onChange={event => updateFeaturedProduct(index, "imageUrl", event.target.value)} placeholder="Image URL" className="md:col-span-2" />
                    <Input value={item.productUrl} onChange={event => updateFeaturedProduct(index, "productUrl", event.target.value)} placeholder="Product URL" className="md:col-span-2" />
                    <Textarea value={item.notes || ""} onChange={event => updateFeaturedProduct(index, "notes", event.target.value)} placeholder="Editor notes" className="md:col-span-2" />
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeFeaturedProduct(index)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove product
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold"><Link2 className="h-4 w-4" /> Related Story Links</h2>
                <p className="text-sm text-muted-foreground">Curated public cross-format links for this destination.</p>
              </div>
              <Button type="button" variant="outline" onClick={addRelatedLink}><Plus className="mr-2 h-4 w-4" /> Add link</Button>
            </div>

            {(formData.relatedLinks || []).map((link, index) => (
              <div key={link.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
                <Select value={link.type} onValueChange={value => updateRelatedLink(index, "type", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="album">Album</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={link.title} onChange={event => updateRelatedLink(index, "title", event.target.value)} placeholder="Link title" />
                <Input value={link.url} onChange={event => updateRelatedLink(index, "url", event.target.value)} placeholder="Destination URL" className="md:col-span-2" />
                <Input value={link.imageUrl || ""} onChange={event => updateRelatedLink(index, "imageUrl", event.target.value)} placeholder="Image URL" className="md:col-span-2" />
                <Textarea value={link.description || ""} onChange={event => updateRelatedLink(index, "description", event.target.value)} placeholder="Short description" className="md:col-span-2" />
                <Input value={link.matchReason || ""} onChange={event => updateRelatedLink(index, "matchReason", event.target.value)} placeholder="Match reason" className="md:col-span-2" />
                <div className="md:col-span-2 flex justify-end">
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeRelatedLink(index)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove link
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={saving || uploadingCount > 0} className="w-full">
            {saving || uploadingCount > 0 ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {uploadingCount > 0 ? "Uploading Media..." : saving ? "Saving..." : "Save Destination"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
