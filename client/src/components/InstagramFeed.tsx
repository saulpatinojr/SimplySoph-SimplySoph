import { Card } from "@/components/ui/card";
import { Instagram, ExternalLink } from "lucide-react";

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption?: string;
  permalink: string;
}

/**
 * Instagram Feed component that displays a grid of recent Instagram posts.
 * Currently uses placeholder/manual data. To integrate with Instagram API:
 * 1. Create a Facebook App with Instagram Basic Display API
 * 2. Generate a long-lived token
 * 3. Store the token securely (e.g., Firebase Functions env)
 * 4. Fetch media from `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink&access_token=...`
 */
export default function InstagramFeed({
  posts = [],
  maxItems = 6,
}: {
  posts?: InstagramPost[];
  maxItems?: number;
}) {
  // If no API posts, show a clean connect CTA
  if (posts.length === 0) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold mb-2">
              Follow Along
            </h2>
            <p className="text-muted-foreground">
              The latest looks & lifestyle on Instagram
            </p>
          </div>
          <Card className="max-w-md mx-auto p-8 text-center">
            <Instagram size={48} className="mx-auto text-primary mb-4" />
            <h3 className="font-heading font-bold text-lg mb-2">@smply.soph</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Follow for daily outfit inspo, travels, and behind-the-scenes
              content
            </p>
            <a
              href="https://www.instagram.com/smply.soph"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 btn-gold px-6 py-2.5 rounded-full text-white font-medium text-sm"
            >
              Follow on Instagram <ExternalLink size={14} />
            </a>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-heading font-bold mb-1">
              @smply.soph
            </h2>
            <p className="text-muted-foreground text-sm">
              Latest from Instagram
            </p>
          </div>
          <a
            href="https://www.instagram.com/smply.soph"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            Follow <ExternalLink size={12} />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {posts.slice(0, maxItems).map(post => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <img
                src={post.imageUrl}
                alt={post.caption || "Instagram post"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Instagram
                  size={24}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
