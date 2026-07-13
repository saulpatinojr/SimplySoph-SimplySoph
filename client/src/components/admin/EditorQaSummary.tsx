import { cn } from "@/lib/utils";

interface EditorQaSummaryProps {
  title?: string;
  issues: string[];
  className?: string;
}

export default function EditorQaSummary({
  title = "Publish QA",
  issues,
  className,
}: EditorQaSummaryProps) {
  const isReady = issues.length === 0;

  return (
    <div
      className={cn(
        "rounded-md border p-4",
        isReady
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50",
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <span
          className={cn(
            "text-xs font-medium",
            isReady ? "text-emerald-700" : "text-amber-700"
          )}
        >
          {isReady ? "Ready to publish" : `${issues.length} issue${issues.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {isReady ? (
        <p className="mt-2 text-xs text-emerald-700">
          All required publish-ready checks are passing.
        </p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-800">
          {issues.slice(0, 5).map(issue => (
            <li key={issue}>{issue}</li>
          ))}
          {issues.length > 5 && <li>{`${issues.length - 5} more issue(s) hidden`}</li>}
        </ul>
      )}
    </div>
  );
}
