import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, Redirect, useRoute, useLocation } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useState, useEffect } from "react";

export default function AdminBlogEdit() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, params] = useRoute("/admin/blog/edit/:id");
  const [, setLocation] = useLocation();
  const postId = params?.id ?? null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const utils = trpc.useUtils();

  // Fetch existing post if editing
  const { data: existingPost, isLoading: postLoading } = trpc.admin.allPosts.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin' && Boolean(postId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => (postId ? data.find(p => p.id === postId) : undefined),
  });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setExcerpt(existingPost.excerpt || "");
      setContent(existingPost.content);
      setCoverImage(existingPost.coverImage || "");
      setStatus(existingPost.status);
    }
  }, [existingPost]);

  const createPost = trpc.admin.createPost.useMutation({
    onSuccess: () => {
      toast.success("Post created successfully");
      utils.admin.allPosts.invalidate();
      setLocation("/admin/blog");
    },
    onError: (error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });

  const updatePost = trpc.admin.updatePost.useMutation({
    onSuccess: () => {
      toast.success("Post updated successfully");
      utils.admin.allPosts.invalidate();
      setLocation("/admin/blog");
    },
    onError: (error) => {
      toast.error(`Failed to update post: ${error.message}`);
    },
  });

  if (authLoading || (postId && postLoading)) {
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
    if (!postId) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = (e: React.FormEvent, newStatus: "draft" | "published") => {
    e.preventDefault();

    try {
      if (!title.trim() || !slug.trim() || !content.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }

    const postData = {
      title,
      slug,
      excerpt: excerpt || undefined,
      content,
      coverImage: coverImage || undefined,
      status: newStatus,
    };

      if (postId) {
        updatePost.mutate({ id: postId, ...postData });
      } else {
        createPost.mutate(postData);
      }
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
              <Link href="/admin/blog">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft size={16} /> Back
                </Button>
              </Link>
              <h1 className="text-2xl font-heading font-bold">
                {postId ? "Edit Post" : "New Post"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={createPost.isPending || updatePost.isPending}
              >
                Save Draft
              </Button>
              <Button
                onClick={(e) => handleSubmit(e, "published")}
                disabled={createPost.isPending || updatePost.isPending}
                className="gap-2"
              >
                <Save size={16} /> Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        <Card className="p-8">
          <form className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter post title"
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
                placeholder="post-url-slug"
              />
              <p className="text-xs text-muted-foreground">
                URL: /blog/{slug || "post-slug"}
              </p>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description for post preview"
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
                placeholder="https://example.com/image.jpg"
              />
              {coverImage && (
                <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content * (Markdown supported)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here... Markdown is supported!"
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Supports Markdown: **bold**, *italic*, # headings, [links](url), etc.
              </p>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
