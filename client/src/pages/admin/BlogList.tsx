import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, Redirect } from "wouter";
import { Plus, Edit, Trash2, Eye, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminBlogList() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: posts, isLoading: postsLoading } = trpc.admin.allPosts.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const deletePost = trpc.admin.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post deleted successfully");
      utils.admin.allPosts.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete post: ${error.message}`);
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
    return <Redirect to="/" />;
  }

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deletePost.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={16} /> Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-heading font-bold">Manage Blog Posts</h1>
            </div>
            <Link href="/admin/blog/new">
              <Button className="gap-2">
                <Plus size={16} /> New Post
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </Card>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-heading font-semibold">{post.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.publishedAt && (
                        <span>
                          Published: {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye size={14} /> {post.views} views
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {post.status === 'published' && (
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye size={14} /> View
                        </Button>
                      </Link>
                    )}
                    <Link href={`/admin/blog/edit/${post.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit size={14} /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(post.id, post.title)}
                      disabled={deletePost.isPending}
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
            <p className="text-muted-foreground mb-4">No blog posts yet</p>
            <Link href="/admin/blog/new">
              <Button className="gap-2">
                <Plus size={16} /> Create Your First Post
              </Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
