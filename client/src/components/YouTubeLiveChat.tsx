import { useState } from "react";
import { Youtube, ExternalLink, MonitorPlay } from "lucide-react";

interface YouTubeLiveChatProps {
  /** YouTube Live video ID (e.g. 'dQw4w9WgXcQ') */
  videoId: string;
  /** Your site's domain — required by YouTube's live_chat embed */
  embedDomain?: string;
  /** Height of the chat panel in px */
  chatHeight?: number;
  /** Show the video player alongside the chat */
  showPlayer?: boolean;
  /** Optional channel name for the header label */
  channelName?: string;
}

/**
 * YouTubeLiveChat
 *
 * Embeds a YouTube live stream player and its live chat side-by-side
 * (or just the chat) using YouTube's official iframe embed APIs.
 *
 * The chat iframe requires `embedDomain` to match your site's domain
 * as configured in Google API Console > YouTube Data API credentials.
 *
 * SETUP:
 *  1. Get a YouTube Live video ID (available while live or scheduled)
 *  2. Set VITE_YOUTUBE_LIVE_VIDEO_ID in your .env
 *  3. Set VITE_SITE_DOMAIN=simplysoph.com (or your domain) in .env
 *
 * During non-live periods this component gracefully shows an offline card.
 */
export default function YouTubeLiveChat({
  videoId,
  embedDomain = import.meta.env.VITE_SITE_DOMAIN ?? "simplysoph.com",
  chatHeight = 500,
  showPlayer = true,
  channelName = "SimplySoph",
}: YouTubeLiveChatProps) {
  const [chatError, setChatError] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  if (!videoId) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
        <MonitorPlay className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">No live stream active right now</p>
        <p className="text-xs mt-1">Check back when Soph goes live! 💕</p>
      </div>
    );
  }

  const playerSrc = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
  const chatSrc = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${embedDomain}`;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold tracking-tight">
            {channelName} — Live
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 animate-pulse">
            ● LIVE
          </span>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Open on YouTube <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div
        className={`flex ${
          showPlayer ? "flex-col lg:flex-row" : ""
        } gap-3 w-full rounded-2xl overflow-hidden border border-border/60`}
        style={{ height: showPlayer ? undefined : chatHeight }}
      >
        {/* Video Player */}
        {showPlayer && !playerError && (
          <div className="w-full lg:flex-1 aspect-video">
            <iframe
              src={playerSrc}
              title={`${channelName} Live Stream`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              onError={() => setPlayerError(true)}
            />
          </div>
        )}

        {/* Live Chat */}
        {!chatError ? (
          <div
            className="w-full lg:w-80 shrink-0"
            style={{ height: showPlayer ? chatHeight : "100%" }}
          >
            <iframe
              src={chatSrc}
              title="YouTube Live Chat"
              className="w-full h-full"
              onError={() => setChatError(true)}
            />
          </div>
        ) : (
          <div className="w-full lg:w-80 shrink-0 flex items-center justify-center bg-muted/40 rounded-xl">
            <div className="text-center text-muted-foreground p-6">
              <Youtube className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                Chat unavailable — open on{" "}
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  YouTube
                </a>{" "}
                instead
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
