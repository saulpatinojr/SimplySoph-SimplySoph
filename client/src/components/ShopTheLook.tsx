import { Card } from "@/components/ui/card";
import { ExternalLink, ShoppingBag, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ShoppableItem {
  id: string;
  name: string;
  brand: string;
  price?: string;
  imageUrl: string;
  productUrl: string;
}

export interface LookData {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  items: ShoppableItem[];
}

/**
 * ShopTheLook component (#21) — Displays a styled look with
 * shoppable product cards linking to external retailers.
 */
export default function ShopTheLook({ look }: { look: LookData }) {
  return (
    <section className="py-12">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Look Image */}
            <div className="aspect-3/4 rounded-xl overflow-hidden shadow-lg bg-muted">
              <img
                src={look.imageUrl}
                alt={look.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Products */}
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
                  <ShoppingBag size={16} />
                  Shop the Look
                </div>
                <h2 className="text-2xl font-heading font-bold">
                  {look.title}
                </h2>
                {look.description && (
                  <p className="text-muted-foreground mt-2">
                    {look.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {look.items.map(item => (
                  <a
                    key={item.id}
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <Card className="flex items-center gap-4 p-3 hover:shadow-md transition-shadow">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {item.brand}
                        </p>
                        <p className="font-medium text-sm line-clamp-1">
                          {item.name}
                        </p>
                        {item.price && (
                          <p className="text-sm font-semibold text-primary flex items-center gap-1 mt-1">
                            <Tag size={12} />
                            {item.price}
                          </p>
                        )}
                      </div>
                      <ExternalLink
                        size={14}
                        className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                      />
                    </Card>
                  </a>
                ))}
              </div>

              {look.items.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  <ShoppingBag size={32} className="mx-auto mb-3" />
                  <p>Product links coming soon!</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
