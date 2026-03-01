import { useState, useEffect } from "react";
import { Link, useLocation, Redirect } from "wouter";
import {
  fetchAllDestinations,
  deleteDestination,
  Destination,
} from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";

export default function DestinationList() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      loadDestinations();
    }
  }, [isAuthenticated, user]);

  const loadDestinations = async () => {
    try {
      const data = await fetchAllDestinations();
      setDestinations(data);
    } catch (error) {
      toast.error("Error loading destinations", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDestination(deleteId);
      toast.success("Destination deleted");
      setDestinations(prev => prev.filter(d => d.id !== deleteId));
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete destination.",
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (authLoading) {
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

        {loading ? (
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
                        setLocation(`/admin/destinations/${dest.id}`)
                      }
                    >
                      <Edit size={16} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure? This action cannot be undone."
                          )
                        ) {
                          setDeleteId(dest.id);
                          setTimeout(() => handleDelete(), 0);
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
