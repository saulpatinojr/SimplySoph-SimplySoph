import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  Link as LinkIcon,
  Loader2,
  Save,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";
import type { DestinationMediaItem } from "@/lib/services/destination";

interface PassportMediaFormProps {
  mediaType: "image" | "video";
  onSave: (item: DestinationMediaItem) => void;
  saving?: boolean;
}

export default function PassportMediaForm({
  mediaType,
  onSave,
  saving = false,
}: PassportMediaFormProps) {
  const [title, setTitle] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [visaThumbnailUrl, setVisaThumbnailUrl] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);

  const handleFileUpload = useCallback(
    async (
      file: File,
      folder: string,
      onComplete: (url: string) => void,
      setUploading: (v: boolean) => void
    ) => {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 100MB.");
        return;
      }

      setUploading(true);
      try {
        const storage = getFirebaseStorage();
        const fileName = `${folder}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        onComplete(url);
        toast.success("File uploaded successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload file");
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const handleSubmit = () => {
    if (!mediaUrl) {
      toast.error("Please provide a media URL or upload a file");
      return;
    }
    if (!visaThumbnailUrl) {
      toast.error("Please provide a visa stamp thumbnail");
      return;
    }

    onSave({
      type: mediaType,
      url: mediaUrl,
      visaThumbnailUrl,
      title: title || undefined,
    });
  };

  return (
    <Card className="p-6 space-y-6 border-dashed">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {mediaType === "image" ? <ImageIcon size={16} /> : <Video size={16} />}
        Passport Media Details
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="passport-title">Title (Optional)</Label>
        <Input
          id="passport-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={
            mediaType === "image"
              ? "E.g., Eiffel Tower at sunset"
              : "E.g., Walking through Shibuya"
          }
        />
      </div>

      {/* Visa Stamp Thumbnail */}
      <div className="space-y-2">
        <Label>Visa Stamp Thumbnail *</Label>
        <p className="text-xs text-muted-foreground">
          The stamp image shown in the passport page grid.
        </p>
        <div className="flex items-center gap-4">
          {visaThumbnailUrl && (
            <img
              src={visaThumbnailUrl}
              alt="Stamp"
              className="h-20 w-20 object-contain rounded border bg-white/5"
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploadingStamp}
                asChild
              >
                <label>
                  {uploadingStamp ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Upload Stamp
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(
                          file,
                          "destinations/stamps",
                          setVisaThumbnailUrl,
                          setUploadingStamp
                        );
                      }
                    }}
                  />
                </label>
              </Button>
              <span className="text-xs text-muted-foreground">or</span>
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon size={14} className="text-muted-foreground shrink-0" />
              <Input
                placeholder="Paste stamp image URL"
                value={visaThumbnailUrl}
                onChange={e => setVisaThumbnailUrl(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Media URL */}
      <div className="space-y-2">
        <Label>{mediaType === "image" ? "Full Image" : "Video"} *</Label>
        <p className="text-xs text-muted-foreground">
          {mediaType === "image"
            ? "The full-size image that opens when the stamp is clicked."
            : "The video that plays when the stamp is clicked. Upload or paste a URL (YouTube, Vimeo, etc)."}
        </p>
        <div className="flex items-center gap-4">
          {mediaUrl && mediaType === "image" && (
            <img
              src={mediaUrl}
              alt="Preview"
              className="h-20 w-20 object-cover rounded border bg-white/5"
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploadingMedia}
                asChild
              >
                <label>
                  {uploadingMedia ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  Upload {mediaType === "image" ? "Image" : "Video"}
                  <input
                    type="file"
                    accept={mediaType === "image" ? "image/*" : "video/*"}
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(
                          file,
                          mediaType === "image"
                            ? "destinations/media"
                            : "destinations/videos",
                          setMediaUrl,
                          setUploadingMedia
                        );
                      }
                    }}
                  />
                </label>
              </Button>
              <span className="text-xs text-muted-foreground">or</span>
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon size={14} className="text-muted-foreground shrink-0" />
              <Input
                placeholder={
                  mediaType === "image"
                    ? "Paste image URL"
                    : "Paste video URL (YouTube, Vimeo, direct link)"
                }
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={saving || !mediaUrl || !visaThumbnailUrl}
        className="w-full gap-2"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        {saving ? "Saving to Destination…" : "Add to Destination"}
      </Button>
    </Card>
  );
}
