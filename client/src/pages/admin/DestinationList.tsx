import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllDestinations, deleteDestination } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { queryKeys } from "@/lib/queryKeys";

export default function DestinationList() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["admin", "destinations"],
    queryFn: fetchAllDestinations,
    enabled: isAuthenticated && user?.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDestination,
    onSuccess: () => {
      toast.success("Destination deleted");
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.destinations(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.destinations.root,
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to delete destination.",
      });
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
            <h1 className="text-3xl font-heading font-bold">
              Passport Destinations
            </h1>
          </div>
          <Link href="/admin/destinations/new">
            <Button className="gap-2">
              <Plus size={16} /> New Destination
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : destinations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No destinations found. Create one to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {destinations.map(dest => (
              <Card key={dest.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    {dest.coverStampUrl && (
                      <img
                        src={dest.coverStampUrl}
                        alt={dest.city}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{dest.city}</h3>
                      <p className="text-sm text-muted-foreground">
                        {dest.date.toLocaleDateString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${dest.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {dest.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLocation(`/admin/destinations/edit/${dest.id}`)
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
                          deleteMutation.mutate(dest.id);
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
