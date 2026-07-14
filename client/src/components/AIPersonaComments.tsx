import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/const";
import { getAdminApiHeaders } from "@/lib/services/ai";

export type Persona = "preppy" | "sporty" | "sophisticated" | "chaotic";

interface PersonaMeta {
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const PERSONAS: Record<Persona, PersonaMeta> = {
  preppy: {
    label: "Preppy Soph",
    emoji: "\ud83c\udf80",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    description: "Polished, cheerful, Lilly Pulitzer energy",
  },
  sporty: {
    label: "Sporty Soph",
    emoji: "\ud83c\udfc3\u200d\u2640\ufe0f",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    description: "Casual, confident, low-effort cool",
  },
  sophisticated: {
    label: "Sophisticated Soph",
    emoji: "\ud83d\udda4",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Editorial, intentional, fashion-forward",
  },
  chaotic: {
    label: "Chaotic Soph",
    emoji: "\ud83d\udc80",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    description: "Unfiltered, meme-fluent, Gen Z brain",
  },
};

const FALLBACK_REPLIES: Record<Persona, string> = {
  preppy:
    "Oh my gosh YES, this look is giving main character energy \ud83c\udf80 Obsessed!",
  sporty:
    "Honestly threw this together in 5 min and that\u2019s the point \ud83d\ude02 comfort wins",
  sophisticated:
    "The layering here is intentional \u2014 texture contrast is doing all the heavy lifting.",
  chaotic:
    "Me buying this immediately even though I have zero events to wear it to \ud83d\udc80\ud83d\udc80",
};

export interface AIPersonaCommentsProps {
  /** Video/post title or topic for AI context */
  topic: string;
  /** Up to 5 top fan comments for additional AI context */
  fanComments?: string[];
  /** Render a single persona only; omit to show all four */
  persona?: Persona;
}

interface PersonaReply {
  persona: Persona;
  reply: string;
  loading: boolean;
}

/**
 * AIPersonaComments
 *
 * Sends topic + fan comments to the Firebase Function at
 * `{API_BASE}/ai/persona-replies` in a SINGLE batched request (all 4 personas
 * at once), then renders each AI-generated reaction card.
 *
 * All content is display-only on-site and is never posted back to TikTok/YouTube.
 *
 * SETUP:
 *  1. Set GEMINI_API_KEY server-side: `firebase functions:config:set ai.gemini_key="..."`
 *  2. Deploy Firebase Function `personaReplies` (functions/src/ai.ts)
 *     \u2514 Endpoint: POST /api/ai/persona-replies
 *     \u2514 Returns: { replies: Record<Persona, string> }
 */
export default function AIPersonaComments({
  topic,
  fanComments = [],
  persona,
}: AIPersonaCommentsProps) {
  const personaKeys = useMemo(
    () =>
      persona ? ([persona] as Persona[]) : (Object.keys(PERSONAS) as Persona[]),
    [persona]
  );

  const blankReplies = useCallback(
    () => personaKeys.map(p => ({ persona: p, reply: "", loading: false })),
    [personaKeys]
  );

  const [replies, setReplies] = useState<PersonaReply[]>(blankReplies);
  const [hasFetched, setHasFetched] = useState(false);

  // Reset when persona prop changes
  useEffect(() => {
    setReplies(blankReplies());
    setHasFetched(false);
  }, [blankReplies]);

  const fetchReplies = useCallback(async () => {
    setReplies(
      personaKeys.map(p => ({ persona: p, reply: "", loading: true }))
    );
    try {
      // Single batched request \u2014 one Gemini call for all personas
      const res = await fetch(`${API_BASE}/ai/persona-replies`, {
        method: "POST",
        headers: await getAdminApiHeaders(),
        body: JSON.stringify({
          personas: personaKeys,
          topic,
          fanComments: fanComments.slice(0, 5),
          creatorName: "Soph",
          creatorBio:
            "Fashion, lifestyle, and creative content for the modern generation. 18-year-old creator who loves style, travel, and authentic storytelling.",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { replies: Record<Persona, string> } = await res.json();
      setReplies(
        personaKeys.map(p => ({
          persona: p,
          reply: data.replies?.[p] ?? FALLBACK_REPLIES[p],
          loading: false,
        }))
      );
    } catch (err) {
      console.error("[AIPersonaComments]", err);
      setReplies(
        personaKeys.map(p => ({
          persona: p,
          reply: FALLBACK_REPLIES[p],
          loading: false,
        }))
      );
    } finally {
      setHasFetched(true);
    }
  }, [personaKeys, topic, fanComments]);

  useEffect(() => {
    if (topic) fetchReplies();
  }, [topic, persona, fetchReplies]);

  const isLoading = replies.some(r => r.loading);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-heading font-bold tracking-tight">
            Soph\u2019s Many Sides React
          </h2>
        </div>
        {hasFetched && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchReplies}
            className="text-xs gap-1"
            aria-label="Regenerate AI persona replies"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" /> Regenerate
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-6 italic">
        AI-generated reactions \u2014 each one a different side of Soph\u2019s
        personality \u2728
      </p>

      {/* aria-live so screen readers announce when new replies load in */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        aria-live="polite"
        aria-label="Soph persona reactions"
      >
        {replies.map(({ persona: p, reply, loading }) => {
          const meta = PERSONAS[p];
          return (
            <div
              key={p}
              className={`rounded-2xl border p-4 transition-all duration-300 ${
                loading ? "animate-pulse" : ""
              } ${meta.color}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl" role="img" aria-label={meta.label}>
                  {meta.emoji}
                </span>
                <div>
                  <p className="text-xs font-bold">{meta.label}</p>
                  <p className="text-[10px] opacity-70">{meta.description}</p>
                </div>
              </div>
              {loading ? (
                <div className="space-y-2" aria-hidden="true">
                  <div className="h-3 rounded bg-current opacity-20 w-full" />
                  <div className="h-3 rounded bg-current opacity-20 w-4/5" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{reply}</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
