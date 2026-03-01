/**
 * Mock AI Service Interface
 *
 * Provides placeholder implementations for AI-powered features.
 * In production, these should be replaced by calls to a secure Firebase Cloud Function
 * that communicates with OpenAI, Anthropic, or Gemini.
 */

// Delay helper to simulate network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface AIPrediction {
  score: number; // 0-100
  factors: {
    titleStrength: "low" | "medium" | "high";
    readability: "low" | "medium" | "high";
    engagementPotential: "low" | "medium" | "high";
  };
  suggestions: string[];
}

export const aiService = {
  /**
   * Generates title ideas based on a topic or draft content
   */
  async generateTitleIdeas(contentOrTopic: string): Promise<string[]> {
    await delay(1500);
    const baseWord = contentOrTopic.split(" ")[0] || "Style";
    return [
      `The Ultimate Guide to ${baseWord} This Season`,
      `5 Ways to Elevate Your ${baseWord} Look`,
      `Why Everyone is Talking About ${baseWord}`,
      `My Secret to Perfect ${baseWord} Every Time`,
      `The ${baseWord} Trends You Need to Know Now`,
    ];
  },

  /**
   * Suggests A/B test variations for a given title
   */
  async generateAbVariants(title: string): Promise<string[]> {
    await delay(1200);
    return [
      `[Variation A] ${title} (The Secret Method)`,
      `[Variation B] How to Master ${title} Today`,
      `[Variation C] Why You're Doing ${title} Wrong`,
    ];
  },

  /**
   * Generates relevant tags by analyzing content
   */
  async generateTags(content: string): Promise<string[]> {
    await delay(2000);
    // Simple mock logic: return some predefined fashion/lifestyle tags
    const possibleTags = [
      "fashion",
      "style",
      "trends",
      "ootd",
      "beauty",
      "skincare",
      "lifestyle",
      "travel",
      "vlog",
      "tips",
    ];
    // Return 3-5 random tags
    const count = Math.floor(Math.random() * 3) + 3;
    const shuffled = possibleTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },

  /**
   * Generates SEO metadata (title and description) based on content
   */
  async generateSeoMeta(
    content: string
  ): Promise<{ metaTitle: string; metaDescription: string }> {
    await delay(2500);
    return {
      metaTitle: "Optimized SEO Title | SimplySoph",
      metaDescription:
        "An AI-generated, optimized meta description designed to maximize click-through rates from search engines. Discover the latest trends and insights here.",
    };
  },

  /**
   * Generates a YouTube/video description based on the title
   */
  async generateVideoDescription(title: string): Promise<string> {
    await delay(2000);
    return `Welcome to my latest video: "${title}"!\n\nIn this video, we dive deep into the ultimate style guide, giving you the best tips and tricks. Don't forget to like and subscribe for more fashion content!\n\nLinks mentioned:\n- Outfit 1 details\n- Outfit 2 details\n\n#fashion #style #simplysoph`;
  },

  /**
   * Predicts content performance based on various factors
   */
  async predictPerformance(
    content: string,
    title?: string,
    tags?: string[]
  ): Promise<AIPrediction> {
    await delay(1000);
    // Generate a reasonable mock score
    const contentLength = content.length;
    let score = 65; // Base score

    if (contentLength > 500) score += 10;
    if (contentLength > 1500) score += 10;
    if (title && title.length > 20) score += 5;
    if (tags && tags.length >= 3) score += 5;

    // Cap at 98
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

  /**
   * Suggests the optimal posting time based on audience timezone and historical data
   */
  async suggestPostingTime(): Promise<Date> {
    await delay(1000);
    // Suggest a time tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  },

  /**
   * Analyzes an image (by URL) and generates descriptive alt text
   */
  async generateAltText(imageUrl: string): Promise<string> {
    await delay(2000);
    return "A stylishly composed photograph capturing a modern fashion aesthetic, with vibrant colors and sharp details.";
  },

  /**
   * Generates social media syndication snippets for a blog post
   */
  async generateSyndicationSnippets(
    title: string,
    content: string
  ): Promise<{ twitter: string; instagram: string; linkedin: string }> {
    await delay(2500);
    return {
      twitter: `Just published a new post: "${title}"! Check out the latest trends and my personal take on this style. 🧵👇 #fashion #style #simplysoph\n\nRead more at: simplysoph.com`,
      instagram: `${title} ✨\n\nI just dropped a massive new guide on the blog! Link in bio to read the full breakdown. Let me know what you think in the comments! 👇\n\n#fashion #styleblogger #ootd #simplysoph #newpost`,
      linkedin: `I'm excited to share my latest article: "${title}". \n\nIn this piece, I explore the intersection of modern aesthetics and everyday utility. Take a read and let me know your thoughts!\n\n#FashionIndustry #ContentCreation #SimplySoph`,
    };
  },
};
