import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCategory, fetchCategories } from "@/lib/content";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminCategoryList() {
  const { user, loading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => fetchCategories(),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete category: ${message}`);
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


  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const formatDate = (value: Date | string | null | undefined) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "blog": return "bg-blue-100 text-blue-700";
      case "video": return "bg-red-100 text-red-700";
      case "photo": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      

      {/* Main Content */}
      <div>
        {categoriesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </Card>
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="space-y-4">
            {categories.map((category) => (
              <Card key={category.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-heading font-semibold">{category.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}>
                        {category.type}
                      </span>
                      {category.color && (
                        <div
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: category.color }}
                          title={category.color}
                        />
                      )}
                    </div>
                    {category.description && (
                      <p className="text-muted-foreground text-sm mb-3">{category.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {formatDate(category.createdAt)}</span>
                      <span>Slug: {category.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/admin/category/edit/${category.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit size={14} /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={deleteCategoryMutation.isPending}
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
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <Link href="/admin/category/new">
              <Button className="gap-2">
                <Plus size={16} /> Create Your First Category
              </Button>
            </Link>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}