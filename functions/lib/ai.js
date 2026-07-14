"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAiGenerate = exports.handlePersonaReplies = void 0;
const telemetry_1 = require("./telemetry");
const ALLOWED_GENERATE_ACTIONS = [
    "titleIdeas",
    "abVariants",
    "tags",
    "seoMeta",
    "videoDescription",
    "caption",
    "altText",
    "contentBrief",
];
/** Brief descriptions used to shape each persona's voice in the prompt */
const PERSONA_VOICES = {
    preppy: "Polished, cheerful, Lilly Pulitzer energy - uses exclamation points, loves complimenting aesthetics, very positive",
    sporty: "Casual, confident, low-effort cool - short sentences, admits to throwing looks together last minute, laid-back",
    sophisticated: "Editorial, intentional, fashion-forward - analytical about styling choices, measured tone",
    chaotic: "Unfiltered, meme-fluent, Gen Z - impulsive reactions, relatable chaos",
};
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isAllowedGenerateAction(value) {
    return (typeof value === "string" &&
        ALLOWED_GENERATE_ACTIONS.includes(value));
}
function safeString(value, maxLen) {
    if (typeof value !== "string")
        return "";
    return value.slice(0, maxLen);
}
function hasStringArray(value) {
    return Array.isArray(value) && value.every(item => typeof item === "string");
}
function isValidGenerateResult(action, value) {
    if (!isRecord(value))
        return false;
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
            return (typeof value.hook === "string" &&
                hasStringArray(value.keyPoints) &&
                typeof value.targetAudience === "string" &&
                typeof value.format === "string" &&
                hasStringArray(value.seoKeywords));
        default:
            return false;
    }
}
function buildPrompt(action, req) {
    const content = safeString(req.content, 4000);
    const title = safeString(req.title, 300);
    const platform = safeString(req.platform, 60) || "instagram";
    const prompts = {
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
async function handlePersonaReplies(req, res) {
    var _a, _b, _c, _d, _e, _f;
    const body = req.body;
    const { personas, fanComments = [], creatorName = "Soph", creatorBio = "Fashion, lifestyle, and creative content for the modern generation.", } = body;
    const safeTopic = safeString(body.topic, 500);
    if (!(personas === null || personas === void 0 ? void 0 : personas.length) || !safeTopic) {
        res.status(400).json({ error: "personas[] and topic are required" });
        return;
    }
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        (0, telemetry_1.logInfo)("ai.persona_replies.unconfigured", {
            reason: "missing_gemini_api_key",
        });
        res.json({ replies: {} });
        return;
    }
    const validPersonas = personas.filter((p) => p in PERSONA_VOICES);
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
    const fanContext = safeFanComments.length > 0
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
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
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
        });
        if (!response.ok) {
            throw new Error(`Gemini API status ${response.status}`);
        }
        const data = (await response.json());
        const rawText = (_f = (_e = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : "{}";
        let parsed;
        try {
            parsed = JSON.parse(rawText);
        }
        catch (_g) {
            (0, telemetry_1.logWarn)("ai.persona_replies.parse_failed", {
                responsePreview: rawText,
            });
            parsed = {};
        }
        const replies = isRecord(parsed.replies)
            ? Object.fromEntries(Object.entries(parsed.replies)
                .filter(([key, value]) => validPersonas.includes(key) && typeof value === "string")
                .map(([key, value]) => [key, value.slice(0, 280)]))
            : {};
        res.json({ replies });
    }
    catch (err) {
        (0, telemetry_1.logError)("ai.persona_replies.request_failed", {
            error: err,
            topic: safeTopic,
        });
        res.json({ replies: {} });
    }
}
exports.handlePersonaReplies = handlePersonaReplies;
/**
 * handleAiGenerate
 *
 * POST /api/ai/generate
 * Body: GenerateRequest
 */
async function handleAiGenerate(req, res) {
    var _a, _b, _c, _d, _e, _f;
    const body = req.body;
    const action = body.action;
    if (!isAllowedGenerateAction(action)) {
        res.status(400).json({
            error: "action is required and must be one of the supported actions",
            allowedActions: ALLOWED_GENERATE_ACTIONS,
        });
        return;
    }
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        (0, telemetry_1.logWarn)("ai.generate.unconfigured", {
            action,
            reason: "missing_gemini_api_key",
        });
        res.status(503).json({ error: "AI service not configured" });
        return;
    }
    const prompt = buildPrompt(action, body);
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
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
        });
        if (!response.ok) {
            throw new Error(`Gemini API status ${response.status}`);
        }
        const data = (await response.json());
        const rawText = (_f = (_e = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : "{}";
        let parsed;
        try {
            parsed = JSON.parse(rawText);
        }
        catch (_g) {
            (0, telemetry_1.logWarn)("ai.generate.parse_failed", {
                action,
                responsePreview: rawText,
            });
            parsed = {};
        }
        if (!isValidGenerateResult(action, parsed)) {
            res.status(502).json({ error: "AI provider returned an invalid payload" });
            return;
        }
        res.json({ result: parsed });
    }
    catch (err) {
        (0, telemetry_1.logError)("ai.generate.request_failed", {
            error: err,
            action,
        });
        res.status(500).json({ error: "AI generation failed" });
    }
}
exports.handleAiGenerate = handleAiGenerate;
//# sourceMappingURL=ai.js.map