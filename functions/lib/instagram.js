"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInstagramMedia = void 0;
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
async function handleInstagramMedia(req, res) {
    var _a;
    const max = Math.min(parseInt(req.query.max || "9", 10), 24);
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
        console.info("[instagramMedia] INSTAGRAM_ACCESS_TOKEN not set; returning empty list");
        res.json({ media: [] });
        return;
    }
    const url = `https://graph.instagram.com/me/media` +
        `?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp` +
        `&limit=${max}` +
        `&access_token=${encodeURIComponent(accessToken)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Instagram API responded ${response.status}: ${await response.text()}`);
        }
        const data = (await response.json());
        const media = ((_a = data === null || data === void 0 ? void 0 : data.data) !== null && _a !== void 0 ? _a : []).map(item => ({
            id: item.id,
            caption: item.caption,
            mediaType: item.media_type,
            mediaUrl: item.media_url,
            thumbnailUrl: item.thumbnail_url,
            permalink: item.permalink,
            timestamp: item.timestamp,
        }));
        res.json({ media });
    }
    catch (err) {
        console.error("[instagramMedia] Error fetching from Instagram API:", err);
        // Graceful degradation — frontend shows its connect CTA
        res.json({ media: [] });
    }
}
exports.handleInstagramMedia = handleInstagramMedia;
//# sourceMappingURL=instagram.js.map