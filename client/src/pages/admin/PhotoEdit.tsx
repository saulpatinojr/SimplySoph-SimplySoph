import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Redirect, useRoute, useLocation } from "wouter";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useEffect, useState } from "react";
import {
  fetchPhotoAlbumById,
  savePhotoAlbum,
  type PhotoAlbumInput,
  fetchCategories,
} from "@/lib/content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function AdminPhotoEdit() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, params] = useRoute("/admin/photo/edit/:id");
  const [, setLocation] = useLocation();
  const albumId = params?.id ?? null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const queryClient = useQueryClient();

  const {
    data: existingAlbum,
    isLoading: albumLoading,
  } = useQuery({
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

  useEffect(() => {
    if (existingAlbum) {
      setTitle(existingAlbum.title);
      setSlug(existingAlbum.slug);
      setDescription(existingAlbum.description || "");
      setCoverImage(existingAlbum.coverImage || "");
      setCategoryId(existingAlbum.categoryId || "");
    }
  }, [existingAlbum]);

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: PhotoAlbumInput; id?: string }) =>
      savePhotoAlbum(data, id),
    onSuccess: (_, variables) => {
      const message = variables.id ? "Album updated successfully" : "Album created successfully";
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

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Redirect to={LOGIN_PATH} />;
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!albumId) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!title.trim() || !slug.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }

      const albumData: PhotoAlbumInput = {
        title,
        slug,
        description: description || undefined,
        coverImage: coverImage || undefined,
        categoryId: categoryId || undefined,
        authorId:
          albumId && existingAlbum
            ? existingAlbum.authorId
            : user?.id ?? "anonymous",
      };

      saveMutation.mutate({ data: albumData, id: albumId ?? undefined });
    } catch (err) {
      console.error('Form submission error:', err);
      toast.error('An error occurred while submitting the form');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/photo">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={16} /> Back
                </Button>
              </Link>
              <h1 className="text-2xl font-heading font-bold">
                {albumId ? "Edit Album" : "New Album"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                <Save size={16} /> Save Album
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
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
                onChange={(e) => setSlug(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the album"
                rows={3}
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/album-cover.jpg"
              />
              {coverImage && (
                <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-muted max-w-sm">
                  <img
                    src={coverImage}
                    alt="Cover preview"
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
                  <SelectItem value="">No category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                <Upload size={16} />
                {saveMutation.isPending ? "Saving..." : "Save Album"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}