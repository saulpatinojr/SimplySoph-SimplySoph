import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Heart, ExternalLink } from "lucide-react";
import { API_BASE, TIKTOK_PROFILE_URL } from "@/const";

export interface TikTokComment {
  id: string;
  text: string;
  author: string;
  likes: number;
  avatarUrl?: string;
}

export interface TikTokCommentFeedProps {
  /** TikTok video ID to pull comments from via the Display API proxy */
  videoId: string;
  /** Max comments to display (default: 8) */
  maxComments?: number;
  /** Direct link to the specific TikTok video; falls back to profile URL */
  videoUrl?: string;
}

const FALLBACK_COMMENTS: TikTokComment[] = [
  { id: "1", text: "Obsessed with this look! \ud83d\ude0d", author: "fashionfan22", likes: 142 },
  { id: "2", text: "Where is this top from?? Need it", author: "shopaholic_g", likes: 89 },
  { id: "3", text: "the way she styled this is so clean", author: "aestheticvibes", likes: 67 },
  { id: "4", text: "okay the accessories chef\u2019s kiss \ud83e\udd0c", author: "trendsetter99", likes: 55 },
  { id: "5", text: "tutorial please!!", author: "newbie_style", likes: 43 },
];

/**
 * TikTokCommentFeed
 *
 * Renders a scrollable, branded comment wall pulled from a TikTok video via
 * the Firebase Function proxy at `{API_BASE}/tiktok/comments`.
 * Falls back to sample comments with a notice if the API is not yet configured.
 *
 * SETUP:
 *  1. Set VITE_TIKTOK_VIDEO_ID in .env
 *  2. Deploy Firebase Function `tiktokComments` (functions/src/tiktok.ts)
 *  3. Set TikTok app credentials in Firebase Functions env config
 */
export default function TikTokCommentFeed({
  videoId,
  maxComments = 8,
  videoUrl,
}: TikTokCommentFeedProps) {
  const [comments, setComments] = useState<TikTokComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setIsFallback(false);
    try {
      const res = await fetch(
        `${API_BASE}/tiktok/comments?videoId=${encodeURIComponent(videoId)}&max=${maxComments}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch (err) {
      console.error("[TikTokCommentFeed]", err);
      setComments(FALLBACK_COMMENTS);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, [videoId, maxComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const externalUrl = videoUrl || TIKTOK_PROFILE_URL;

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-heading font-bold tracking-tight">
              What the Comments Don\u2019t Lie About
            </h2>
          </div>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            View on TikTok <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {isFallback && (
          <p className="text-xs text-amber-500 mb-4 italic">
            Showing sample comments \u2014 connect TikTok API for live data.
          </p>
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
          <div
            className="space-y-3 max-h-80 overflow-y-auto pr-1"
            role="feed"
            aria-label="TikTok comments"
          >
            {comments.map((comment) => (
              <article
                key={comment.id}
                className="flex gap-3 items-start rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm hover:border-primary/40 transition-colors"
              >
                {comment.avatarUrl ? (
                  <img
                    src={comment.avatarUrl}
                    alt={`${comment.author} avatar`}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
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
                <div
                  className="flex items-center gap-1 text-xs text-muted-foreground shrink-0"
                  aria-label={`${comment.likes} likes`}
                >
                  <Heart className="w-3 h-3" aria-hidden="true" />
                  <span>{comment.likes}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
