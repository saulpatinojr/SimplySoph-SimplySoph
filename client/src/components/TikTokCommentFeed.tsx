import { useEffect, useState } from "react";
import { MessageCircle, Heart, ExternalLink } from "lucide-react";

interface TikTokComment {
  id: string;
  text: string;
  author: string;
  likes: number;
  avatarUrl?: string;
}

interface TikTokCommentFeedProps {
  /** TikTok video ID to pull comments from (via Display API) */
  videoId: string;
  /** Max number of comments to show */
  maxComments?: number;
  /** Optional direct link back to the TikTok video */
  videoUrl?: string;
}

/**
 * TikTokCommentFeed
 *
 * Fetches comments from a TikTok video using the TikTok Display API
 * (proxied through Firebase Functions at /api/tiktok/comments) and
 * renders them in a scrollable, branded feed on the site.
 *
 * SETUP:
 *  1. Set VITE_TIKTOK_VIDEO_ID in your .env (or pass via prop)
 *  2. Deploy the Firebase Function `tiktokComments` (see functions/src/tiktok.ts)
 *  3. Add your TikTok app credentials to Firebase Functions environment config
 */
export default function TikTokCommentFeed({
  videoId,
  maxComments = 8,
  videoUrl,
}: TikTokCommentFeedProps) {
  const [comments, setComments] = useState<TikTokComment[]>([]);
  // Fix #3: start as false — skeleton was spinning forever when videoId is empty
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/tiktok/comments?videoId=${encodeURIComponent(videoId)}&max=${maxComments}`
        );
        if (!res.ok) throw new Error("Failed to fetch comments");
        const data = await res.json();
        setComments(data.comments ?? []);
      } catch (err) {
        console.error("TikTokCommentFeed error:", err);
        setComments([
          { id: "1", text: "Obsessed with this look! 😍", author: "fashionfan22", likes: 142 },
          { id: "2", text: "Where is this top from?? Need it", author: "shopaholic_g", likes: 89 },
          { id: "3", text: "the way she styled this is so clean", author: "aestheticvibes", likes: 67 },
          { id: "4", text: "okay the accessories chef's kiss 🤌", author: "trendsetter99", likes: 55 },
          { id: "5", text: "tutorial please!!", author: "newbie_style", likes: 43 },
        ]);
        setError("Showing sample comments — connect TikTok API for live data");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [videoId, maxComments]);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            What the Comments Don't Lie About
          </h2>
        </div>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            View on TikTok <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-500 mb-3 italic">{error}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 items-start">
              <div className="rounded-full bg-muted w-8 h-8 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Fix #5: removed scrollbar-thin/scrollbar-thumb-muted (requires tailwind-scrollbar plugin)
        // Use overflow-y-auto with a plain scrollbar — install tailwind-scrollbar later if desired
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 items-start rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm hover:border-primary/40 transition-colors"
            >
              {comment.avatarUrl ? (
                <img
                  src={comment.avatarUrl}
                  alt={comment.author}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary uppercase">
                    {comment.author?.[0] ?? "?"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                  @{comment.author}
                </p>
                <p className="text-sm text-foreground leading-snug break-words">
                  {comment.text}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Heart className="w-3 h-3" />
                <span>{comment.likes}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
