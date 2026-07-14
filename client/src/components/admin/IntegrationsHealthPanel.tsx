import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/const";
import { getAdminApiHeaders } from "@/lib/services/ai";

interface IntegrationCheck {
  configured: boolean;
  ok?: boolean;
  detail?: string;
}

interface HealthResponse {
  ok: boolean;
  generatedAt: number;
  checks: Record<string, IntegrationCheck>;
}

const LABELS: Record<string, string> = {
  firestore: "Firestore (content database)",
  algolia: "Algolia (site search)",
  ai: "AI content assistant (Gemini)",
  tiktok: "TikTok API",
  instagram: "Instagram API",
  email: "Newsletter / contact email",
};

async function fetchHealth(probe: boolean): Promise<HealthResponse> {
  const res = await fetch(
    `${API_BASE}/health/integrations${probe ? "?probe=1" : ""}`,
    { headers: await getAdminApiHeaders() }
  );
  if (!res.ok) {
    throw new Error(`Health check failed (HTTP ${res.status})`);
  }
  return (await res.json()) as HealthResponse;
}

function StatusIcon({ check }: { check: IntegrationCheck }) {
  if (!check.configured) {
    return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  }
  if (check.ok === false) {
    return <XCircle className="h-4 w-4 text-destructive" />;
  }
  return <CheckCircle2 className="h-4 w-4 text-green-600" />;
}

function statusText(check: IntegrationCheck): string {
  if (!check.configured) return "Not connected";
  if (check.ok === false) return "Error";
  if (check.ok === true) return "Verified";
  return "Configured";
}

export default function IntegrationsHealthPanel() {
  const [probe, setProbe] = useState(false);

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["admin", "integrations-health", probe],
    queryFn: () => fetchHealth(probe),
    staleTime: 60 * 1000,
    retry: 1,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Integrations &amp; Connectivity
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 h-8"
            disabled={isFetching}
            onClick={() => {
              setProbe(true);
              void refetch();
            }}
          >
            <RefreshCw
              size={14}
              className={isFetching ? "animate-spin" : ""}
            />
            {isFetching ? "Checking..." : "Run live check"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isError && (
          <p className="text-sm text-destructive">
            Could not reach the API:{" "}
            {error instanceof Error ? error.message : "unknown error"}
          </p>
        )}
        {!isError && !data && (
          <p className="text-sm text-muted-foreground">Checking services...</p>
        )}
        {data && (
          <ul className="space-y-2">
            {Object.entries(data.checks).map(([key, check]) => (
              <li
                key={key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <StatusIcon check={check} />
                  {LABELS[key] ?? key}
                </span>
                <span className="text-xs text-muted-foreground text-right">
                  {statusText(check)}
                  {check.detail ? ` — ${check.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          "Configured" means credentials are set. "Run live check" verifies
          TikTok and Instagram tokens against their APIs.
        </p>
      </CardContent>
    </Card>
  );
}
