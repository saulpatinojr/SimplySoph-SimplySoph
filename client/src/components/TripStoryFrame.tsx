import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, MapPin, Play } from "lucide-react";
import type { Trip, TripComment } from "@/lib/demoTrips";
import { cn } from "@/lib/utils";

const STORY_DURATION_MS = 8000;
const SPOTLIGHT_INTERVAL_MS = 4200;
const CARD_SWAP_INTERVAL_MS = 2600;
const BOARD_SLOTS = 12;

/** Deterministic pseudo-random in [0, 1) so the board never jitters between renders. */
function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * TikTok "player v1" embed: unlike embed/v2 it fills the iframe edge to
 * edge (no white card chrome) and rel=0 removes the related-videos end
 * screen. It also posts onStateChange messages we use to auto-advance.
 */
function tikTokPlayerUrl(videoId: string, autoplay: boolean): string {
  const params = new URLSearchParams({
    controls: "1",
    progress_bar: "1",
    play_button: "1",
    volume_control: "1",
    fullscreen_button: "1",
    timestamp: "0",
    rel: "0",
    music_info: "0",
    description: "0",
    autoplay: autoplay ? "1" : "0",
  });
  return `https://www.tiktok.com/player/v1/${videoId}?${params}`;
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

/* ------------------------------------------------------------------ */
/* License plate — the trip's destination badge                        */
/* ------------------------------------------------------------------ */

function LicensePlate({ trip }: { trip: Trip }) {
  const { plate } = trip;
  const screw = (
    <span
      className="h-1.5 w-1.5 rounded-full opacity-60"
      style={{ background: plate.color }}
      aria-hidden
    />
  );
  return (
    <div
      className="flex flex-col items-center rounded-lg border-2 px-4 pb-1.5 pt-1 shadow-[0_3px_10px_rgba(0,0,0,0.45)]"
      style={{ background: plate.bg, borderColor: plate.color }}
      aria-label={`${plate.region} plate ${plate.serial}`}
    >
      <div className="flex w-full items-center justify-between gap-3">
        {screw}
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.3em]",
            plate.script &&
              "font-serif normal-case italic tracking-normal text-sm"
          )}
          style={{ color: plate.regionColor }}
        >
          {plate.script ? plate.region : plate.region}
        </span>
        {screw}
      </div>
      <span
        className="font-mono text-xl font-black leading-none tracking-[0.12em]"
        style={{
          color: plate.color,
          textShadow:
            "0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.15)",
        }}
      >
        {plate.serial}
      </span>
      <span
        className="text-[8px] font-semibold uppercase tracking-[0.25em] opacity-80"
        style={{ color: plate.regionColor }}
      >
        {plate.slogan}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Soph.FM — car-radio with a tuning dial, EQ, and Apple Music embed   */
/* ------------------------------------------------------------------ */

const DIAL_STOPS = [88, 92, 96, 100, 104, 108];

function TripRadio({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);
  const embed = trip.playlist.appleMusicUrl
    ? appleMusicEmbedUrl(trip.playlist.appleMusicUrl)
    : null;
  const needle = ((trip.playlist.freq - 87) / (109 - 87)) * 100;

  return (
    <div className="mt-4 w-full">
      <button
        type="button"
        onClick={() => embed && setOpen(o => !o)}
        aria-expanded={open}
        aria-label={`${trip.playlist.station} ${trip.playlist.freq}: ${trip.playlist.title}`}
        className={cn(
          "w-full rounded-2xl border p-3 text-left shadow-xl backdrop-blur-md",
          embed && "cursor-pointer transition-transform hover:scale-[1.01]"
        )}
        style={{
          borderColor: `${trip.accent}44`,
          background:
            "linear-gradient(180deg, rgba(24,22,38,0.92), rgba(10,10,20,0.92))",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Speaker grille */}
          <div
            className="grid shrink-0 grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/40 p-2"
            aria-hidden
          >
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="h-1 w-1 rounded-full bg-white/25" />
            ))}
          </div>

          {/* Tuning dial */}
          <div className="min-w-0 flex-1">
            <div className="relative h-6" aria-hidden>
              {/* tick marks */}
              <div className="absolute inset-x-0 bottom-0 flex h-2 items-end justify-between">
                {Array.from({ length: 22 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-px bg-white/25",
                      i % 4 === 0 ? "h-2" : "h-1"
                    )}
                  />
                ))}
              </div>
              {/* frequency numbers */}
              <div className="absolute inset-x-0 top-0 flex justify-between font-mono text-[8px] text-white/40">
                {DIAL_STOPS.map(f => (
                  <span key={f}>{f}</span>
                ))}
              </div>
              {/* needle */}
              <motion.span
                className="absolute bottom-0 top-0 w-0.5 rounded-full"
                style={{
                  left: `${needle}%`,
                  background: trip.accent,
                  boxShadow: `0 0 8px ${trip.accent}`,
                }}
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className="font-mono text-sm font-bold tracking-widest"
                style={{ color: trip.accent }}
              >
                {trip.playlist.freq.toFixed(1)}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/50">
                {trip.playlist.station}
              </span>
              <span className="min-w-0 truncate text-xs text-white/85">
                {trip.playlist.title}
              </span>
            </div>
          </div>

          {/* EQ bars + state */}
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex h-5 items-end gap-0.5" aria-hidden>
              {[0.9, 0.5, 1, 0.65].map((peak, i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-sm"
                  style={{ background: trip.accent }}
                  animate={{ height: [3, 20 * peak, 6, 16 * peak, 3] }}
                  transition={{
                    duration: 1.1 + i * 0.22,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">
              {embed ? (open ? "tuned" : "play") : "off air"}
            </span>
          </div>
        </div>
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

/* ------------------------------------------------------------------ */
/* Comment board — fixed scatter slots, cards cycle in and out         */
/* ------------------------------------------------------------------ */

type Slot = { left: number; top: number; rotate: number };

const SLOTS: Slot[] = Array.from({ length: BOARD_SLOTS }, (_, i) => {
  const cols = 3;
  const rows = Math.ceil(BOARD_SLOTS / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  return {
    left: (col + 0.5) / cols + (seeded(i * 7 + 1) - 0.5) * 0.14,
    top: (row + 0.5) / rows + (seeded(i * 13 + 5) - 0.5) * 0.1,
    rotate: (seeded(i * 3 + 9) - 0.5) * 14,
  };
});

export default function TripStoryFrame({ trip }: { trip: Trip }) {
  const [videoIndex, setVideoIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const storyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const pool = trip.comments;
  const slotCount = Math.min(BOARD_SLOTS, pool.length);
  const [slots, setSlots] = useState<number[]>(() =>
    Array.from({ length: slotCount }, (_, i) => i)
  );
  const [spotlightId, setSpotlightId] = useState(pool[0]?.id);
  const nextPoolIdx = useRef(slotCount % pool.length);
  const slotCursor = useRef(0);

  const activeVideo = trip.videos[videoIndex];
  const spotlight = pool.find(c => c.id === spotlightId) ?? pool[0];
  const videoTitleById = useMemo(
    () => new Map(trip.videos.map(v => [v.id, v.title])),
    [trip.videos]
  );

  const goTo = useCallback(
    (index: number) => {
      const next = (index + trip.videos.length) % trip.videos.length;
      setVideoIndex(next);
      setProgressKey(k => k + 1);
      setHasNavigated(true);
    },
    [trip.videos.length]
  );

  // Auto-advance placeholder covers on a timer. Real embeds advance when
  // the TikTok player reports the video ended (see message listener).
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

  // TikTok player v1 posts {"x-tiktok-player":true,type:"onStateChange",
  // value:0} when playback ends — advance to the next video.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      let data: unknown = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const msg = data as {
        "x-tiktok-player"?: boolean;
        type?: string;
        value?: number | string;
      };
      if (
        msg?.["x-tiktok-player"] &&
        msg.type === "onStateChange" &&
        Number(msg.value) === 0
      ) {
        goTo(videoIndex + 1);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [videoIndex, goTo]);

  // Cycle the board: every tick, one slot's card floats away and the next
  // comment from the pool takes its place.
  useEffect(() => {
    if (paused || pool.length <= slotCount) return;
    const t = setInterval(() => {
      setSlots(prev => {
        const next = [...prev];
        const visible = new Set(prev);
        let candidate = nextPoolIdx.current;
        let guard = 0;
        while (visible.has(candidate) && guard < pool.length) {
          candidate = (candidate + 1) % pool.length;
          guard++;
        }
        const slot = slotCursor.current % slotCount;
        slotCursor.current++;
        nextPoolIdx.current = (candidate + 1) % pool.length;
        next[slot] = candidate;
        return next;
      });
    }, CARD_SWAP_INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, pool.length, slotCount]);

  // Rotate the spotlighted comment among the visible cards.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setSlots(current => {
        const visible = current.map(i => pool[i]).filter(Boolean);
        if (visible.length) {
          const pick =
            visible[
              Math.floor(seeded(slotCursor.current * 31) * visible.length)
            ];
          setSpotlightId(id =>
            pick.id === id && visible.length > 1
              ? visible[(visible.indexOf(pick) + 1) % visible.length].id
              : pick.id
          );
        }
        return current;
      });
    }, SPOTLIGHT_INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, pool]);

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
      {/* Drifting glow blobs keep the backdrop alive */}
      {trip.glow.map((color, i) => (
        <motion.div
          key={color}
          className="pointer-events-none absolute rounded-full blur-3xl"
          style={{
            width: 380 + i * 60,
            height: 380 + i * 60,
            background: color,
            opacity: 0.22,
            left: `${15 + i * 30}%`,
            top: `${i % 2 === 0 ? -10 : 40}%`,
          }}
          animate={{
            x: [0, i % 2 === 0 ? 90 : -70, 0],
            y: [0, i % 2 === 0 ? 60 : -50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 16 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden
        />
      ))}

      {/* Frame header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 px-6 pt-6 md:px-10">
        <div className="flex items-center gap-3">
          <MapPin size={18} style={{ color: trip.accent }} aria-hidden />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white tracking-tight">
            {trip.city}
          </h2>
          <span className="hidden sm:inline text-sm text-white/50">
            {trip.tagline}
          </span>
        </div>
        <LicensePlate trip={trip} />
      </div>

      <div className="relative grid gap-6 p-6 md:grid-cols-[minmax(0,460px)_1fr] md:gap-10 md:p-10">
        {/* ---------------- Story player ---------------- */}
        <div className="mx-auto w-full max-w-[460px]">
          <div className="relative aspect-9/16 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
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

            {/* Stage — player v1 fills the box; placeholder cover otherwise */}
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
                  ref={iframeRef}
                  src={tikTokPlayerUrl(activeVideo.id, hasNavigated)}
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

            {/* Tap zones — slim strips so the player's controls stay usable */}
            <button
              aria-label="Previous video"
              onClick={() => goTo(videoIndex - 1)}
              className={cn(
                "group absolute inset-y-0 left-0 z-10 flex items-center",
                activeVideo.embedUrl ? "w-9" : "w-1/3"
              )}
            >
              <ChevronLeft
                className="ml-1.5 text-white/0 transition group-hover:text-white/70"
                size={26}
              />
            </button>
            <button
              aria-label="Next video"
              onClick={() => goTo(videoIndex + 1)}
              className={cn(
                "group absolute inset-y-0 right-0 z-10 flex items-center justify-end",
                activeVideo.embedUrl ? "w-9" : "w-1/3"
              )}
            >
              <ChevronRight
                className="mr-1.5 text-white/0 transition group-hover:text-white/70"
                size={26}
              />
            </button>
          </div>
          <p className="mt-3 truncate text-center text-sm font-medium text-white/85">
            {activeVideo.title}
          </p>
          <p className="mt-1 text-center text-xs text-white/45">
            {videoIndex + 1} of {trip.videos.length}
          </p>

          {/* Soph.FM — the trip's playlist radio */}
          <TripRadio trip={trip} />
        </div>

        {/* ---------------- Live comment board ---------------- */}
        <div className="relative min-h-[420px] md:min-h-0">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            what everyone said
          </h3>
          <div className="relative h-[calc(100%-1.75rem)] min-h-[400px]">
            {slots.map((poolIdx, slotIdx) => {
              const comment = pool[poolIdx];
              if (!comment) return null;
              const slot = SLOTS[slotIdx];
              const isActive = comment.videoId === activeVideo.id;
              const isSpotlit = comment.id === spotlight?.id;
              return (
                // Keyed remount (no exit phase): swapped-out cards vanish and
                // the incoming one animates up into the slot — exit-completion
                // callbacks proved unreliable with heavy iframes on the page.
                <motion.button
                  key={`${slotIdx}-${comment.id}`}
                  onClick={() => setSpotlightId(comment.id)}
                  className={cn(
                    "absolute w-36 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-2.5 text-left shadow-lg backdrop-blur-sm md:w-44",
                    isSpotlit && "pointer-events-none opacity-0"
                  )}
                  style={{
                    left: `${slot.left * 100}%`,
                    top: `${slot.top * 100}%`,
                    borderColor: isActive
                      ? `${trip.accent}aa`
                      : "rgba(255,255,255,0.16)",
                    background: isActive
                      ? `${trip.accent}1f`
                      : "rgba(255,255,255,0.07)",
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0.6,
                    rotate: slot.rotate - 8,
                    y: 16,
                  }}
                  animate={{
                    opacity: isSpotlit ? 0 : 1,
                    scale: 1,
                    rotate: slot.rotate,
                    y: 0,
                  }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                >
                  <div
                    className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-white/30"
                    style={{ background: isActive ? trip.accent : "#8b8b9e" }}
                    aria-hidden
                  />
                  <p className="line-clamp-2 text-[11px] leading-snug text-white/90 md:text-xs">
                    {comment.text}
                  </p>
                  <p className="mt-1.5 truncate text-[10px] text-white/55">
                    {comment.author}
                  </p>
                </motion.button>
              );
            })}

            {/* Spotlight: the "picked up" card */}
            <AnimatePresence mode="wait">
              {spotlight && (
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
                    <span
                      className="font-medium"
                      style={{ color: trip.accent }}
                    >
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
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
