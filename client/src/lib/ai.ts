// ── AI / Caption Generation ──────────────────────────────────────────────
//
// Generates captions using local templates so the UI never crashes.

export type CaptionPlatform =
  | 'youtube_shorts'
  | 'instagram_post'
  | 'instagram_reel'
  | 'tiktok';

interface CaptionRequest {
  platform:            CaptionPlatform;
  originalDescription: string;
  keywords?:           string[];
}

interface CaptionResponse {
  text: string;
}


// ── Platform templates (local fallback) ─────────────────────────────────
function buildLocalCaption(
  platform: CaptionPlatform,
  description: string,
  keywords: string[]
): string {
  const hashtags = keywords
    .filter(Boolean)
    .map(k => `#${k.replace(/\s+/g, '')}`) .join(' ');
  const base = description.trim() || 'Check out this new look!';

  switch (platform) {
    case 'youtube_shorts':
      return `${base}\n\nSubscribe for more fashion tips! ✨\n\n#fashion #shorts #ootd ${hashtags}`.trim();
    case 'instagram_post':
      return `${base}\n.\n.\n.\nfollow for more style inspo 💖\n\n#fashionblogger #style #ootd ${hashtags}`.trim();
    case 'instagram_reel':
      return `${base}\n\n💕 Save this for inspo!\n\n#reels #fashionreel #grwm ${hashtags}`.trim();
    case 'tiktok':
      return `${base}\n\n#fyp #fashion #viral #ootd ${hashtags}`.trim();
    default:
      return `${base}\n\n${hashtags}`.trim();
  }
}

// ── Main export ──────────────────────────────────────────────────────────
/**
 * Generate a social-media caption for the given platform.
 *
 * Uses local templates.
 */
export async function generateCaption(
  platform: CaptionPlatform,
  originalDescription: string,
  keywords: string[] = []
): Promise<string> {
  // Simulate a small delay for UX consistency
  await new Promise(r => setTimeout(r, 600));
  return buildLocalCaption(platform, originalDescription, keywords);
}
