import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, Redirect } from "wouter";
import {
  FileText,
  Video,
  Image as ImageIcon,
  Tag,
  MessageSquare,
  Calendar,
  Compass,
} from "lucide-react";
import { LOGIN_PATH } from "@/const";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllBlogPosts,
  fetchPhotoAlbums,
  fetchVideos,
} from "@/lib/content";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: allPosts } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: () => fetchAllBlogPosts(),
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: videoEntries } = useQuery({
    queryKey: ["admin", "videos"],
    queryFn: () => fetchVideos(),
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: albums } = useQuery({
    queryKey: ["admin", "albums"],
    queryFn: () => fetchPhotoAlbums(),
    enabled: isAuthenticated && user?.role === "admin",
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

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to={LOGIN_PATH} />;
  }

  const publishedCount =
    allPosts?.filter(p => p.status === "published").length || 0;
  const draftCount = allPosts?.filter(p => p.status === "draft").length || 0;
  const videoCount = videoEntries?.length ?? 0;
  const albumCount = albums?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-heading font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Published Posts
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publishedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{draftCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{videoCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Photo Albums
              </CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{albumCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/blog">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <FileText size={24} />
                  </div>
                  <div>
                    <CardTitle>Manage Blog</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create and edit blog posts
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/video">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent">
                    <Video size={24} />
                  </div>
                  <div>
                    <CardTitle>Manage Videos</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload and organize videos
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/photo">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <CardTitle>Manage Photos</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create albums and upload photos
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/category">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-secondary/10 text-secondary">
                    <Tag size={24} />
                  </div>
                  <div>
                    <CardTitle>Manage Categories</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Organize content with categories
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/calendar">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <CardTitle>Content Calendar</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Schedule and plan content
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/destinations">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-orange-500/10 text-orange-600">
                    <Compass size={24} />
                  </div>
                  <div>
                    <CardTitle>Passport Destinations</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage passport stamps
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/comments">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <CardTitle>Moderate Comments</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review and manage user comments
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
