import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContentProduct } from "@/lib/content";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FeaturedProductsEditorProps {
  value: ContentProduct[];
  onChange: (next: ContentProduct[]) => void;
  title?: string;
  compact?: boolean;
}

function createEmptyProduct(): ContentProduct {
  return {
    id: crypto.randomUUID(),
    name: "",
    brand: "",
    imageUrl: "",
    productUrl: "",
    price: "",
    retailer: "",
    notes: "",
  };
}

export default function FeaturedProductsEditor({
  value,
  onChange,
  title = "Featured products",
  compact = false,
}: FeaturedProductsEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [pendingInputFocusIndex, setPendingInputFocusIndex] = useState<
    number | null
  >(null);
  const [pendingToggleFocusIndex, setPendingToggleFocusIndex] = useState<
    number | null
  >(null);
  const [liveMessage, setLiveMessage] = useState("");
  const firstInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const toggleButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const previousIssueCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!compact) return;
    if (expandedIndex !== null && expandedIndex >= (value || []).length) {
      setExpandedIndex((value || []).length > 0 ? (value || []).length - 1 : null);
    }
  }, [compact, expandedIndex, value]);

  useEffect(() => {
    if (pendingInputFocusIndex === null) return;
    const element = firstInputRefs.current[pendingInputFocusIndex];
    if (element) {
      element.focus();
    }
    setPendingInputFocusIndex(null);
  }, [pendingInputFocusIndex, value]);

  useEffect(() => {
    if (pendingToggleFocusIndex === null) return;
    const element = toggleButtonRefs.current[pendingToggleFocusIndex];
    if (element) {
      element.focus();
    }
    setPendingToggleFocusIndex(null);
  }, [pendingToggleFocusIndex, value]);

  function addProduct() {
    const next = [...(value || []), createEmptyProduct()];
    onChange(next);
    if (compact) {
      const nextIndex = next.length - 1;
      setExpandedIndex(nextIndex);
      setPendingInputFocusIndex(nextIndex);
    }
  }

  function updateProduct(index: number, patch: Partial<ContentProduct>) {
    const next = [...(value || [])];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeProduct(index: number) {
    const next = (value || []).filter((_, itemIndex) => itemIndex !== index);
    onChange(next);
    if (compact) {
      if (next.length === 0) {
        setExpandedIndex(null);
        return;
      }
      const nextIndex = Math.min(index, next.length - 1);
      setExpandedIndex(nextIndex);
      setPendingToggleFocusIndex(nextIndex);
    }
  }

  function isWebUrl(value: string) {
    if (!value.trim()) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  function getProductErrors(product: ContentProduct) {
    const name = product.name.trim();
    const productUrl = product.productUrl.trim();
    const imageUrl = (product.imageUrl || "").trim();

    return {
      name: name ? "" : "Product name is required.",
      productUrl: productUrl
        ? isWebUrl(productUrl)
          ? ""
          : "Product URL must be a valid http(s) URL."
        : "Product URL is required.",
      imageUrl:
        imageUrl && !isWebUrl(imageUrl)
          ? "Image URL must be a valid http(s) URL."
          : "",
    };
  }

  function getErrorCount(product: ContentProduct) {
    const errors = getProductErrors(product);
    return Object.values(errors).filter(Boolean).length;
  }

  const totalIssueCount = (value || []).reduce(
    (sum, product) => sum + getErrorCount(product),
    0
  );

  useEffect(() => {
    if (previousIssueCountRef.current === null) {
      previousIssueCountRef.current = totalIssueCount;
      return;
    }

    if (previousIssueCountRef.current !== totalIssueCount) {
      setLiveMessage(
        totalIssueCount === 0
          ? `All validation issues resolved in ${title}.`
          : `${title} now has ${totalIssueCount} validation issue${totalIssueCount > 1 ? "s" : ""}.`
      );
      previousIssueCountRef.current = totalIssueCount;
    }
  }, [title, totalIssueCount]);

  function toggleExpanded(index: number) {
    if (!compact) return;
    setExpandedIndex(prev => (prev === index ? null : index));
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {liveMessage}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-base">{title}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </div>

      {(value || []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No products added yet.</p>
      ) : (
        <div className={cn("space-y-3", compact && "space-y-2")}>
          {(value || []).map((product, index) => (
            <section key={product.id || index} className="rounded-md border">
              <button
                type="button"
                ref={element => {
                  toggleButtonRefs.current[index] = element;
                }}
                onClick={() => toggleExpanded(index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={!compact || expandedIndex === index}
                aria-controls={`featured-product-panel-${index}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Product {index + 1}: {product.name.trim() || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.brand?.trim() || "No brand set"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getErrorCount(product) > 0 ? (
                    <span className="text-xs font-medium text-destructive">
                      {getErrorCount(product)} issue
                      {getErrorCount(product) > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">Ready</span>
                  )}
                  {compact && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedIndex === index && "rotate-180"
                        )}
                      />
                      {expandedIndex === index ? "Collapse" : "Expand"}
                    </span>
                  )}
                </div>
              </button>

              {(!compact || expandedIndex === index) && (
              <div
                id={`featured-product-panel-${index}`}
                className={cn("grid gap-3 border-t p-4 md:grid-cols-2", compact && "gap-2 p-3")}
              >
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Core</Label>
                  <Input
                    ref={element => {
                      firstInputRefs.current[index] = element;
                    }}
                    value={product.name}
                    onChange={event => updateProduct(index, { name: event.target.value })}
                    placeholder="Product name *"
                    className={cn(getProductErrors(product).name && "border-destructive focus-visible:ring-destructive")}
                  />
                  {getProductErrors(product).name && (
                    <p className="text-xs text-destructive">{getProductErrors(product).name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Brand</Label>
                  <Input
                    value={product.brand}
                    onChange={event => updateProduct(index, { brand: event.target.value })}
                    placeholder="Brand"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Commerce</Label>
                  <Input
                    value={product.productUrl}
                    onChange={event => updateProduct(index, { productUrl: event.target.value })}
                    placeholder="Product URL *"
                    className={cn(getProductErrors(product).productUrl && "border-destructive focus-visible:ring-destructive")}
                  />
                  {getProductErrors(product).productUrl && (
                    <p className="text-xs text-destructive">{getProductErrors(product).productUrl}</p>
                  )}
                </div>

                <Input
                  value={product.price || ""}
                  onChange={event => updateProduct(index, { price: event.target.value })}
                  placeholder="Price"
                />

                <Input
                  value={product.retailer || ""}
                  onChange={event => updateProduct(index, { retailer: event.target.value })}
                  placeholder="Retailer"
                />

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Media</Label>
                  <Input
                    value={product.imageUrl || ""}
                    onChange={event => updateProduct(index, { imageUrl: event.target.value })}
                    placeholder="Image URL"
                    className={cn(getProductErrors(product).imageUrl && "border-destructive focus-visible:ring-destructive")}
                  />
                  {getProductErrors(product).imageUrl && (
                    <p className="text-xs text-destructive">{getProductErrors(product).imageUrl}</p>
                  )}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Internal notes</Label>
                  <Textarea
                    value={product.notes || ""}
                    onChange={event => updateProduct(index, { notes: event.target.value })}
                    placeholder="Editor notes"
                    rows={compact ? 2 : 3}
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeProduct(index)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove product
                  </Button>
                </div>
              </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
