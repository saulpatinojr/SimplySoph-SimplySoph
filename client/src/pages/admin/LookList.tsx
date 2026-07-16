import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllLooks, deleteLook } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

export default function LookList() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: looks = [], isLoading } = useQuery({
    queryKey: ["admin", "looks"],
    queryFn: fetchAllLooks,
    enabled: isAuthenticated && user?.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLook,
    onSuccess: () => {
      toast.success("Look deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "looks"] });
    },
    onError: () => {
      toast.error("Error", { description: "Failed to delete look." });
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
            <h1 className="text-3xl font-heading font-bold">Looks</h1>
          </div>
          <Link href="/admin/looks/new">
            <Button className="gap-2">
              <Plus size={16} /> New Look
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : looks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No looks yet. Style the first one!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {looks.map(look => (
              <Card key={look.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    {look.heroImageUrl ? (
                      <img
                        src={look.heroImageUrl}
                        alt={look.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-2xl">
                        👗
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{look.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {look.season && (
                          <span className="capitalize">{look.season}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <ShoppingBag size={12} /> {look.products.length}{" "}
                          products
                        </span>
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${look.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {look.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/admin/looks/edit/${look.id}`)}
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
                          deleteMutation.mutate(look.id);
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
