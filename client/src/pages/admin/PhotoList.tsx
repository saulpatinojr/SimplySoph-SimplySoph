import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, Redirect } from "wouter";
import { Plus, Edit, Trash2, Eye, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePhotoAlbum, fetchPhotoAlbums } from "@/lib/content";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminPhotoList() {
  const { user, loading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["admin", "albums"],
    queryFn: () => fetchPhotoAlbums(),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const deleteAlbum = useMutation({
    mutationFn: (id: string) => deletePhotoAlbum(id),
    onSuccess: () => {
      toast.success("Album deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin", "albums"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete album: ${message}`);
    },
  });

  if (loading) {
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

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This will also delete all photos in the album.`)) {
      deleteAlbum.mutate(id);
    }
  };

  const formatDate = (value: Date | string | null | undefined) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Photo Albums</h1>
          <p className="text-muted-foreground">Manage your photo collections</p>
        </div>
        <Link href="/admin/photos/new">
          <Button className="gap-2">
            <Plus size={16} /> New Album
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div>
        {albumsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </Card>
            ))}
          </div>
        ) : albums && albums.length > 0 ? (
          <div className="space-y-4">
            {albums.map((album) => (
              <Card key={album.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-heading font-semibold">{album.title}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        Album
                      </span>
                    </div>
                    {album.description && (
                      <p className="text-muted-foreground text-sm mb-3">{album.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {formatDate(album.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/photos/${album.slug}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye size={14} /> View
                      </Button>
                    </Link>
                    <Link href={`/admin/photo/edit/${album.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit size={14} /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(album.id, album.title)}
                      disabled={deleteAlbum.isPending}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No photo albums yet</p>
            <Link href="/admin/photo/new">
              <Button className="gap-2">
                <Plus size={16} /> Create Your First Album
              </Button>
            </Link>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}