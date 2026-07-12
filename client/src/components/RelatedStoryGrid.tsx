import { Card, CardContent } from "@/components/ui/card";
import type { RelatedStoryCard } from "@/lib/services/growth";
import { ArrowRight, Film, Images, NotebookText } from "lucide-react";
import { Link } from "wouter";

const iconMap = {
  blog: NotebookText,
  video: Film,
  album: Images,
};

interface RelatedStoryGridProps {
  title?: string;
  stories: RelatedStoryCard[];
}

export default function RelatedStoryGrid({
  title = "Related content",
  stories,
}: RelatedStoryGridProps) {
  if (stories.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Cross-format story
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
            {title}
          </h2>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {stories.map(story => {
          const Icon = iconMap[story.type];
          return (
            <Link key={`${story.type}-${story.id}`} href={story.url}>
              <Card className="h-full cursor-pointer overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                {story.imageUrl && (
                  <div className="aspect-4/3 overflow-hidden bg-muted">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                    <Icon className="h-3.5 w-3.5" />
                    {story.type}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-[-0.02em] line-clamp-2">
                      {story.title}
                    </h3>
                    {story.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {story.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {story.matchReason}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
