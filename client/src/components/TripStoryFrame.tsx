import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, MapPin, Pause, Play } from "lucide-react";
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

  // Auto-advance the story.
  useEffect(() => {
    if (paused) return;
    storyTimer.current = setTimeout(
      () => goTo(videoIndex + 1),
      STORY_DURATION_MS
    );
    return () => {
      if (storyTimer.current) clearTimeout(storyTimer.current);
    };
  }, [videoIndex, paused, progressKey, goTo]);

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
          style={{ borderColor: `${trip.accent}66`, background: `${trip.accent}1a` }}
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
                  ) : null}
                </button>
              ))}
            </div>

            {/* Stage — placeholder cover until real embeds arrive */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeVideo.id}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center"
                style={{
                  background: `linear-gradient(160deg, ${activeVideo.cover[0]}, ${activeVideo.cover[1]})`,
                }}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
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
              </motion.div>
            </AnimatePresence>

            {/* Tap zones */}
            <button
              aria-label="Previous video"
              onClick={() => goTo(videoIndex - 1)}
              className="group absolute inset-y-0 left-0 z-10 w-1/3"
            >
              <ChevronLeft
                className="ml-2 text-white/0 transition group-hover:text-white/70"
                size={28}
              />
            </button>
            <button
              aria-label="Next video"
              onClick={() => goTo(videoIndex + 1)}
              className="group absolute inset-y-0 right-0 z-10 flex w-1/3 justify-end"
            >
              <ChevronRight
                className="mr-2 self-center text-white/0 transition group-hover:text-white/70"
                size={28}
              />
            </button>

            {/* Pause indicator */}
            <div className="absolute bottom-3 right-3 z-20 text-white/60">
              {paused ? <Pause size={16} /> : <Play size={16} />}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-white/45">
            {videoIndex + 1} of {trip.videos.length} · hover to pause the story
          </p>
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
                    borderColor: isActive ? `${trip.accent}aa` : "rgba(255,255,255,0.14)",
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
                initial={{ opacity: 0, scale: 0.7, rotate: -4, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, rotate: 0, x: "-50%", y: "-50%" }}
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
