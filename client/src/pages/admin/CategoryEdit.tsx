import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Redirect, useParams, useLocation } from "wouter";
import { ArrowLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import { LOGIN_PATH } from "@/const";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCategoryById, saveCategory } from "@/lib/content";
import { useState, useEffect } from "react";
import { Category } from "@/lib/content";
import DashboardLayout from "@/components/DashboardLayout";

const CATEGORY_TYPES = [
  { value: "blog", label: "Blog Posts" },
  { value: "video", label: "Videos" },
  { value: "photo", label: "Photo Albums" },
];

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#F97316", // Orange
];

export default function AdminCategoryEdit() {
  const { user, loading, isAuthenticated } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const categoryId = params.id === "new" ? null : params.id;

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "",
    color: "",
  });

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["admin", "category", categoryId],
    queryFn: () => fetchCategoryById(categoryId!),
    enabled: isAuthenticated && user?.role === "admin" && !!categoryId,
  });

  const saveCategoryMutation = useMutation({
    mutationFn: (data: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
      const input = {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        color: data.color || undefined,
        type: data.type,
      };
      return saveCategory(input, categoryId || undefined);
    },
    onSuccess: () => {
      toast.success(categoryId ? "Category updated successfully" : "Category created successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setLocation("/admin/category");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save category: ${message}`);
    },
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        type: category.type,
        color: category.color || "",
      });
    }
  }, [category]);

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
    return <Redirect to={LOGIN_PATH} />;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!formData.type) {
      toast.error("Category type is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Category slug is required");
      return;
    }

    saveCategoryMutation.mutate({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type as "blog" | "video" | "photo",
      color: formData.color || undefined,
    });
  };

  if (categoryId && categoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      

      {/* Main Content */}
      <div>
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="category-slug"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  URL-friendly identifier. Auto-generated from name.
                </p>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Content Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        style={{ backgroundColor: color }}
                        className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                        onClick={() => handleInputChange("color", color)}
                        title={color}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange("color", "")}
                  >
                    Clear
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optional color for visual organization.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
            </form>
          </Card>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}