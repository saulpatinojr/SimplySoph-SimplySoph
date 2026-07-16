import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Edit, Trash2, Eye, ArrowLeft, Play } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteVideo, fetchVideos } from "@/lib/content";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminVideoList() {
  const { user, loading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["admin", "videos"],
    queryFn: () => fetchVideos(),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => {
      toast.success("Video deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin", "videos"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete video: ${message}`);
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


  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteVideoMutation.mutate(id);
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
      

      {/* Main Content */}
      <div>
        {videosLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </Card>
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="space-y-4">
            {videos.map((video) => (
              <Card key={video.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-heading font-semibold">{video.title}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        Video
                      </span>
                    </div>
                    {video.description && (
                      <p className="text-muted-foreground text-sm mb-3">{video.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {formatDate(video.createdAt)}</span>
                      <span>Published: {formatDate(video.publishedAt)}</span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} /> {video.views} views
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/videos/${video.slug}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Play size={14} /> View
                      </Button>
                    </Link>
                    <Link href={`/admin/video/edit/${video.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit size={14} /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(video.id, video.title)}
                      disabled={deleteVideoMutation.isPending}
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
            <p className="text-muted-foreground mb-4">No videos yet</p>
            <Link href="/admin/video/new">
              <Button className="gap-2">
                <Plus size={16} /> Upload Your First Video
              </Button>
            </Link>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}