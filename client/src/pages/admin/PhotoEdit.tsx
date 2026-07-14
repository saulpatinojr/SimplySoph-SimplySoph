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
  X,
  Plus,
  Trash2,
  GripVertical,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchPhotoAlbumById,
  savePhotoAlbum,
  type PhotoAlbumInput,
  type ContentProduct,
  type ContentRelatedLink,
  fetchCategories,
  fetchPhotosByAlbum,
  savePhoto,
  deletePhoto,
  type PhotoInput,
} from "@/lib/content";
import FeaturedProductsEditor from "@/components/admin/FeaturedProductsEditor";
import RelatedLinksEditor from "@/components/admin/RelatedLinksEditor";
import {
  fetchAllDestinations,
  fetchDestinationById,
  updateDestination,
  type DestinationMediaItem,
} from "@/lib/services/destination";
import DestinationSelector from "@/components/admin/DestinationSelector";
import PassportMediaForm from "@/components/admin/PassportMediaForm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";
import { optimizeImage } from "@/lib/utils";
import { aiService } from "@/lib/services/ai";
import { getEditorSaveGuard } from "@/lib/contentMetadataValidation";
import EditorQaSummary from "@/components/admin/EditorQaSummary";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminPhotoEdit() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, params] = useRoute("/admin/photo/edit/:id");
  const [, setLocation] = useLocation();
  const albumId = params?.id ?? null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [disclosureText, setDisclosureText] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [cityGuideNotesRaw, setCityGuideNotesRaw] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<ContentProduct[]>(
    []
  );
  const [relatedLinks, setRelatedLinks] = useState<ContentRelatedLink[]>([]);
  const [photos, setPhotos] = useState<
    Array<{
      id?: string;
      imageUrl: string;
      imageUrls?: {
        thumbnail: string;
        medium: string;
        large: string;
        original: string;
      };
      caption: string;
      order: number;
      file?: File;
    }>
  >([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState<Set<string>>(
    new Set()
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [generatingCaptionIndex, setGeneratingCaptionIndex] = useState<
    number | null
  >(null);

  // Content location state
  const [contentLocation, setContentLocation] = useState<
    "photo_album" | "passport"
  >("photo_album");
  const [selectedDestinationId, setSelectedDestinationId] =
    useState<string>("none");
  const [passportSaving, setPassportSaving] = useState(false);

  const queryClient = useQueryClient();

  const { data: existingAlbum, isLoading: albumLoading } = useQuery({
    queryKey: ["admin", "album", albumId],
    queryFn: () => fetchPhotoAlbumById(albumId!),
    enabled: isAuthenticated && user?.role === "admin" && Boolean(albumId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin", "categories", "photo"],
    queryFn: () => fetchCategories("photo"),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: existingPhotos } = useQuery({
    queryKey: ["admin", "album", "photos", albumId],
    queryFn: () => fetchPhotosByAlbum(albumId!),
    enabled: isAuthenticated && user?.role === "admin" && Boolean(albumId),
  });

  useEffect(() => {
    if (existingAlbum) {
      setTitle(existingAlbum.title);
      setSlug(existingAlbum.slug);
      setDescription(existingAlbum.description || "");
      setCoverImage(existingAlbum.coverImage || "");
      setCoverImageAlt(existingAlbum.coverImageAlt || "");
      setCanonicalUrl(existingAlbum.canonicalUrl || "");
      setDisclosureText(existingAlbum.disclosureText || "");
      setCategoryId(existingAlbum.categoryId || "none");
      setCityGuideNotesRaw((existingAlbum.cityGuideNotes || []).join("\n"));
      setFeaturedProducts(existingAlbum.featuredProducts || []);
      setRelatedLinks(existingAlbum.relatedLinks || []);
    }
  }, [existingAlbum]);

  const publishQa = useMemo(
    () =>
      getEditorSaveGuard({
        intent: "published",
        canonicalUrl,
        disclosureText,
        coverImage,
        coverImageAlt,
        photoCaptions: photos.map(photo => photo.caption || ""),
        featuredProducts,
        relatedLinks,
      }),
    [
      canonicalUrl,
      disclosureText,
      coverImage,
      coverImageAlt,
      photos,
      featuredProducts,
      relatedLinks,
    ]
  );

  useEffect(() => {
    if (existingPhotos) {
      setPhotos(
        existingPhotos.map(photo => ({
          id: photo.id,
          imageUrl: photo.imageUrl,
          imageUrls: photo.imageUrls,
          caption: photo.caption || "",
          order: photo.order,
        }))
      );
    }
  }, [existingPhotos]);

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: PhotoAlbumInput; id?: string }) =>
      savePhotoAlbum(data, id),
    onSuccess: (_, variables) => {
      const message = variables.id
        ? "Album updated successfully"
        : "Album created successfully";
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "albums"] });
      void queryClient.invalidateQueries({ queryKey: ["albums", "list"] });
      setLocation("/admin/photo");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save album: ${message}`);
    },
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!albumId) {
      setSlug(generateSlug(value));
    }
  };

  const uploadPhotoToStorage = useCallback(
    async (
      file: File
    ): Promise<{
      mainUrl: string;
      imageUrls: {
        thumbnail: string;
        medium: string;
        large: string;
        original: string;
      };
    }> => {
      try {
        // Optimize the image
        const optimized = await optimizeImage(file);

        // Generate filename
        const baseFileName = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}`;
        const storage = getFirebaseStorage();

        // Upload all sizes in parallel
        const uploadPromises = [
          { size: "original", blob: optimized.original, suffix: "" },
          { size: "large", blob: optimized.large, suffix: "_large" },
          { size: "medium", blob: optimized.medium, suffix: "_medium" },
          { size: "thumbnail", blob: optimized.thumbnail, suffix: "_thumb" },
        ].map(async ({ blob, suffix }) => {
          const fileName = `photos/${baseFileName}${suffix}.webp`;
          const storageRef = ref(storage, fileName);
          const snapshot = await uploadBytes(storageRef, blob);
          return { size: suffix, url: await getDownloadURL(snapshot.ref) };
        });

        const uploadedUrls = await Promise.all(uploadPromises);

        // Return structured URLs
        return {
          mainUrl: uploadedUrls.find(u => u.size === "_large")?.url || "",
          imageUrls: {
            thumbnail: uploadedUrls.find(u => u.size === "_thumb")?.url || "",
            medium: uploadedUrls.find(u => u.size === "_medium")?.url || "",
            large: uploadedUrls.find(u => u.size === "_large")?.url || "",
            original: uploadedUrls.find(u => u.size === "")?.url || "",
          },
        };
      } catch (error) {
        console.error("Image optimization/upload error:", error);
        // Fallback to original upload if optimization fails
        const storage = getFirebaseStorage();
        const fileName = `photos/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, file);
        const mainUrl = await getDownloadURL(snapshot.ref);
        return {
          mainUrl,
          imageUrls: {
            thumbnail: mainUrl,
            medium: mainUrl,
            large: mainUrl,
            original: mainUrl,
          },
        };
      }
    },
    []
  );

  const handleCoverImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }

    setIsUploadingCover(true);
    try {
      const result = await uploadPhotoToStorage(file);
      setCoverImage(result.mainUrl);
      toast.success("Cover image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith("image/")
      );

      if (files.length === 0) {
        toast.error("Please drop image files only");
        return;
      }

      // Process each file
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          toast.error(`${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        const tempId = `temp-${Date.now()}-${Math.random()}`;
        setUploadingPhotos(prev => new Set(prev).add(tempId));

        try {
          const uploadResult = await uploadPhotoToStorage(file);
          setPhotos(prev => [
            ...prev,
            {
              imageUrl: uploadResult.mainUrl,
              imageUrls: uploadResult.imageUrls,
              caption: "",
              order: prev.length,
              file,
            },
          ]);
          toast.success(`${file.name} uploaded successfully`);
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
        } finally {
          setUploadingPhotos(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempId);
            return newSet;
          });
        }
      }
    },
    [uploadPhotoToStorage]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          toast.error(`${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        const tempId = `temp-${Date.now()}-${Math.random()}`;
        setUploadingPhotos(prev => new Set(prev).add(tempId));

        try {
          const uploadResult = await uploadPhotoToStorage(file);
          setPhotos(prev => [
            ...prev,
            {
              imageUrl: uploadResult.mainUrl,
              imageUrls: uploadResult.imageUrls,
              caption: "",
              order: prev.length,
              file,
            },
          ]);
          toast.success(`${file.name} uploaded successfully`);
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
        } finally {
          setUploadingPhotos(prev => {
            const newSet = new Set(prev);
            newSet.delete(tempId);
            return newSet;
          });
        }
      }

      // Reset input
      e.target.value = "";
    },
    [uploadPhotoToStorage]
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updatePhotoCaption = useCallback((index: number, caption: string) => {
    setPhotos(prev =>
      prev.map((photo, i) => (i === index ? { ...photo, caption } : photo))
    );
  }, []);

  const handleGenerateCaption = async (index: number, imageUrl: string) => {
    setGeneratingCaptionIndex(index);
    try {
      const generatedCaption = await aiService.generateAltText(imageUrl);
      updatePhotoCaption(index, generatedCaption);
      toast.success("Caption generated successfully");
    } catch (error) {
      toast.error("Failed to generate caption");
    } finally {
      setGeneratingCaptionIndex(null);
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handlePhotoDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (draggedIndex === null || draggedIndex === index) return;

      const newPhotos = [...photos];
      const draggedPhoto = newPhotos[draggedIndex];
      newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(index, 0, draggedPhoto);

      // Update order
      const updatedPhotos = newPhotos.map((photo, i) => ({
        ...photo,
        order: i,
      }));
      setPhotos(updatedPhotos);
      setDraggedIndex(index);
    },
    [draggedIndex, photos]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const togglePhotoSelection = useCallback((index: number) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const selectAllPhotos = useCallback(() => {
    setSelectedPhotos(new Set(photos.map((_, index) => index)));
  }, [photos]);

  const deselectAllPhotos = useCallback(() => {
    setSelectedPhotos(new Set());
  }, []);

  const bulkDeletePhotos = useCallback(() => {
    if (selectedPhotos.size === 0) return;

    setPhotos(prev => prev.filter((_, index) => !selectedPhotos.has(index)));
    setSelectedPhotos(new Set());
    toast.success(
      `Deleted ${selectedPhotos.size} photo${selectedPhotos.size > 1 ? "s" : ""}`
    );
  }, [selectedPhotos]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!title.trim() || !slug.trim()) {
        toast.error("Title and slug are required");
        return;
      }

      const saveGuard = getEditorSaveGuard({
        intent: "published",
        canonicalUrl,
        disclosureText,
        coverImage,
        coverImageAlt,
        photoCaptions: photos.map(photo => photo.caption || ""),
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

      const albumData: PhotoAlbumInput = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        coverImage: coverImage.trim(),
        coverImageAlt: coverImageAlt.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        disclosureText: disclosureText.trim() || undefined,
        categoryId: categoryId === "none" ? undefined : categoryId,
        authorId: user!.uid,
        cityGuideNotes: cityGuideNotesRaw
          .split("\n")
          .map(note => note.trim())
          .filter(Boolean),
        featuredProducts,
        relatedLinks,
      };

      try {
        const savedAlbum = await saveMutation.mutateAsync({
          data: albumData,
          id: albumId || undefined,
        });

        // Save photos
        for (const photo of photos) {
          const photoData: PhotoInput = {
            albumId: savedAlbum,
            imageUrl: photo.imageUrl,
            imageUrls: photo.imageUrls,
            caption: photo.caption.trim(),
            order: photo.order,
          };

          if (photo.id) {
            // Update existing photo
            await savePhoto(photoData, photo.id);
          } else {
            // Create new photo
            await savePhoto(photoData);
          }
        }

        // Delete removed photos if editing
        if (albumId && existingPhotos) {
          const existingPhotoIds = new Set(existingPhotos.map(p => p.id));
          const currentPhotoIds = new Set(
            photos.filter(p => p.id).map(p => p.id)
          );

          for (const existingPhoto of existingPhotos) {
            if (!currentPhotoIds.has(existingPhoto.id)) {
              await deletePhoto(existingPhoto.id);
            }
          }
        }

        toast.success("Album and photos saved successfully");
        setLocation("/admin/photo");
      } catch (error) {
        console.error("Save error:", error);
        toast.error("Failed to save album and photos");
      }
    },
    [
      title,
      slug,
      description,
      coverImage,
      coverImageAlt,
      canonicalUrl,
      disclosureText,
      categoryId,
      cityGuideNotesRaw,
      featuredProducts,
      relatedLinks,
      photos,
      user,
      albumId,
      existingPhotos,
      saveMutation,
      setLocation,
    ]
  );

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

      toast.success("Media added to destination!");
      queryClient.invalidateQueries({ queryKey: ["admin", "destinations"] });
      setLocation("/admin/destinations");
    } catch (error) {
      console.error("Error saving to destination:", error);
      toast.error("Failed to add media to destination");
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

  if (authLoading || (albumId && albumLoading)) {
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
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/photo"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to albums
        </Link>
        <h1 className="text-xl font-semibold">
          {albumId ? "Edit Album" : "New Photo Content"}
        </h1>
      </div>

      {/* Main Content */}
      <div>
        {/* Content Location Selector */}
        {!albumId && (
          <Card className="p-6 mb-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Content Location
              </Label>
              <p className="text-sm text-muted-foreground">
                Where should this photo content be published?
              </p>
              <Select
                value={contentLocation}
                onValueChange={v =>
                  setContentLocation(v as "photo_album" | "passport")
                }
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo_album">
                    📸 Photo Album — gallery page
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
        {contentLocation === "passport" && !albumId && (
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
                  mediaType="image"
                  onSave={handlePassportSave}
                  saving={passportSaving}
                />
              )}
          </div>
        )}

        {/* Photo Album Mode (standard) */}
        {(contentLocation === "photo_album" || albumId) && (
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <EditorQaSummary title="Publish QA" issues={publishQa.issues} />

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Enter album title"
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
                  placeholder="album-url-slug"
                />
                <p className="text-xs text-muted-foreground">
                  URL: /photos/{slug || "album-slug"}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the album"
                  rows={3}
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                      value={coverImage}
                      onChange={e => setCoverImage(e.target.value)}
                      placeholder="https://example.com/album-cover.jpg"
                      className="flex-1"
                    />
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        id="cover-upload"
                        title="Upload Album Cover"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                        disabled={isUploadingCover}
                      />
                      <input
                        type="file"
                        id="cover-capture"
                        title="Take Album Cover Photo"
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCoverImageUpload}
                        disabled={isUploadingCover}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 cursor-pointer"
                        asChild
                        disabled={isUploadingCover}
                      >
                        <Label htmlFor="cover-upload">
                          <Upload size={16} />
                          {isUploadingCover ? "Uploading..." : "Choose Image"}
                        </Label>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 cursor-pointer"
                        asChild
                        disabled={isUploadingCover}
                      >
                        <Label htmlFor="cover-capture">
                          <Camera size={16} />
                          Take Photo
                        </Label>
                      </Button>
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

              <div className="space-y-2">
                <Label htmlFor="coverImageAlt">Cover Image Alt Text</Label>
                <Input
                  id="coverImageAlt"
                  value={coverImageAlt}
                  onChange={e => setCoverImageAlt(e.target.value)}
                  placeholder="Describe the album cover image"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={canonicalUrl}
                  onChange={e => setCanonicalUrl(e.target.value)}
                  placeholder="https://simplysoph.com/photos/your-album"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disclosureText">Disclosure</Label>
                <Textarea
                  id="disclosureText"
                  value={disclosureText}
                  onChange={e => setDisclosureText(e.target.value)}
                  rows={3}
                  placeholder="Example: This album contains affiliate product links."
                />
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

              <div className="space-y-2">
                <Label htmlFor="cityGuideNotes">City Guide Notes (one line per note)</Label>
                <Textarea
                  id="cityGuideNotes"
                  value={cityGuideNotesRaw}
                  onChange={e => setCityGuideNotesRaw(e.target.value)}
                  rows={4}
                  placeholder={"Neighborhood is walkable in daytime\nGolden hour starts around 6pm"}
                />
              </div>

              <div className="space-y-2">
                <FeaturedProductsEditor
                  value={featuredProducts}
                  onChange={setFeaturedProducts}
                  title="Featured products"
                  compact
                />
              </div>

              <div className="space-y-2">
                <RelatedLinksEditor
                  value={relatedLinks}
                  onChange={setRelatedLinks}
                  title="Related links"
                  compact
                />
              </div>

              {/* Photos Section */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Label>Photos ({photos.length})</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedPhotos.size > 0 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={deselectAllPhotos}
                        >
                          Deselect All
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={bulkDeletePhotos}
                          className="gap-1"
                        >
                          <Trash2 size={14} />
                          Delete ({selectedPhotos.size})
                        </Button>
                      </>
                    )}
                    {photos.length > 0 && selectedPhotos.size === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllPhotos}
                      >
                        Select All
                      </Button>
                    )}
                    <input
                      type="file"
                      multiple
                      title="Upload Photos"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <input
                      type="file"
                      title="Take Photos"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="photo-capture"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <Label
                        htmlFor="photo-upload"
                        className="cursor-pointer gap-2"
                      >
                        <Plus size={16} /> Choose Photos
                      </Label>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Label
                        htmlFor="photo-capture"
                        className="cursor-pointer gap-2"
                      >
                        <Camera size={16} /> Take Photo
                      </Label>
                    </Button>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {isDragOver
                      ? "Drop images here"
                      : "Drag & drop photos here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or use the buttons above. Maximum 10MB per image.
                  </p>
                  {uploadingPhotos.size > 0 && (
                    <p className="text-sm text-primary mt-2">
                      Uploading {uploadingPhotos.size} photo
                      {uploadingPhotos.size > 1 ? "s" : ""}...
                    </p>
                  )}
                </div>

                {/* Photo Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id || `temp-${index}`}
                        className={`relative group border-2 rounded-lg overflow-hidden ${
                          draggedIndex === index ? "opacity-50" : ""
                        } ${selectedPhotos.has(index) ? "border-primary" : "border-transparent"}`}
                        draggable
                        onDragStart={e => handleDragStart(e, index)}
                        onDragOver={e => handlePhotoDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="aspect-square overflow-hidden bg-muted">
                          <img
                            src={photo.imageUrl}
                            alt={photo.caption || `Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => togglePhotoSelection(index)}
                            className="gap-1"
                          >
                            {selectedPhotos.has(index) ? "✓" : "☐"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="cursor-move gap-1"
                          >
                            <GripVertical size={14} />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => removePhoto(index)}
                            className="gap-1"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            title="Select Photo"
                            checked={selectedPhotos.has(index)}
                            onChange={() => togglePhotoSelection(index)}
                            className="rounded border-gray-300"
                          />
                        </div>
                        <div className="mt-2 flex gap-1 items-center">
                          <Input
                            placeholder="Photo caption"
                            value={photo.caption}
                            onChange={e =>
                              updatePhotoCaption(index, e.target.value)
                            }
                            className="text-xs flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleGenerateCaption(index, photo.imageUrl)
                            }
                            disabled={
                              generatingCaptionIndex === index ||
                              !photo.imageUrl
                            }
                            title="Auto-generate Alt Text"
                            className="h-10 w-10 shrink-0 border-purple-500 text-purple-600 hover:bg-purple-50"
                          >
                            {generatingCaptionIndex === index ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Wand2 size={14} />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No photos uploaded yet. Drag & drop or select files above.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending || uploadingPhotos.size > 0}
                  className="gap-2"
                >
                  <Upload size={16} />
                  {uploadingPhotos.size > 0
                    ? `Uploading ${uploadingPhotos.size} photo${uploadingPhotos.size > 1 ? "s" : ""}...`
                    : saveMutation.isPending
                      ? "Saving..."
                      : "Save Album"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
