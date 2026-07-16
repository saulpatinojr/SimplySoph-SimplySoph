import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllPlushies, deletePlush } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowLeft, Plane } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

export default function MenagerieList() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: plushies = [], isLoading } = useQuery({
    queryKey: ["admin", "menagerie"],
    queryFn: fetchAllPlushies,
    enabled: isAuthenticated && user?.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlush,
    onSuccess: () => {
      toast.success("Plush removed from the menagerie");
      void queryClient.invalidateQueries({ queryKey: ["admin", "menagerie"] });
    },
    onError: () => {
      toast.error("Error", { description: "Failed to delete plush." });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 mb-2">
                <ArrowLeft size={16} />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold">Menagerie</h1>
          </div>
          <Link href="/admin/menagerie/new">
            <Button className="gap-2">
              <Plus size={16} /> New Plush
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : plushies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No plushies yet. Add the first adoption certificate!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {plushies.map(plush => (
              <Card key={plush.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    {plush.heroPhoto?.url ? (
                      <img
                        src={plush.heroPhoto.thumbnailUrl || plush.heroPhoto.url}
                        alt={plush.name}
                        className="w-16 h-16 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl">
                        🧸
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {plush.name}
                        {plush.travelsWithMe && (
                          <Plane size={14} className="text-muted-foreground" />
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {plush.species} · adopted{" "}
                        {plush.adoptionDate.toLocaleDateString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${plush.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {plush.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLocation(`/admin/menagerie/edit/${plush.id}`)
                      }
                    >
                      <Edit size={16} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure? This action cannot be undone."
                          )
                        ) {
                          deleteMutation.mutate(plush.id);
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
