import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContentRelatedLink } from "@/lib/content";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface RelatedLinksEditorProps {
  value: ContentRelatedLink[];
  onChange: (next: ContentRelatedLink[]) => void;
  title?: string;
  compact?: boolean;
}

function createEmptyRelatedLink(): ContentRelatedLink {
  return {
    id: crypto.randomUUID(),
    type: "blog",
    title: "",
    url: "",
    description: "",
    imageUrl: "",
    matchReason: "Curated by editor",
  };
}

export default function RelatedLinksEditor({
  value,
  onChange,
  title = "Related links",
  compact = false,
}: RelatedLinksEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [pendingInputFocusIndex, setPendingInputFocusIndex] = useState<
    number | null
  >(null);
  const [pendingToggleFocusIndex, setPendingToggleFocusIndex] = useState<
    number | null
  >(null);
  const [liveMessage, setLiveMessage] = useState("");
  const firstInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const toggleButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const previousIssueCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!compact) return;
    if (expandedIndex !== null && expandedIndex >= (value || []).length) {
      setExpandedIndex((value || []).length > 0 ? (value || []).length - 1 : null);
    }
  }, [compact, expandedIndex, value]);

  useEffect(() => {
    if (pendingInputFocusIndex === null) return;
    const element = firstInputRefs.current[pendingInputFocusIndex];
    if (element) {
      element.focus();
    }
    setPendingInputFocusIndex(null);
  }, [pendingInputFocusIndex, value]);

  useEffect(() => {
    if (pendingToggleFocusIndex === null) return;
    const element = toggleButtonRefs.current[pendingToggleFocusIndex];
    if (element) {
      element.focus();
    }
    setPendingToggleFocusIndex(null);
  }, [pendingToggleFocusIndex, value]);

  function addLink() {
    const next = [...(value || []), createEmptyRelatedLink()];
    onChange(next);
    if (compact) {
      const nextIndex = next.length - 1;
      setExpandedIndex(nextIndex);
      setPendingInputFocusIndex(nextIndex);
    }
  }

  function updateLink(index: number, patch: Partial<ContentRelatedLink>) {
    const next = [...(value || [])];
    next[index] = { ...next[index], ...patch } as ContentRelatedLink;
    onChange(next);
  }

  function removeLink(index: number) {
    const next = (value || []).filter((_, itemIndex) => itemIndex !== index);
    onChange(next);
    if (compact) {
      if (next.length === 0) {
        setExpandedIndex(null);
        return;
      }
      const nextIndex = Math.min(index, next.length - 1);
      setExpandedIndex(nextIndex);
      setPendingToggleFocusIndex(nextIndex);
    }
  }

  function toggleExpanded(index: number) {
    if (!compact) return;
    setExpandedIndex(prev => (prev === index ? null : index));
  }

  function isValidUrlOrPath(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("/")) return true;

    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  function getLinkErrors(link: ContentRelatedLink) {
    const titleValue = link.title.trim();
    const urlValue = link.url.trim();
    const imageValue = (link.imageUrl || "").trim();

    return {
      title: titleValue ? "" : "Link title is required.",
      url: urlValue
        ? link.type === "external"
          ? urlValue.startsWith("http://") || urlValue.startsWith("https://")
            ? ""
            : "External links must use a full http(s) URL."
          : isValidUrlOrPath(urlValue)
            ? ""
            : "Use a valid path (/route) or full http(s) URL."
        : "Link URL is required.",
      imageUrl:
        imageValue && !isValidUrlOrPath(imageValue)
          ? "Image URL must be a valid path or http(s) URL."
          : "",
    };
  }

  function getErrorCount(link: ContentRelatedLink) {
    return Object.values(getLinkErrors(link)).filter(Boolean).length;
  }

  const totalIssueCount = (value || []).reduce(
    (sum, link) => sum + getErrorCount(link),
    0
  );

  useEffect(() => {
    if (previousIssueCountRef.current === null) {
      previousIssueCountRef.current = totalIssueCount;
      return;
    }

    if (previousIssueCountRef.current !== totalIssueCount) {
      setLiveMessage(
        totalIssueCount === 0
          ? `All validation issues resolved in ${title}.`
          : `${title} now has ${totalIssueCount} validation issue${totalIssueCount > 1 ? "s" : ""}.`
      );
      previousIssueCountRef.current = totalIssueCount;
    }
  }, [title, totalIssueCount]);

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {liveMessage}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-base">{title}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLink}>
          <Plus className="mr-2 h-4 w-4" />
          Add link
        </Button>
      </div>

      {(value || []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No related links added yet.</p>
      ) : (
        <div className={cn("space-y-3", compact && "space-y-2")}>
          {(value || []).map((link, index) => (
            <section key={link.id || index} className="rounded-md border">
              <button
                type="button"
                ref={element => {
                  toggleButtonRefs.current[index] = element;
                }}
                onClick={() => toggleExpanded(index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={!compact || expandedIndex === index}
                aria-controls={`related-link-panel-${index}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Link {index + 1}: {link.title.trim() || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{link.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getErrorCount(link) > 0 ? (
                    <span className="text-xs font-medium text-destructive">
                      {getErrorCount(link)} issue{getErrorCount(link) > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">Ready</span>
                  )}
                  {compact && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedIndex === index && "rotate-180"
                        )}
                      />
                      {expandedIndex === index ? "Collapse" : "Expand"}
                    </span>
                  )}
                </div>
              </button>

              {(!compact || expandedIndex === index) && (
              <div
                id={`related-link-panel-${index}`}
                className={cn("grid gap-3 border-t p-4 md:grid-cols-2", compact && "gap-2 p-3")}
              >
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Type</Label>
                  <Select
                    value={link.type}
                    onValueChange={selected =>
                      updateLink(index, {
                        type: selected as ContentRelatedLink["type"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                      <SelectItem value="destination">Destination</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Core</Label>
                  <Input
                    ref={element => {
                      firstInputRefs.current[index] = element;
                    }}
                    value={link.title}
                    onChange={event => updateLink(index, { title: event.target.value })}
                    placeholder="Link title *"
                    className={cn(getLinkErrors(link).title && "border-destructive focus-visible:ring-destructive")}
                  />
                  {getLinkErrors(link).title && (
                    <p className="text-xs text-destructive">{getLinkErrors(link).title}</p>
                  )}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Destination</Label>
                  <Input
                    value={link.url}
                    onChange={event => updateLink(index, { url: event.target.value })}
                    placeholder={link.type === "external" ? "https://example.com" : "/passport/lisbon or https://example.com"}
                    className={cn(getLinkErrors(link).url && "border-destructive focus-visible:ring-destructive")}
                  />
                  {getLinkErrors(link).url && (
                    <p className="text-xs text-destructive">{getLinkErrors(link).url}</p>
                  )}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Presentation</Label>
                  <Input
                    value={link.imageUrl || ""}
                    onChange={event => updateLink(index, { imageUrl: event.target.value })}
                    placeholder="Image URL (optional)"
                    className={cn(getLinkErrors(link).imageUrl && "border-destructive focus-visible:ring-destructive")}
                  />
                  {getLinkErrors(link).imageUrl && (
                    <p className="text-xs text-destructive">{getLinkErrors(link).imageUrl}</p>
                  )}
                </div>

                <Textarea
                  value={link.description || ""}
                  onChange={event => updateLink(index, { description: event.target.value })}
                  placeholder="Short description"
                  className="md:col-span-2"
                  rows={compact ? 2 : 3}
                />

                <Input
                  value={link.matchReason || ""}
                  onChange={event => updateLink(index, { matchReason: event.target.value })}
                  placeholder="Match reason"
                  className="md:col-span-2"
                />

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeLink(index)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove link
                  </Button>
                </div>
              </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
