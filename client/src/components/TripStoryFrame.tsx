import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Pause,
  Play,
  Radio,
} from "lucide-react";
import type { Trip, TripComment } from "@/lib/demoTrips";
import { cn } from "@/lib/utils";

const STORY_DURATION_MS = 8000;
const SPOTLIGHT_INTERVAL_MS = 4200;

/** Deterministic pseudo-random in [0, 1) so the board never jitters between renders. */
function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type PinnedCard = {
  comment: TripComment;
  left: number;
  top: number;
  rotate: number;
};

/** Scatter comments across the board on a loose grid with seeded jitter. */
function usePinnedCards(comments: TripComment[]): PinnedCard[] {
  return useMemo(() => {
    const cols = 3;
    const rows = Math.ceil(comments.length / cols);
    return comments.map((comment, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        comment,
        left: (col + 0.5) / cols + (seeded(i * 7 + 1) - 0.5) * 0.14,
        top: (row + 0.5) / rows + (seeded(i * 13 + 5) - 0.5) * 0.1,
        rotate: (seeded(i * 3 + 9) - 0.5) * 14,
      };
    });
  }, [comments]);
}

/** Turn a public music.apple.com URL into its embeddable player URL. */
function appleMusicEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      u.hostname !== "music.apple.com" &&
      u.hostname !== "embed.music.apple.com"
    ) {
      return null;
    }
    return `https://embed.music.apple.com${u.pathname}${u.search}`;
  } catch {
    return null;
  }
}

/**
 * Mini "radio" tucked under the story player: Soph's playlist for the city.
 * Shows an on-air badge; when the trip has an Apple Music URL it expands
 * into the embedded player, otherwise it teases the drop.
 */
function TripRadio({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const embed = trip.playlist.appleMusicUrl
    ? appleMusicEmbedUrl(trip.playlist.appleMusicUrl)
    : null;

  return (
    <div className="mt-4 flex flex-col items-end">
      <button
        type="button"
        onClick={() => embed && setOpen(o => !o)}
        aria-expanded={open}
        aria-label={`${trip.playlist.station} playlist: ${trip.playlist.title}`}
        className={cn(
          "group flex items-center gap-2.5 rounded-full border py-1.5 pl-2.5 pr-3.5 text-left shadow-lg backdrop-blur-sm transition-transform",
          embed ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"
        )}
        style={{
          borderColor: `${trip.accent}55`,
          background: "rgba(10, 10, 20, 0.55)",
        }}
      >
        {/* Speaker grill + pulsing on-air light */}
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5">
          <Radio size={13} className="text-white/80" aria-hidden />
          <motion.span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
            style={{ background: trip.accent }}
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            aria-hidden
          />
        </span>
        <span className="min-w-0">
          <span
            className="block font-mono text-[9px] uppercase tracking-[0.25em]"
            style={{ color: trip.accent }}
          >
            {trip.playlist.station}
          </span>
          <span className="block truncate text-xs text-white/85">
            {trip.playlist.title}
          </span>
        </span>
        <span className="ml-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-wider text-white/40">
          {embed ? (open ? "hide" : "▶ play") : "soon"}
        </span>
      </button>

      {embed && open && (
        <motion.div
          className="mt-3 w-full overflow-hidden rounded-xl border"
          style={{ borderColor: `${trip.accent}44` }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <iframe
            src={embed}
            className="w-full border-0"
            height={450}
            allow="autoplay *; encrypted-media *; clipboard-write"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            loading="lazy"
            title={`${trip.city} playlist — ${trip.playlist.title}`}
          />
        </motion.div>
      )}
    </div>
  );
}

export default function TripStoryFrame({ trip }: { trip: Trip }) {
  const [videoIndex, setVideoIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const storyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeVideo = trip.videos[videoIndex];
  const pinned = usePinnedCards(trip.comments);
  const spotlight = trip.comments[spotlightIndex % trip.comments.length];
  const videoTitleById = useMemo(
    () => new Map(trip.videos.map(v => [v.id, v.title])),
    [trip.videos]
  );

  const goTo = useCallback(
    (index: number) => {
      const next = (index + trip.videos.length) % trip.videos.length;
      setVideoIndex(next);
      setProgressKey(k => k + 1);
    },
    [trip.videos.length]
  );

  // Auto-advance the story — placeholder covers only. Real embeds hand
  // control to the viewer so the story never cuts off a playing video.
  const autoAdvance = !activeVideo.embedUrl;
  useEffect(() => {
    if (paused || !autoAdvance) return;
    storyTimer.current = setTimeout(
      () => goTo(videoIndex + 1),
      STORY_DURATION_MS
    );
    return () => {
      if (storyTimer.current) clearTimeout(storyTimer.current);
    };
  }, [videoIndex, paused, progressKey, goTo, autoAdvance]);

  // Rotate the spotlighted comment.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setSpotlightIndex(i => i + 1),
      SPOTLIGHT_INTERVAL_MS
    );
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section
      aria-label={`${trip.city} trip videos`}
      className="relative overflow-hidden rounded-3xl border border-white/10"
      style={{
        background: `linear-gradient(135deg, ${trip.bg[0]} 0%, ${trip.bg[1]} 55%, ${trip.bg[2]} 100%)`,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Frame header: destination ticket */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 md:px-10">
        <div className="flex items-center gap-3">
          <MapPin size={18} style={{ color: trip.accent }} aria-hidden />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white tracking-tight">
            {trip.city}
          </h2>
          <span className="hidden sm:inline text-sm text-white/50">
            {trip.tagline}
          </span>
        </div>
        <div
          className="rounded-full border px-3 py-1 text-xs font-mono tracking-widest text-white/80"
          style={{
            borderColor: `${trip.accent}66`,
            background: `${trip.accent}1a`,
          }}
        >
          {trip.stamp} · {trip.dates}
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,380px)_1fr] md:gap-10 md:p-10">
        {/* ---------------- Story player ---------------- */}
        <div className="mx-auto w-full max-w-[380px]">
          <div className="relative aspect-9/16 overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
            {/* Progress segments */}
            <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 p-3">
              {trip.videos.map((v, i) => (
                <button
                  key={v.id}
                  aria-label={`Play ${v.title}`}
                  onClick={() => goTo(i)}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  {i < videoIndex ? (
                    <div
                      className="h-full w-full"
                      style={{ background: trip.accent }}
                    />
                  ) : i === videoIndex ? (
                    autoAdvance ? (
                      <motion.div
                        key={progressKey}
                        className="h-full"
                        style={{ background: trip.accent }}
                        initial={{ width: "0%" }}
                        animate={{ width: paused ? undefined : "100%" }}
                        transition={{
                          duration: STORY_DURATION_MS / 1000,
                          ease: "linear",
                        }}
                      />
                    ) : (
                      <div
                        className="h-full w-full opacity-80"
                        style={{ background: trip.accent }}
                      />
                    )
                  ) : null}
                </button>
              ))}
            </div>

            {/* Stage — real embed when available, placeholder cover otherwise.
                Keyed remount + fade-in only: an exit phase (AnimatePresence
                mode="wait") can stall on iframe-heavy children and strand the
                old video on screen. */}
            <motion.div
              key={activeVideo.id}
              className="absolute inset-0"
              style={{
                background: `linear-gradient(160deg, ${activeVideo.cover[0]}, ${activeVideo.cover[1]})`,
              }}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              {activeVideo.embedUrl ? (
                <iframe
                  src={activeVideo.embedUrl}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  title={activeVideo.title}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <span className="text-6xl" aria-hidden>
                    {activeVideo.emoji}
                  </span>
                  <h3 className="font-heading text-xl font-semibold text-white">
                    {activeVideo.title}
                  </h3>
                  <p className="text-sm text-white/70">{activeVideo.caption}</p>
                  <span
                    className="mt-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-widest text-white/90"
                    style={{ background: `${trip.accent}33` }}
                  >
                    full video coming soon
                  </span>
                </div>
              )}
            </motion.div>

            {/* Tap zones */}
            {/* Narrow strips over an embed so its own controls stay usable */}
            <button
              aria-label="Previous video"
              onClick={() => goTo(videoIndex - 1)}
              className={cn(
                "group absolute inset-y-0 left-0 z-10 flex items-center",
                activeVideo.embedUrl ? "w-10" : "w-1/3"
              )}
            >
              <ChevronLeft
                className="ml-2 text-white/0 transition group-hover:text-white/70"
                size={28}
              />
            </button>
            <button
              aria-label="Next video"
              onClick={() => goTo(videoIndex + 1)}
              className={cn(
                "group absolute inset-y-0 right-0 z-10 flex items-center justify-end",
                activeVideo.embedUrl ? "w-10" : "w-1/3"
              )}
            >
              <ChevronRight
                className="mr-2 text-white/0 transition group-hover:text-white/70"
                size={28}
              />
            </button>

            {/* Pause indicator */}
            <div className="absolute bottom-3 right-3 z-20 text-white/60">
              {paused ? <Pause size={16} /> : <Play size={16} />}
            </div>
          </div>
          <p className="mt-3 truncate text-center text-sm font-medium text-white/85">
            {activeVideo.title}
          </p>
          <p className="mt-1 text-center text-xs text-white/45">
            {videoIndex + 1} of {trip.videos.length}
            {activeVideo.embedUrl ? "" : " · hover to pause the story"}
          </p>

          {/* Soph.FM — the trip's playlist radio, tucked under the player */}
          <TripRadio trip={trip} />
        </div>

        {/* ---------------- Postcard comment board ---------------- */}
        <div className="relative min-h-[420px] md:min-h-0">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            what everyone said
          </h3>
          <div className="relative h-[calc(100%-1.75rem)] min-h-[400px]">
            {/* Pinned cards */}
            {pinned.map(({ comment, left, top, rotate }) => {
              const isActive = comment.videoId === activeVideo.id;
              const isSpotlit = comment.id === spotlight.id;
              return (
                <motion.button
                  key={comment.id}
                  onClick={() =>
                    setSpotlightIndex(
                      trip.comments.findIndex(c => c.id === comment.id)
                    )
                  }
                  className={cn(
                    "absolute w-36 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-2.5 text-left shadow-lg backdrop-blur-sm transition-colors md:w-44",
                    isSpotlit && "opacity-0"
                  )}
                  style={{
                    left: `${left * 100}%`,
                    top: `${top * 100}%`,
                    borderColor: isActive
                      ? `${trip.accent}aa`
                      : "rgba(255,255,255,0.14)",
                    background: isActive
                      ? `${trip.accent}1f`
                      : "rgba(255,255,255,0.06)",
                  }}
                  animate={{
                    rotate,
                    opacity: isSpotlit ? 0 : isActive ? 1 : 0.55,
                    scale: isActive ? 1 : 0.92,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}
                >
                  <div
                    className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-white/30"
                    style={{ background: isActive ? trip.accent : "#8b8b9e" }}
                    aria-hidden
                  />
                  <p className="line-clamp-2 text-[11px] leading-snug text-white/85 md:text-xs">
                    {comment.text}
                  </p>
                  <p className="mt-1.5 truncate text-[10px] text-white/50">
                    {comment.author}
                  </p>
                </motion.button>
              );
            })}

            {/* Spotlight: the "picked up" card */}
            <AnimatePresence mode="wait">
              <motion.figure
                key={spotlight.id}
                className="absolute left-1/2 top-1/2 z-10 w-64 rounded-xl border p-4 shadow-2xl md:w-72"
                style={{
                  borderColor: `${trip.accent}cc`,
                  background: `linear-gradient(150deg, rgba(20,20,32,0.96), ${trip.bg[1]}f2)`,
                }}
                initial={{
                  opacity: 0,
                  scale: 0.7,
                  rotate: -4,
                  x: "-50%",
                  y: "-50%",
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  x: "-50%",
                  y: "-50%",
                }}
                exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <blockquote className="text-sm leading-relaxed text-white">
                  “{spotlight.text}”
                </blockquote>
                <figcaption className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-medium" style={{ color: trip.accent }}>
                    {spotlight.author}
                  </span>
                  <span className="flex items-center gap-1 text-white/60">
                    <Heart size={12} fill="currentColor" /> {spotlight.likes}
                  </span>
                </figcaption>
                <p className="mt-2 border-t border-white/10 pt-2 text-[10px] uppercase tracking-wider text-white/40">
                  on: {videoTitleById.get(spotlight.videoId)}
                </p>
              </motion.figure>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
