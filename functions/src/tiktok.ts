import { Request, Response } from "firebase-functions";
import { logInfo, logWarn } from "./telemetry";

export interface TikTokComment {
  id: string;
  text: string;
  author: string;
  likes: number;
  avatarUrl?: string;
}

/**
 * handleTikTokComments
 *
 * GET /api/tiktok/comments?videoId=<id>&max=<n>
 *
 * Proxies TikTok Display API v2 comment list for a given video.
 * Requires TIKTOK_ACCESS_TOKEN in Firebase Functions environment:
 *   firebase functions:secrets:set TIKTOK_ACCESS_TOKEN   (v2)
 *   OR set via process.env for local emulator
 *
 * When credentials are absent the handler returns { comments: [] } so the
 * frontend falls back to its own sample data gracefully.
 */
export async function handleTikTokComments(
  req: Request,
  res: Response
): Promise<void> {
  const videoId = req.query.videoId as string | undefined;
  const max = Math.min(parseInt((req.query.max as string) || "8", 10), 20);

  if (!videoId) {
    res.status(400).json({ error: "videoId query param is required" });
    return;
  }

  // Credentials come from Firebase Functions env config (server-side only)
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!accessToken) {
    // No credentials yet — return empty so the frontend fallback takes over
    logInfo("tiktok.comments.unconfigured", { videoId, reason: "missing_access_token" });
    res.json({ comments: [] });
    return;
  }

  const url =
    `https://open.tiktokapis.com/v2/video/comment/list/` +
    `?fields=id,text,like_count,create_time` +
    `&video_id=${encodeURIComponent(videoId)}` +
    `&max_count=${max}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `TikTok API responded ${response.status}: ${await response.text()}`
      );
    }

    const data = (await response.json()) as {
      data?: {
        comments?: Array<{
          id: string;
          text: string;
          display_name?: string;
          username?: string;
          like_count?: number;
          avatar_url?: string;
        }>;
      };
    };

    const rawComments = data?.data?.comments ?? [];

    const comments: TikTokComment[] = rawComments.map(c => ({
      id: c.id,
      text: c.text,
      author: c.display_name ?? c.username ?? "tiktokuser",
      likes: c.like_count ?? 0,
      avatarUrl: c.avatar_url,
    }));

    res.json({ comments });
  } catch (err) {
    logWarn("tiktok.comments.fetch_failed", { videoId, error: err });
    // Graceful degradation — frontend will use its sample comments
    res.json({ comments: [] });
  }
}
