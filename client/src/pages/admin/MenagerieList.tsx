import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildFamilyFrames,
  deleteMenagerieBlog,
  deletePlush,
  fetchAllMenagerieBlogs,
  fetchAllPlushies,
  FamilyFrame,
  updateMenagerieBlog,
  updatePlush,
} from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookHeart,
  Edit,
  Plane,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

function frameKey(frame: FamilyFrame): string {
  return frame.kind === "plush" ? `plush-${frame.plush.id}` : `blog-${frame.blog.id}`;
}

export default function MenagerieList() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const enabled = isAuthenticated && user?.role === "admin";

  const { data: plushies = [], isLoading: plushiesLoading } = useQuery({
    queryKey: ["admin", "menagerie"],
    queryFn: fetchAllPlushies,
    enabled,
  });
  const { data: blogs = [], isLoading: blogsLoading } = useQuery({
    queryKey: ["admin", "menagerieBlogs"],
    queryFn: fetchAllMenagerieBlogs,
    enabled,
  });

  const isLoading = plushiesLoading || blogsLoading;
  const frames = buildFamilyFrames(plushies, blogs);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["admin", "menagerie"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "menagerieBlogs"] });
    void queryClient.invalidateQueries({ queryKey: ["menagerie"] });
    void queryClient.invalidateQueries({ queryKey: ["menagerieBlogs"] });
  }

  // Reordering renumbers every frame to index*10 (with the moved pair
  // swapped), then persists only the frames whose sortOrder changed.
  const reorderMutation = useMutation({
    mutationFn: async ({ index, delta }: { index: number; delta: -1 | 1 }) => {
      const next = [...frames];
      const target = index + delta;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];

      const writes: Promise<void>[] = [];
      next.forEach((frame, i) => {
        const desired = (i + 1) * 10;
        if (frame.sortOrder !== desired) {
          writes.push(
            frame.kind === "plush"
              ? updatePlush(frame.plush.id, { sortOrder: desired })
              : updateMenagerieBlog(frame.blog.id, { sortOrder: desired })
          );
        }
      });
      await Promise.all(writes);
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not reorder frames"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (frame: FamilyFrame) => {
      if (frame.kind === "plush") {
        await deletePlush(frame.plush.id);
      } else {
        await deleteMenagerieBlog(frame.blog.id);
      }
    },
    onSuccess: () => {
      toast.success("Frame removed");
      invalidate();
    },
    onError: () => toast.error("Failed to delete frame"),
  });

  const busy = reorderMutation.isPending || deleteMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 mb-2">
                <ArrowLeft size={16} />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold">
              Menagerie — Meet the Family
            </h1>
            <p className="text-sm text-muted-foreground">
              This list mirrors the public page order. Use the arrows to move
              plush and diary frames up or down.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/menagerie/blog/new">
              <Button variant="outline" className="gap-2">
                <BookHeart size={16} /> New Diary Entry
              </Button>
            </Link>
            <Link href="/admin/menagerie/new">
              <Button className="gap-2">
                <Plus size={16} /> New Plush
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : frames.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No family members yet. Add the first plush!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {frames.map((frame, index) => (
              <Card
                key={frameKey(frame)}
                className={frame.kind === "blog" ? "border-dashed border-primary/40" : undefined}
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    {/* Reorder controls */}
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={busy || index === 0}
                        aria-label="Move up"
                        onClick={() =>
                          reorderMutation.mutate({ index, delta: -1 })
                        }
                      >
                        <ArrowUp size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={busy || index === frames.length - 1}
                        aria-label="Move down"
                        onClick={() =>
                          reorderMutation.mutate({ index, delta: 1 })
                        }
                      >
                        <ArrowDown size={15} />
                      </Button>
                    </div>

                    {frame.kind === "plush" ? (
                      <>
                        {frame.plush.heroPhoto?.url ? (
                          <img
                            src={
                              frame.plush.heroPhoto.thumbnailUrl ||
                              frame.plush.heroPhoto.url
                            }
                            alt={frame.plush.name}
                            className="h-14 w-14 shrink-0 rounded-full bg-white object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
                            🧸
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="flex items-center gap-2 font-semibold">
                            <span className="truncate">{frame.plush.name}</span>
                            {frame.plush.travelsWithMe && (
                              <Plane
                                size={13}
                                className="shrink-0 text-muted-foreground"
                              />
                            )}
                          </h3>
                          <p className="truncate text-sm text-muted-foreground">
                            {frame.plush.species} · introduced{" "}
                            {frame.plush.adoptionDate.toLocaleDateString()}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${frame.plush.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {frame.plush.status}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-primary/40 bg-primary/5 text-xl">
                          {frame.blog.emoji || "📖"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">
                            {frame.blog.title}
                          </h3>
                          <p className="truncate text-sm text-muted-foreground">
                            Diary entry
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${frame.blog.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                          >
                            {frame.blog.status}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLocation(
                          frame.kind === "plush"
                            ? `/admin/menagerie/edit/${frame.plush.id}`
                            : `/admin/menagerie/blog/edit/${frame.blog.id}`
                        )
                      }
                    >
                      <Edit size={16} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure? This action cannot be undone."
                          )
                        ) {
                          deleteMutation.mutate(frame);
                        }
                      }}
                    >
                      <Trash2 size={16} className="mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
