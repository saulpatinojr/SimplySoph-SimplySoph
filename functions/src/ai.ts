import { Request, Response } from "firebase-functions";

type Persona = "preppy" | "sporty" | "sophisticated" | "chaotic";

const ALLOWED_GENERATE_ACTIONS = [
  "titleIdeas",
  "abVariants",
  "tags",
  "seoMeta",
  "videoDescription",
  "caption",
  "altText",
  "contentBrief",
] as const;

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
    "Polished, cheerful, Lilly Pulitzer energy - uses exclamation points, loves complimenting aesthetics, very positive",
  sporty:
    "Casual, confident, low-effort cool - short sentences, admits to throwing looks together last minute, laid-back",
  sophisticated:
    "Editorial, intentional, fashion-forward - analytical about styling choices, measured tone",
  chaotic:
    "Unfiltered, meme-fluent, Gen Z - impulsive reactions, relatable chaos",
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAllowedGenerateAction(value: unknown): value is GenerateAction {
  return (
    typeof value === "string" &&
    (ALLOWED_GENERATE_ACTIONS as readonly string[]).includes(value)
  );
}

function safeString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLen);
}

function hasStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function isValidGenerateResult(action: GenerateAction, value: unknown): boolean {
  if (!isRecord(value)) return false;

  switch (action) {
  case "titleIdeas":
    return hasStringArray(value.titles) && value.titles.length > 0;
  case "abVariants":
    return hasStringArray(value.variants) && value.variants.length > 0;
  case "tags":
    return hasStringArray(value.tags) && value.tags.length > 0;
  case "seoMeta":
    return typeof value.metaTitle === "string" && typeof value.metaDescription === "string";
  case "videoDescription":
    return typeof value.description === "string";
  case "caption":
    return typeof value.caption === "string";
  case "altText":
    return typeof value.altText === "string";
  case "contentBrief":
    return (
      typeof value.hook === "string" &&
      hasStringArray(value.keyPoints) &&
      typeof value.targetAudience === "string" &&
      typeof value.format === "string" &&
      hasStringArray(value.seoKeywords)
    );
  default:
    return false;
  }
}

function buildPrompt(action: GenerateAction, req: GenerateRequest): string {
  const content = safeString(req.content, 4000);
  const title = safeString(req.title, 300);
  const platform = safeString(req.platform, 60) || "instagram";

  const prompts: Record<GenerateAction, string> = {
    titleIdeas: `You are a content strategist for a fashion and lifestyle creator. Generate 5 engaging blog/video title ideas based on this topic or draft content:\n"${content || title}"\nReturn ONLY valid JSON: {"titles": ["title1", "title2", "title3", "title4", "title5"]}`,

    abVariants: `You are a content optimizer. Generate 3 A/B test variants for this headline optimized for click-through rate:\n"${title || content}"\nReturn ONLY valid JSON: {"variants": ["variant1", "variant2", "variant3"]}`,

    tags: `You are a social media strategist for a fashion and lifestyle brand. Analyze this content and return 8 relevant hashtags/tags (no # symbol):\n"${content || title}"\nReturn ONLY valid JSON: {"tags": ["tag1", "tag2"]}`,

    seoMeta: `You are an SEO expert for a fashion and lifestyle blog. Create optimized meta title (max 60 chars) and description (max 160 chars) for:\n"${content || title}"\nReturn ONLY valid JSON: {"metaTitle": "...", "metaDescription": "..."}`,

    videoDescription: `You are a YouTube/video content creator specializing in fashion and lifestyle. Write an engaging video description for:\nTitle: "${title || content}"\nInclude: hook, value proposition, CTA to subscribe, 5 relevant hashtags.\nReturn ONLY valid JSON: {"description": "..."}`,

    caption: `You are a social media manager for a fashion creator. Write a ${platform} caption for this content:\n"${content || title}"\nMake it engaging, authentic, and include 5 relevant hashtags.\nReturn ONLY valid JSON: {"caption": "..."}`,

    altText: `You are an accessibility expert. Write descriptive alt text for an image used in a fashion/lifestyle context:\nContext: "${content || title}"\nKeep it under 125 characters, descriptive but concise.\nReturn ONLY valid JSON: {"altText": "..."}`,

    contentBrief: `You are a content strategist for a top fashion creator. Create a detailed content brief for:\n"${content || title}"\nInclude: hook, key talking points (5), target audience, suggested format, SEO keywords (5).\nReturn ONLY valid JSON: {"hook": "...", "keyPoints": ["..."], "targetAudience": "...", "format": "...", "seoKeywords": ["..."]}`,
  };

  return prompts[action];
}

/**
 * handlePersonaReplies
 *
 * POST /api/ai/persona-replies
 * Body: PersonaRepliesRequest
 */
export async function handlePersonaReplies(
  req: Request,
  res: Response
): Promise<void> {
  const body = req.body as Partial<PersonaRepliesRequest>;
  const {
    personas,
    fanComments = [],
    creatorName = "Soph",
    creatorBio = "Fashion, lifestyle, and creative content for the modern generation.",
  } = body;

  const safeTopic = safeString(body.topic, 500);
  if (!personas?.length || !safeTopic) {
    res.status(400).json({ error: "personas[] and topic are required" });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    console.info("[personaReplies] GEMINI_API_KEY not set; returning empty replies");
    res.json({ replies: {} });
    return;
  }

  const validPersonas = personas.filter((p): p is Persona => p in PERSONA_VOICES);
  if (!validPersonas.length) {
    res.status(400).json({ error: "No valid personas in request" });
    return;
  }

  const voiceDescriptions = validPersonas
    .map(p => `- "${p}": ${PERSONA_VOICES[p]}`)
    .join("\n");

  const safeFanComments = fanComments
    .map(comment => safeString(comment, 280))
    .filter(Boolean)
    .slice(0, 5);

  const fanContext =
    safeFanComments.length > 0
      ? `\nTop fan comments for context:\n${safeFanComments.map(c => `  - ${c}`).join("\n")}`
      : "";

  const prompt = `You are generating short social media comments from ${creatorName}'s different style personas.
Creator bio: ${creatorBio}

Topic / content title: "${safeTopic}"${fanContext}

Write exactly ONE short comment (1-2 sentences, under 120 characters each) for each of the following personas.
Each comment should sound like ${creatorName} is reacting to this content from that persona's perspective.

Personas and their voices:
${voiceDescriptions}

Reply with ONLY valid JSON (no markdown, no explanation) in this exact shape:
{"replies": {"persona_name": "comment text"}}

Generate replies for: ${JSON.stringify(validPersonas)}`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
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
      throw new Error(`Gemini API status ${response.status}`);
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
      console.error("[personaReplies] Failed to parse JSON response");
      parsed = {};
    }

    const replies = isRecord(parsed.replies)
      ? Object.fromEntries(
          Object.entries(parsed.replies)
            .filter(([key, value]) => validPersonas.includes(key as Persona) && typeof value === "string")
            .map(([key, value]) => [key, (value as string).slice(0, 280)])
        )
      : {};

    res.json({ replies });
  } catch (err) {
    console.error("[personaReplies] Gemini request failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    res.json({ replies: {} });
  }
}

/**
 * handleAiGenerate
 *
 * POST /api/ai/generate
 * Body: GenerateRequest
 */
export async function handleAiGenerate(
  req: Request,
  res: Response
): Promise<void> {
  const body = req.body as Partial<GenerateRequest>;

  if (!isAllowedGenerateAction(body.action)) {
    res.status(400).json({
      error: "action is required and must be one of the supported actions",
      allowedActions: ALLOWED_GENERATE_ACTIONS,
    });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.warn("[aiGenerate] GEMINI_API_KEY not set; returning fallback");
    res.status(503).json({ error: "AI service not configured" });
    return;
  }

  const action = body.action;
  const prompt = buildPrompt(action, body as GenerateRequest);

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
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
      throw new Error(`Gemini API status ${response.status}`);
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
      console.error("[aiGenerate] Failed to parse JSON response");
      parsed = {};
    }

    if (!isValidGenerateResult(action, parsed)) {
      res.status(502).json({ error: "AI provider returned an invalid payload" });
      return;
    }

    res.json({ result: parsed });
  } catch (err) {
    console.error("[aiGenerate] Request failed", {
      message: err instanceof Error ? err.message : "unknown",
      action,
    });
    res.status(500).json({ error: "AI generation failed" });
  }
}
