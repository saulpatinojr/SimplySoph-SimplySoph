import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
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
import { useAuth } from "@/_core/hooks/useAuth";
import {
  createMenagerieBlog,
  fetchAllMenagerieBlogs,
  fetchAllPlushies,
  fetchMenagerieBlogById,
  MenagerieBlogInput,
  updateMenagerieBlog,
} from "@/lib/content";

export default function MenagerieBlogEdit() {
  const params = useParams();
  const id = params.id;
  const isNew = !id;

  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<MenagerieBlogInput>({
    title: "",
    body: "",
    emoji: "",
    imageUrl: "",
    sortOrder: 0,
    status: "draft",
    authorId: user?.uid || "",
  });

  useEffect(() => {
    if (user && formData.authorId === "") {
      setFormData(prev => ({ ...prev, authorId: user.uid }));
    }
  }, [formData.authorId, user]);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin", "menagerieBlogs", id],
    queryFn: () => fetchMenagerieBlogById(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        title: existing.title,
        body: existing.body,
        emoji: existing.emoji || "",
        imageUrl: existing.imageUrl || "",
        sortOrder: existing.sortOrder,
        status: existing.status,
        authorId: existing.authorId,
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        // Drop new diary entries at the end of the family flow by default;
        // reorder from the Menagerie list afterwards.
        const [plushies, blogs] = await Promise.all([
          fetchAllPlushies(),
          fetchAllMenagerieBlogs(),
        ]);
        const maxOrder = Math.max(
          0,
          ...plushies.map(p => p.sortOrder ?? 0),
          ...blogs.map(b => b.sortOrder)
        );
        await createMenagerieBlog({ ...formData, sortOrder: maxOrder + 10 });
      } else {
        await updateMenagerieBlog(id!, formData);
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Diary entry created!" : "Diary entry updated!");
      void queryClient.invalidateQueries({ queryKey: ["admin", "menagerieBlogs"] });
      void queryClient.invalidateQueries({ queryKey: ["menagerieBlogs"] });
      setLocation("/admin/menagerie");
    },
    onError: () => toast.error("Error saving diary entry"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast.error("Title and body are required");
      return;
    }
    saveMutation.mutate();
  }

  if (!isNew && isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/menagerie">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">
            {isNew ? "New Diary Entry" : "Edit Diary Entry"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="Turtle season: a winter report"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                value={formData.emoji || ""}
                onChange={e =>
                  setFormData(prev => ({ ...prev, emoji: e.target.value }))
                }
                placeholder="🐢"
                maxLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "draft" | "published") =>
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl || ""}
              onChange={e =>
                setFormData(prev => ({ ...prev, imageUrl: e.target.value }))
              }
              placeholder="https://…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Diary entry *</Label>
            <Textarea
              id="body"
              rows={8}
              value={formData.body}
              onChange={e =>
                setFormData(prev => ({ ...prev, body: e.target.value }))
              }
              placeholder="A short story from family life — what everyone's been up to between introductions."
              required
            />
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saveMutation.isPending ? "Saving..." : "Save Diary Entry"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
