import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logShareEvent } from "@/lib/analytics";

type ShareButtonsProps = {
  title: string;
  url: string;
  image?: string;
};

export default function ShareButtons({ title, url, image }: ShareButtonsProps) {
  const absoluteUrl = useMemo(() => {
    if (typeof window === "undefined") return url;
    const origin = window.location.origin;
    return url.startsWith("http") ? url : `${origin}${url}`;
  }, [url]);

  const onShare = async (channel: "x" | "facebook" | "pinterest" | "copy") => {
    try {
      logShareEvent(channel, { title, url: absoluteUrl });
      if (channel === "copy") {
        await navigator.clipboard.writeText(absoluteUrl);
        toast.success("Link copied to clipboard");
        return;
      }

      const encodedUrl = encodeURIComponent(absoluteUrl);
      const encodedText = encodeURIComponent(title);
      const shareUrl =
        channel === "x"
          ? `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`
          : channel === "facebook"
            ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
            : `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}${image ? `&media=${encodeURIComponent(image)}` : ""}`;

      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Unable to share right now");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={() => onShare("x")}>Share on X</Button>
      <Button variant="outline" onClick={() => onShare("facebook")}>Share on Facebook</Button>
      <Button variant="outline" onClick={() => onShare("pinterest")}>Pin on Pinterest</Button>
      <Button variant="secondary" onClick={() => onShare("copy")}>Copy Link</Button>
    </div>
  );
}
