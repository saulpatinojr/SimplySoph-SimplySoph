import { useMemo, useState } from "react";
import { toast } from "sonner";
import { logShareEvent } from "@/lib/analytics";
import { Share2, X, Facebook, Link2, Check } from "lucide-react";

// Minimal Pinterest SVG — not in Lucide
function PinterestIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

type Channel = "native" | "x" | "facebook" | "pinterest" | "copy";

type ShareButtonsProps = {
  title: string;
  url: string;
  image?: string;
  /**
   * Compact icon-only strip (default false — shows labelled pills)
   */
  compact?: boolean;
};

export default function ShareButtons({ title, url, image, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const absoluteUrl = useMemo(() => {
    if (typeof window === "undefined") return url;
    return url.startsWith("http") ? url : `${window.location.origin}${url}`;
  }, [url]);

  // Use Web Share API when available (mobile-native)
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  const onShare = async (channel: Channel) => {
    try {
      logShareEvent(channel === "native" ? "native" : channel, { title, url: absoluteUrl });

      if (channel === "native") {
        await navigator.share({ title, url: absoluteUrl });
        return;
      }

      if (channel === "copy") {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(absoluteUrl);
        } else {
          // Fallback for older browsers / non-HTTPS
          const ta = document.createElement("textarea");
          ta.value = absoluteUrl;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        toast.success("Link copied to clipboard — paste to share!");
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      const enc  = encodeURIComponent(absoluteUrl);
      const encT = encodeURIComponent(title);
      const shareUrl =
        channel === "x"
          ? `https://twitter.com/intent/tweet?url=${enc}&text=${encT}`
          : channel === "facebook"
            ? `https://www.facebook.com/sharer/sharer.php?u=${enc}`
            : `https://pinterest.com/pin/create/button/?url=${enc}&description=${encT}${
                image ? `&media=${encodeURIComponent(image)}` : ""
              }`;

      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    } catch (err) {
      // navigator.share throws AbortError when user cancels — not an actual error
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[Share] error:", err);
      toast.error("Unable to share right now. Try copying the link instead.");
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2" role="group" aria-label="Share this post">
        {canNativeShare && (
          <button
            onClick={() => onShare("native")}
            aria-label="Share"
            className="share-btn"
          >
            <Share2 size={15} />
          </button>
        )}
        <button onClick={() => onShare("x")} aria-label="Share on X" className="share-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
        <button onClick={() => onShare("facebook")} aria-label="Share on Facebook" className="share-btn">
          <Facebook size={15} />
        </button>
        <button onClick={() => onShare("pinterest")} aria-label="Pin on Pinterest" className="share-btn">
          <PinterestIcon size={15} />
        </button>
        <button onClick={() => onShare("copy")} aria-label={copied ? "Copied!" : "Copy link"} className="share-btn">
          {copied ? <Check size={15} /> : <Link2 size={15} />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this post">
      {canNativeShare && (
        <button
          onClick={() => onShare("native")}
          className="share-pill"
        >
          <Share2 size={14} /> Share
        </button>
      )}

      <button onClick={() => onShare("x")} className="share-pill">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Post on X
      </button>

      <button onClick={() => onShare("facebook")} className="share-pill">
        <Facebook size={14} /> Facebook
      </button>

      <button onClick={() => onShare("pinterest")} className="share-pill">
        <PinterestIcon size={14} /> Pinterest
      </button>

      <button
        onClick={() => onShare("copy")}
        className="share-pill share-pill--accent"
        aria-live="polite"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
