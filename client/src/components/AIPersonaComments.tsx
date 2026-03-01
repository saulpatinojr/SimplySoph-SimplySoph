import { useEffect, useMemo, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Persona = "preppy" | "sporty" | "sophisticated" | "chaotic";

interface PersonaMeta {
  label: string;
  emoji: string;
  color: string;
  description: string;
}

const PERSONAS: Record<Persona, PersonaMeta> = {
  preppy: {
    label: "Preppy Soph",
    emoji: "🎀",
    color: "bg-pink-100 text-pink-700 border-pink-200",
    description: "Polished, cheerful, Lilly Pulitzer energy",
  },
  sporty: {
    label: "Sporty Soph",
    emoji: "🏃‍♀️",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    description: "Casual, confident, low-effort cool",
  },
  sophisticated: {
    label: "Sophisticated Soph",
    emoji: "🖤",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Editorial, intentional, fashion-forward",
  },
  chaotic: {
    label: "Chaotic Soph",
    emoji: "💀",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    description: "Unfiltered, meme-fluent, Gen Z brain",
  },
};

interface AIPersonaCommentsProps {
  /** The video/post title or topic to react to */
  topic: string;
  /** Top fan comments to use as context for AI */
  fanComments?: string[];
  /** Pre-selected persona; if omitted, all 4 are shown */
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
 * Calls the Firebase Function `/api/ai/persona-reply` with the video topic
 * and fan comments as context, then streams back AI-generated replies in
 * each of Soph's 4 brand personas. All replies are display-only on-site
 * and are never posted back to TikTok/YouTube.
 *
 * SETUP:
 *  1. GEMINI_API_KEY is set server-side in Firebase Functions config only
 *  2. Deploy the Firebase Function `personaReply` (see functions/src/ai.ts)
 */
export default function AIPersonaComments({
  topic,
  fanComments = [],
  persona,
}: AIPersonaCommentsProps) {
  // Fix #1 & #2: useMemo so personaKeys updates when persona prop changes,
  // and downstream effects/state correctly react to the new value
  const personaKeys = useMemo(
    () =>
      persona
        ? ([persona] as Persona[])
        : (Object.keys(PERSONAS) as Persona[]),
    [persona]
  );

  const [replies, setReplies] = useState<PersonaReply[]>(
    personaKeys.map((p) => ({ persona: p, reply: "", loading: false }))
  );
  const [hasFetched, setHasFetched] = useState(false);

  // Fix #2: reset replies state whenever personaKeys changes (persona prop changed)
  useEffect(() => {
    setReplies(personaKeys.map((p) => ({ persona: p, reply: "", loading: false })));
  }, [personaKeys]);

  const fetchReplies = async () => {
    setReplies((prev) => prev.map((r) => ({ ...r, loading: true, reply: "" })));

    await Promise.all(
      personaKeys.map(async (p) => {
        try {
          const res = await fetch("/api/ai/persona-reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              persona: p,
              topic,
              fanComments: fanComments.slice(0, 5),
              creatorName: "Soph",
              creatorBio:
                "Fashion, lifestyle, and creative content for the modern generation. 18-year-old creator who loves style, travel, and authentic storytelling.",
            }),
          });
          const data = await res.json();
          setReplies((prev) =>
            prev.map((r) =>
              r.persona === p
                ? { ...r, reply: data.reply ?? "Could not generate reply.", loading: false }
                : r
            )
          );
        } catch {
          const fallbacks: Record<Persona, string> = {
            preppy: "Oh my gosh YES, this look is giving main character energy 🎀 Obsessed!",
            sporty: "Honestly threw this together in 5 min and that's the point 😂 comfort wins",
            sophisticated:
              "The layering here is intentional — texture contrast is doing all the heavy lifting.",
            chaotic:
              "Me buying this immediately even though I have zero events to wear it to 💀💀",
          };
          setReplies((prev) =>
            prev.map((r) =>
              r.persona === p
                ? { ...r, reply: fallbacks[p], loading: false }
                : r
            )
          );
        }
      })
    );

    // Fix #6: only mark hasFetched true AFTER all replies have settled
    setHasFetched(true);
  };

  // Fix #1: added `persona` to dep array so fetch re-runs when persona prop changes
  useEffect(() => {
    if (topic) fetchReplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, persona]);

  // Fix #6: Regenerate button only shows when fetched AND nothing is still loading
  const isLoading = replies.some((r) => r.loading);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Soph's Many Sides React
          </h2>
        </div>
        {/* Fix #6: hide Regenerate while cards are still loading */}
        {hasFetched && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchReplies}
            className="text-xs gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4 italic">
        AI-generated reactions — each one a different side of Soph's personality ✨
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="space-y-2">
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
    </section>
  );
}
