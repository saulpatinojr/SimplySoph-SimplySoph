/**
 * AI Service
 *
 * Calls the Firebase Cloud Function at /api/ai/generate (backed by Gemini 1.5 Flash).
 * Falls back to sensible placeholder content if the API is unavailable or unconfigured.
 *
 * All calls are proxied through Firebase Hosting rewrites to the deployed HTTPS function,
 * so no API keys are exposed on the client.
 */

import { API_BASE } from "@/const";

export interface AIPrediction {
  score: number;
  factors: {
    titleStrength: "low" | "medium" | "high";
    readability: "low" | "medium" | "high";
    engagementPotential: "low" | "medium" | "high";
  };
  suggestions: string[];
}

type GenerateAction =
  | "titleIdeas"
  | "abVariants"
  | "tags"
  | "seoMeta"
  | "videoDescription"
  | "caption"
  | "altText"
  | "contentBrief";

interface GeneratePayload {
  action: GenerateAction;
  content?: string;
  title?: string;
  platform?: string;
}

async function callAiApi<T>(payload: GeneratePayload): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/ai/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn(`[AI] API returned ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { result?: T };
    return data.result ?? null;
  } catch (err) {
    console.warn("[AI] Network error, using fallback:", err);
    return null;
  }
}

export const aiService = {
  async generateTitleIdeas(contentOrTopic: string): Promise<string[]> {
    const result = await callAiApi<{ titles: string[] }>({
      action: "titleIdeas",
      content: contentOrTopic,
    });
    if (result?.titles?.length) return result.titles;
    const base = contentOrTopic.split(" ")[0] || "Style";
    return [
      `The Ultimate Guide to ${base} This Season`,
      `5 Ways to Elevate Your ${base} Look`,
      `Why Everyone is Talking About ${base}`,
      `My Secret to Perfect ${base} Every Time`,
      `${base} Trends You Need to Know Now`,
    ];
  },

  async generateAbVariants(title: string): Promise<string[]> {
    const result = await callAiApi<{ variants: string[] }>({ action: "abVariants", title });
    if (result?.variants?.length) return result.variants;
    return [
      `${title} (The Secret Method)`,
      `How to Master ${title} Today`,
      `Why You're Doing ${title} Wrong`,
    ];
  },

  async generateTags(content: string): Promise<string[]> {
    const result = await callAiApi<{ tags: string[] }>({ action: "tags", content });
    if (result?.tags?.length) return result.tags;
    return ["fashion", "style", "trends", "ootd", "lifestyle"];
  },

  async generateSeoMeta(
    content: string
  ): Promise<{ metaTitle: string; metaDescription: string }> {
    const result = await callAiApi<{ metaTitle: string; metaDescription: string }>({
      action: "seoMeta",
      content,
    });
    if (result?.metaTitle) return result;
    return {
      metaTitle: "SimplySoph — Fashion & Lifestyle",
      metaDescription:
        "Discover the latest fashion trends, lifestyle tips, and style inspiration from SimplySoph.",
    };
  },

  async generateVideoDescription(title: string): Promise<string> {
    const result = await callAiApi<{ description: string }>({ action: "videoDescription", title });
    if (result?.description) return result.description;
    return `Welcome to my latest video: "${title}"!\n\nSubscribe for more content!\n\n#fashion #style #simplysoph`;
  },

  async generateCaption(content: string, platform = "instagram"): Promise<string> {
    const result = await callAiApi<{ caption: string }>({ action: "caption", content, platform });
    if (result?.caption) return result.caption;
    return `${content}\n\n#fashion #style #simplysoph`;
  },

  async predictPerformance(
    content: string,
    title?: string,
    tags?: string[]
  ): Promise<AIPrediction> {
    const contentLength = content.length;
    let score = 65;
    if (contentLength > 500) score += 10;
    if (contentLength > 1500) score += 10;
    if (title && title.length > 20) score += 5;
    if (tags && tags.length >= 3) score += 5;
    score = Math.min(score, 98);
    return {
      score,
      factors: {
        titleStrength: title && title.length > 30 ? "high" : "medium",
        readability: contentLength > 1000 ? "high" : "medium",
        engagementPotential: score > 80 ? "high" : "medium",
      },
      suggestions: [
        "Include more subheadings to break up text",
        "Add a clear call-to-action at the end",
        "Consider asking a question in the first paragraph to hook readers",
      ],
    };
  },

  async suggestPostingTime(): Promise<Date> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  },

  async generateAltText(imageUrl: string): Promise<string> {
    const result = await callAiApi<{ altText: string }>({ action: "altText", content: imageUrl });
    if (result?.altText) return result.altText;
    return "A stylish fashion photograph from SimplySoph.";
  },

  async generateContentBrief(content: string): Promise<{
    hook: string;
    keyPoints: string[];
    targetAudience: string;
    format: string;
    seoKeywords: string[];
  }> {
    const result = await callAiApi<{
      hook: string;
      keyPoints: string[];
      targetAudience: string;
      format: string;
      seoKeywords: string[];
    }>({ action: "contentBrief", content });
    if (result?.hook) return result;
    return {
      hook: "Start with a relatable style dilemma...",
      keyPoints: ["Current trends", "Personal style tips", "Affordable options", "Outfit inspiration", "Styling hacks"],
      targetAudience: "Fashion-forward women aged 18-35",
      format: "Long-form blog post with images",
      seoKeywords: ["fashion tips", "style guide", "outfit ideas", "fashion trends", "simplysoph"],
    };
  },

  async generateSyndicationSnippets(
    title: string,
    content: string
  ): Promise<{ twitter: string; instagram: string; linkedin: string }> {
    const [twitterResult, instagramResult] = await Promise.all([
      callAiApi<{ caption: string }>({ action: "caption", title, content, platform: "twitter" }),
      callAiApi<{ caption: string }>({ action: "caption", title, content, platform: "instagram" }),
    ]);
    return {
      twitter:
        twitterResult?.caption ??
        `Just published: "${title}" #fashion #style #simplysoph\nRead at: simplysoph.com`,
      instagram:
        instagramResult?.caption ??
        `${title} ✨\n\nNew post is live — link in bio!\n\n#fashion #styleblogger #ootd #simplysoph`,
      linkedin: `I just published: "${title}".\n\nDiscover the latest fashion insights at SimplySoph.\n\n#FashionIndustry #ContentCreation`,
    };
  },
};