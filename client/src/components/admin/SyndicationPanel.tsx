import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Linkedin, Instagram, Twitter, Check } from "lucide-react";
import { aiService } from "@/lib/content";
import { toast } from "sonner";

interface SyndicationPanelProps {
  content: string;
  title: string;
}

export function SyndicationPanel({ content, title }: SyndicationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [snippets, setSnippets] = useState<{
    twitter: string;
    instagram: string;
    linkedin: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!content || !title) {
      toast.error("Please provide a title and content first.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiService.generateSyndicationSnippets(
        title,
        content
      );
      setSnippets(result);
      toast.success("Syndication snippets generated!");
    } catch (error) {
      toast.error("Failed to generate snippets.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4 pt-6 border-t border-border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cross-Platform Syndication</h3>
          <p className="text-sm text-muted-foreground">
            Generate AI-optimized snippets to share this post on social media.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleGenerate}
          disabled={isGenerating || !content}
          size="sm"
          className="gap-2 h-8"
        >
          <Sparkles size={14} className="text-purple-500" />
          {isGenerating ? "Generating..." : "Generate Snippets"}
        </Button>
      </div>

      {snippets && (
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Twitter size={16} className="text-blue-400" /> Twitter
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(snippets.twitter)}
              >
                Copy
              </Button>
            </div>
            <Textarea
              value={snippets.twitter}
              readOnly
              className="h-32 text-sm bg-muted/30"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Instagram size={16} className="text-pink-600" /> Instagram
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(snippets.instagram)}
              >
                Copy
              </Button>
            </div>
            <Textarea
              value={snippets.instagram}
              readOnly
              className="h-32 text-sm bg-muted/30"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Linkedin size={16} className="text-blue-700" /> LinkedIn
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => copyToClipboard(snippets.linkedin)}
              >
                Copy
              </Button>
            </div>
            <Textarea
              value={snippets.linkedin}
              readOnly
              className="h-32 text-sm bg-muted/30"
            />
          </div>
        </div>
      )}
    </div>
  );
}
