import { useState } from "react";
import { Youtube, ExternalLink, MonitorPlay } from "lucide-react";
import { YOUTUBE_SITE_DOMAIN } from "@/const";

export interface YouTubeLiveChatProps {
  /** YouTube Live video ID — empty string renders the offline card */
  videoId: string;
  /** Site domain for YouTube live_chat embed allow-list (defaults to YOUTUBE_SITE_DOMAIN) */
  embedDomain?: string;
  /** Height of the chat panel in px (default: 500) */
  chatHeight?: number;
  /** Show the player alongside chat (default: true) */
  showPlayer?: boolean;
  /** Channel display name in the header */
  channelName?: string;
  /**
   * Pass `true` only when the stream is confirmed live.
   * Controls the pulsing LIVE badge \u2014 avoids misleading visitors on VODs.
   */
  isLive?: boolean;
}

/**
 * YouTubeLiveChat
 *
 * Embeds a YouTube live stream player + live chat side-by-side using
 * YouTube\u2019s official iframe APIs. Renders a clean offline card when no
 * videoId is provided. Player and chat each have independent error fallbacks.
 *
 * SETUP:
 *  1. Set VITE_YOUTUBE_LIVE_VIDEO_ID in .env (update each time Soph goes live)
 *  2. Set VITE_YOUTUBE_SITE_DOMAIN=simplysoph.com in .env
 *  3. Add simplysoph.com to allowed referrers in Google API Console credentials
 */
export default function YouTubeLiveChat({
  videoId,
  embedDomain = YOUTUBE_SITE_DOMAIN,
  chatHeight = 500,
  showPlayer = true,
  channelName = "SimplySoph",
  isLive = false,
}: YouTubeLiveChatProps) {
  const [chatError, setChatError] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  if (!videoId) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <MonitorPlay className="w-10 h-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm font-medium">No live stream active right now</p>
            <p className="text-xs mt-1">Check back when Soph goes live! \ud83d\udc95</p>
          </div>
        </div>
      </section>
    );
  }

  const playerSrc = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
  const chatSrc = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${embedDomain}`;

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" aria-hidden="true" />
            <h2 className="text-2xl font-heading font-bold tracking-tight">
              {channelName} \u2014 {isLive ? "Live" : "Latest Stream"}
            </h2>
            {/* LIVE badge only shown when isLive=true to avoid misleading visitors */}
            {isLive && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 animate-pulse"
                role="status"
                aria-label="Stream is live"
              >
                \u25cf LIVE
              </span>
            )}
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            aria-label="Open stream on YouTube"
          >
            Open on YouTube <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>

        <div
          className={`flex ${showPlayer ? "flex-col lg:flex-row" : ""} gap-3 w-full rounded-2xl overflow-hidden border border-border/60`}
          style={{ height: showPlayer ? undefined : chatHeight }}
        >
          {showPlayer && (
            playerError ? (
              <div className="w-full lg:flex-1 aspect-video flex items-center justify-center bg-muted/40 rounded-xl">
                <div className="text-center text-muted-foreground p-6">
                  <Youtube className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
                  <p className="text-sm font-medium">Video unavailable</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline hover:text-primary mt-1 block"
                  >
                    Watch on YouTube instead
                  </a>
                </div>
              </div>
            ) : (
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
            )
          )}

          {chatError ? (
            <div className="w-full lg:w-80 shrink-0 flex items-center justify-center bg-muted/40 rounded-xl">
              <div className="text-center text-muted-foreground p-6">
                <Youtube className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
                <p className="text-xs">
                  Chat unavailable \u2014 join on{" "}
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    YouTube
                  </a>
                </p>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
}
