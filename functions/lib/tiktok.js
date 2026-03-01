"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTikTokComments = void 0;
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
async function handleTikTokComments(req, res) {
    var _a, _b;
    const videoId = req.query.videoId;
    const max = Math.min(parseInt(req.query.max || "8", 10), 20);
    if (!videoId) {
        res.status(400).json({ error: "videoId query param is required" });
        return;
    }
    // Credentials come from Firebase Functions env config (server-side only)
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (!accessToken) {
        // No credentials yet — return empty so the frontend fallback takes over
        console.info("[tiktokComments] TIKTOK_ACCESS_TOKEN not set; returning empty list");
        res.json({ comments: [] });
        return;
    }
    const url = `https://open.tiktokapis.com/v2/video/comment/list/` +
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
            throw new Error(`TikTok API responded ${response.status}: ${await response.text()}`);
        }
        const data = (await response.json());
        const rawComments = (_b = (_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.comments) !== null && _b !== void 0 ? _b : [];
        const comments = rawComments.map(c => {
            var _a, _b, _c;
            return ({
                id: c.id,
                text: c.text,
                author: (_b = (_a = c.display_name) !== null && _a !== void 0 ? _a : c.username) !== null && _b !== void 0 ? _b : "tiktokuser",
                likes: (_c = c.like_count) !== null && _c !== void 0 ? _c : 0,
                avatarUrl: c.avatar_url,
            });
        });
        res.json({ comments });
    }
    catch (err) {
        console.error("[tiktokComments] Error fetching from TikTok API:", err);
        // Graceful degradation — frontend will use its sample comments
        res.json({ comments: [] });
    }
}
exports.handleTikTokComments = handleTikTokComments;
//# sourceMappingURL=tiktok.js.map