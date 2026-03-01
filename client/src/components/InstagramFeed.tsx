import { Card } from "@/components/ui/card";
import { Instagram, ExternalLink, Youtube } from "lucide-react";

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
const TikTokIcon = ({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 15.68a6.34 6.34 0 006.33 6.32 6.33 6.33 0 006.33-6.32V10a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-2.84-.43z" />
  </svg>
);

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
          <div className="text-center mb-10">
            <h2 className="text-3xl font-heading font-bold mb-3">
              Follow Along
            </h2>
            <p className="text-muted-foreground">
              Connect with me across all platforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Instagram Card */}
            <Card className="p-8 text-center flex flex-col h-full hover:shadow-md transition-shadow">
              <Instagram size={48} className="mx-auto text-primary mb-4" />
              <h3 className="font-heading font-bold text-lg mb-2">
                @simply.soph
              </h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Follow for daily outfit inspo, travels, and behind-the-scenes
                content.
              </p>
              <a
                href="https://www.instagram.com/simply.soph"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 btn-gold px-6 py-2.5 rounded-full text-white font-medium text-sm mt-auto hover:-translate-y-0.5 transition-transform"
              >
                Follow on Instagram <ExternalLink size={14} />
              </a>
            </Card>

            {/* YouTube Card */}
            <Card className="p-8 text-center flex flex-col h-full hover:shadow-md transition-shadow">
              <Youtube size={48} className="mx-auto text-red-600 mb-4" />
              <h3 className="font-heading font-bold text-lg mb-2">
                @smplysoph
              </h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Watch full vlogs, styling guides, and detailed lifestyle videos.
              </p>
              <a
                href="https://www.youtube.com/@smplysoph"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-full text-white font-medium text-sm mt-auto hover:-translate-y-0.5 transition-all"
              >
                Subscribe on YouTube <ExternalLink size={14} />
              </a>
            </Card>

            {/* TikTok Card */}
            <Card className="p-8 text-center flex flex-col h-full hover:shadow-md transition-shadow">
              <TikTokIcon
                size={48}
                className="mx-auto text-black dark:text-white mb-4"
              />
              <h3 className="font-heading font-bold text-lg mb-2">
                @smply.soph
              </h3>
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                Catch quick tips, trending sounds, and short-form fun.
              </p>
              <a
                href="https://www.tiktok.com/@smply.soph"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 hover:bg-gray-800 px-6 py-2.5 rounded-full text-white font-medium text-sm mt-auto hover:-translate-y-0.5 transition-all"
              >
                Follow on TikTok <ExternalLink size={14} />
              </a>
            </Card>
          </div>
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
