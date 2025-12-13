import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logShareEvent } from "@/lib/analytics";

type ShareButtonsProps = {
  title: string;
  url: string; // relative path like /blog/my-post
  image?: string; // og image if available
};

export default function ShareButtons({ title, url, image }: ShareButtonsProps) {
  const absoluteUrl = useMemo(() => {
    if (typeof window === "undefined") return url;
    const origin = window.location.origin;
    return url.startsWith("http") ? url : `${origin}${url}`;
  }, [url]);

  useEffect(() => {
    // preconnect hint could be added via MetaTags; keep minimal here
  }, []);

  const onShare = async (channel: "twitter" | "facebook" | "pinterest" | "copy") => {
    try {
      logShareEvent(channel, { title, url: absoluteUrl });
      if (channel === "copy") {
        await navigator.clipboard.writeText(absoluteUrl);
        toast.success("Link copied to clipboard");
        return;
      }
      const encodedUrl = encodeURIComponent(absoluteUrl);
      const encodedText = encodeURIComponent(title);
      let shareUrl = "";
      switch (channel) {
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          break;
        case "pinterest":
          shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}${image ? `&media=${encodeURIComponent(image)}` : ""}`;
          break;
      }
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error("Unable to share right now");
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Button variant="outline" onClick={() => onShare("twitter")}>Share on X</Button>
      <Button variant="outline" onClick={() => onShare("facebook")}>Share on Facebook</Button>
      <Button variant="outline" onClick={() => onShare("pinterest")}>Pin on Pinterest</Button>
      <Button variant="secondary" onClick={() => onShare("copy")}>Copy Link</Button>
    </div>
  );
}
