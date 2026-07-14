import { Request, Response } from "firebase-functions";

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink: string;
  timestamp?: string;
}

/**
 * handleInstagramMedia
 *
 * GET /api/instagram/media?max=<n>
 *
 * Proxies the Instagram Graph API media list for the connected account.
 * Requires INSTAGRAM_ACCESS_TOKEN in Firebase Functions environment:
 *   firebase functions:secrets:set INSTAGRAM_ACCESS_TOKEN
 *   OR set via process.env for local emulator
 *
 * When credentials are absent the handler returns { media: [] } so the
 * frontend falls back to its "connect" CTA gracefully.
 */
export async function handleInstagramMedia(
  req: Request,
  res: Response
): Promise<void> {
  const max = Math.min(parseInt((req.query.max as string) || "9", 10), 24);
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    console.info(
      "[instagramMedia] INSTAGRAM_ACCESS_TOKEN not set; returning empty list"
    );
    res.json({ media: [] });
    return;
  }

  const url =
    `https://graph.instagram.com/me/media` +
    `?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp` +
    `&limit=${max}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Instagram API responded ${response.status}: ${await response.text()}`
      );
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        caption?: string;
        media_type: string;
        media_url: string;
        thumbnail_url?: string;
        permalink: string;
        timestamp?: string;
      }>;
    };

    const media: InstagramMediaItem[] = (data?.data ?? []).map(item => ({
      id: item.id,
      caption: item.caption,
      mediaType: item.media_type,
      mediaUrl: item.media_url,
      thumbnailUrl: item.thumbnail_url,
      permalink: item.permalink,
      timestamp: item.timestamp,
    }));

    res.json({ media });
  } catch (err) {
    console.error("[instagramMedia] Error fetching from Instagram API:", err);
    // Graceful degradation — frontend shows its connect CTA
    res.json({ media: [] });
  }
}
