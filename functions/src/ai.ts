import { Request, Response } from "firebase-functions";

type Persona = "preppy" | "sporty" | "sophisticated" | "chaotic";

interface PersonaRepliesRequest {
  personas: Persona[];
  topic: string;
  fanComments?: string[];
  creatorName?: string;
  creatorBio?: string;
}

/** Brief descriptions used to shape each persona's voice in the prompt */
const PERSONA_VOICES: Record<Persona, string> = {
  preppy:
    "Polished, cheerful, Lilly Pulitzer energy — uses exclamation points, loves complimenting aesthetics, very positive",
  sporty:
    "Casual, confident, low-effort cool — short sentences, admits to throwing looks together last minute, laid-back",
  sophisticated:
    "Editorial, intentional, fashion-forward — analytical about styling choices, uses em-dashes, measured tone",
  chaotic:
    "Unfiltered, meme-fluent, Gen Z — uses skull emojis 💀, impulsive reactions, relatable chaos",
};

/**
 * handlePersonaReplies
 *
 * POST /api/ai/persona-replies
 * Body: PersonaRepliesRequest
 *
 * Makes a SINGLE Gemini generateContent call that returns all persona replies
 * at once, then parses and returns them as { replies: Record<Persona, string> }.
 *
 * Requires GEMINI_API_KEY in Firebase Functions environment:
 *   firebase functions:secrets:set GEMINI_API_KEY
 *   OR set via process.env for local emulator
 *
 * Returns { replies: {} } when the key is absent — the frontend falls back
 * to its hardcoded FALLBACK_REPLIES gracefully.
 */
export async function handlePersonaReplies(
  req: Request,
  res: Response
): Promise<void> {
  const body = req.body as Partial<PersonaRepliesRequest>;
  const {
    personas,
    topic,
    fanComments = [],
    creatorName = "Soph",
    creatorBio = "Fashion, lifestyle, and creative content for the modern generation.",
  } = body;

  if (!personas?.length || !topic) {
    res.status(400).json({ error: "personas[] and topic are required" });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    console.info(
      "[personaReplies] GEMINI_API_KEY not set; returning empty replies"
    );
    res.json({ replies: {} });
    return;
  }

  // Build the valid-persona subset (guard against unexpected values)
  const validPersonas = personas.filter(
    (p): p is Persona => p in PERSONA_VOICES
  );

  if (!validPersonas.length) {
    res.status(400).json({ error: "No valid personas in request" });
    return;
  }

  const voiceDescriptions = validPersonas
    .map(p => `- "${p}": ${PERSONA_VOICES[p]}`)
    .join("\n");

  const fanContext =
    fanComments.length > 0
      ? `\nTop fan comments for context:\n${fanComments
          .slice(0, 5)
          .map(c => `  • ${c}`)
          .join("\n")}`
      : "";

  const prompt = `You are generating short social media comments from ${creatorName}'s different style personas.
Creator bio: ${creatorBio}

Topic / content title: "${topic}"${fanContext}

Write exactly ONE short comment (1–2 sentences, under 120 characters each) for each of the following personas.
Each comment should sound like ${creatorName} is reacting to this content from that persona's perspective.

Personas and their voices:
${voiceDescriptions}

Reply with ONLY valid JSON (no markdown, no explanation) in this exact shape:
{"replies": {"persona_name": "comment text"}}

Generate replies for: ${JSON.stringify(validPersonas)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: { replies?: Record<string, string> };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("[personaReplies] Failed to parse Gemini JSON:", rawText);
      parsed = {};
    }

    res.json({ replies: parsed.replies ?? {} });
  } catch (err) {
    console.error("[personaReplies] Gemini API error:", err);
    // Graceful degradation — frontend will use FALLBACK_REPLIES
    res.json({ replies: {} });
  }
}

// ── General-purpose AI content generation ───────────────────────────────────

type GenerateAction =
  | "titleIdeas"
  | "abVariants"
  | "tags"
  | "seoMeta"
  | "videoDescription"
  | "caption"
  | "altText"
  | "contentBrief";

interface GenerateRequest {
  action: GenerateAction;
  content?: string;
  title?: string;
  platform?: string;
}

interface GenerateResponse {
  result: unknown;
}

function buildPrompt(action: GenerateAction, req: GenerateRequest): string {
  const { content = "", title = "", platform = "instagram" } = req;

  const prompts: Record<GenerateAction, string> = {
    titleIdeas: `You are a content strategist for a fashion & lifestyle creator. Generate 5 engaging blog/video title ideas based on this topic or draft content:
"${content || title}"
Return ONLY valid JSON: {"titles": ["title1", "title2", "title3", "title4", "title5"]}`,

    abVariants: `You are a content optimizer. Generate 3 A/B test variants for this headline optimized for click-through rate:
"${title || content}"
Return ONLY valid JSON: {"variants": ["variant1", "variant2", "variant3"]}`,

    tags: `You are a social media strategist for a fashion & lifestyle brand. Analyze this content and return 8 relevant hashtags/tags (no # symbol):
"${content || title}"
Return ONLY valid JSON: {"tags": ["tag1", "tag2", ...]}`,

    seoMeta: `You are an SEO expert for a fashion & lifestyle blog. Create optimized meta title (max 60 chars) and description (max 160 chars) for:
"${content || title}"
Return ONLY valid JSON: {"metaTitle": "...", "metaDescription": "..."}`,

    videoDescription: `You are a YouTube/video content creator specializing in fashion and lifestyle. Write an engaging video description for:
Title: "${title || content}"
Include: hook, value proposition, CTA to subscribe, 5 relevant hashtags.
Return ONLY valid JSON: {"description": "..."}`,

    caption: `You are a social media manager for a fashion creator. Write a ${platform} caption for this content:
"${content || title}"
Make it engaging, authentic, and include 5 relevant hashtags.
Return ONLY valid JSON: {"caption": "..."}`,

    altText: `You are an accessibility expert. Write descriptive alt text for an image used in a fashion/lifestyle context:
Context: "${content || title}"
Keep it under 125 characters, descriptive but concise.
Return ONLY valid JSON: {"altText": "..."}`,

    contentBrief: `You are a content strategist for a top fashion creator. Create a detailed content brief for:
"${content || title}"
Include: hook, key talking points (5), target audience, suggested format, SEO keywords (5).
Return ONLY valid JSON: {"hook": "...", "keyPoints": [...], "targetAudience": "...", "format": "...", "seoKeywords": [...]}`,
  };

  return prompts[action];
}

/**
 * handleAiGenerate
 *
 * POST /api/ai/generate
 * Body: GenerateRequest
 *
 * General-purpose content generation via Gemini 1.5 Flash.
 * Used by the admin dashboard for AI-assisted content creation.
 */
export async function handleAiGenerate(
  req: Request,
  res: Response
): Promise<void> {
  const body = req.body as Partial<GenerateRequest>;

  if (!body.action) {
    res.status(400).json({ error: "action is required" });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    console.warn("[aiGenerate] GEMINI_API_KEY not set; returning fallback");
    res.status(503).json({ error: "AI service not configured" });
    return;
  }

  const prompt = buildPrompt(body.action as GenerateAction, body as GenerateRequest);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.75,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: GenerateResponse["result"];
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("[aiGenerate] Failed to parse Gemini JSON:", rawText);
      parsed = {};
    }

    res.json({ result: parsed });
  } catch (err) {
    console.error("[aiGenerate] Error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
}
