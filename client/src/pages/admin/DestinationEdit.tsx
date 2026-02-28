import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DestinationInput,
  DestinationMediaItem,
  createDestination,
  updateDestination,
  fetchDestinationById,
} from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";

export default function DestinationEdit() {
  const params = useParams();
  const id = params.id;
  const isNew = !id || id === "new";

  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<DestinationInput>({
    slug: "",
    city: "",
    country: "",
    date: new Date(),
    coverStampUrl: "",
    mediaItems: [],
    status: "draft",
    authorId: user?.uid || "",
  });

  useEffect(() => {
    if (user && formData.authorId === "") {
      setFormData(prev => ({ ...prev, authorId: user.uid }));
    }
  }, [user]);

  useEffect(() => {
    if (!isNew && id) {
      loadDestination(id);
    }
  }, [id, isNew]);

  const loadDestination = async (destinationId: string) => {
    try {
      const data = await fetchDestinationById(destinationId);
      if (data) {
        setFormData({
          slug: data.slug,
          city: data.city,
          country: data.country || "",
          date: data.date,
          coverStampUrl: data.coverStampUrl,
          mediaItems: data.mediaItems || [],
          status: data.status,
          authorId: data.authorId,
        });
      } else {
        toast.error("Destination not found");
        setLocation("/admin/destinations");
      }
    } catch (error) {
      toast.error("Error loading destination");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'city' && isNew ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-') } : {})
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setFormData(prev => ({ ...prev, date }));
  };

  const handleStatusChange = (value: "draft" | "published") => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  // Upload main stamp
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storage = getFirebaseStorage();
      const storageRef = ref(storage, `destinations/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      toast.info("Uploading cover stamp...");
      await uploadTask;
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      setFormData(prev => ({ ...prev, coverStampUrl: downloadURL }));
      toast.success("Cover stamp uploaded!");
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  // Add media item
  const addMediaItem = () => {
    setFormData(prev => ({
      ...prev,
      mediaItems: [
        ...prev.mediaItems,
        { type: "image", url: "", visaThumbnailUrl: "", title: "" }
      ]
    }));
  };

  const updateMediaItem = (index: number, key: keyof DestinationMediaItem, value: string) => {
    const newItems = [...formData.mediaItems];
    newItems[index] = { ...newItems[index], [key]: value } as DestinationMediaItem;
    setFormData(prev => ({ ...prev, mediaItems: newItems }));
  };

  const removeMediaItem = (index: number) => {
    const newItems = formData.mediaItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, mediaItems: newItems }));
  };

  const uploadMediaItemFile = async (index: number, key: "url" | "visaThumbnailUrl", file: File) => {
    try {
      const storage = getFirebaseStorage();
      const storageRef = ref(storage, `destinations/media/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      toast.info("Uploading file...");
      await uploadTask;
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      updateMediaItem(index, key, downloadURL);
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (error) {
      toast.error("Error saving destination");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/destinations")}>
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

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date.toISOString().split('T')[0]}
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

        <div className="space-y-4">
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
                      <Select
                        value={item.type}
                        onValueChange={(val: any) => updateMediaItem(index, "type", val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="url">URL / Iframe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Title (Optional)</Label>
                      <Input
                        value={item.title || ""}
                        onChange={(e) => updateMediaItem(index, "title", e.target.value)}
                        placeholder="E.g., Eiffel Tower"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Visa Stamp Thumbnail (Image shown in passport)</Label>
                    <div className="flex items-center gap-4">
                      {item.visaThumbnailUrl && (
                        <img src={item.visaThumbnailUrl} alt="Thumb" className="h-16 w-16 object-contain rounded bg-white/5" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadMediaItemFile(index, "visaThumbnailUrl", e.target.files[0])}
                      />
                    </div>
                    <Input
                      placeholder="Or enter image URL"
                      value={item.visaThumbnailUrl}
                      onChange={(e) => updateMediaItem(index, "visaThumbnailUrl", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Full Media URL (What opens on click)</Label>
                    {item.type !== "url" && (
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept={item.type === "image" ? "image/*" : "video/*"}
                          onChange={(e) => e.target.files?.[0] && uploadMediaItemFile(index, "url", e.target.files[0])}
                        />
                      </div>
                    )}
                    <Input
                      placeholder={item.type === "url" ? "Enter external URL or embed link" : "Or enter media URL"}
                      value={item.url}
                      onChange={(e) => updateMediaItem(index, "url", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Saving..." : "Save Destination"}
        </Button>
      </form>
    </div>
  );
}
