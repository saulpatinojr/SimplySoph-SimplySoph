import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  getSiteConfig,
  updateSiteConfigSection,
  type SiteConfig,
  type SiteConfigSection,
  type SiteNavLink,
} from "@/lib/content";
import { queryKeys } from "@/lib/queryKeys";
import {
  resolveSiteConfig,
  SITE_CONFIG_DEFAULTS,
} from "@/contexts/SiteConfigContext";

const TABS: { key: SiteConfigSection; label: string }[] = [
  { key: "branding", label: "Branding" },
  { key: "navigation", label: "Navigation" },
  { key: "hero", label: "Hero" },
  { key: "social", label: "Social" },
  { key: "seo", label: "SEO" },
  { key: "theme", label: "Theme" },
];

export default function AdminSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SiteConfigSection>("branding");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.siteConfig.root,
    queryFn: getSiteConfig,
  });

  // Form state is the resolved config (remote over defaults) so the admin
  // edits what visitors actually see.
  const resolved = useMemo(
    () => (data ? resolveSiteConfig(data) : SITE_CONFIG_DEFAULTS),
    [data]
  );
  const [form, setForm] = useState<SiteConfig>(resolved);
  useEffect(() => setForm(resolved), [resolved]);

  const saveMutation = useMutation({
    mutationFn: (section: SiteConfigSection) =>
      updateSiteConfigSection(section, form[section] as never, user?.uid),
    onSuccess: (_, section) => {
      toast.success(`${TABS.find(t => t.key === section)?.label} settings saved`);
      // One key serves both this form and the public SiteConfigProvider.
      void queryClient.invalidateQueries({ queryKey: queryKeys.siteConfig.root });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save: ${message}`);
    },
  });

  const set = <S extends SiteConfigSection>(
    section: S,
    patch: Partial<SiteConfig[S]>
  ) =>
    setForm(prev => ({
      ...prev,
      [section]: { ...prev[section], ...patch },
    }));

  const navLinks = form.navigation.links ?? [];
  const setNavLinks = (links: SiteNavLink[]) => set("navigation", { links });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-heading font-bold">Site Settings</h1>
          <p className="text-muted-foreground mt-1">
            Changes here apply to the public site for every visitor.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b pb-2">
          {TABS.map(t => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{TABS.find(t => t.key === tab)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tab === "branding" && (
              <>
                <Field label="Site title">
                  <Input
                    value={form.branding.title ?? ""}
                    onChange={e => set("branding", { title: e.target.value })}
                  />
                </Field>
                <Field label="Tagline">
                  <Input
                    value={form.branding.tagline ?? ""}
                    onChange={e => set("branding", { tagline: e.target.value })}
                  />
                </Field>
                <Field label="Logo URL">
                  <Input
                    value={form.branding.logoUrl ?? ""}
                    onChange={e => set("branding", { logoUrl: e.target.value })}
                  />
                </Field>
              </>
            )}

            {tab === "navigation" && (
              <div className="space-y-3">
                {navLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      aria-label={`Link ${i + 1} label`}
                      className="w-40"
                      value={link.label}
                      onChange={e =>
                        setNavLinks(
                          navLinks.map((l, j) =>
                            j === i ? { ...l, label: e.target.value } : l
                          )
                        )
                      }
                    />
                    <Input
                      aria-label={`Link ${i + 1} URL`}
                      value={link.href}
                      onChange={e =>
                        setNavLinks(
                          navLinks.map((l, j) =>
                            j === i ? { ...l, href: e.target.value } : l
                          )
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Move up"
                      disabled={i === 0}
                      onClick={() => {
                        const next = [...navLinks];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        setNavLinks(next);
                      }}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Move down"
                      disabled={i === navLinks.length - 1}
                      onClick={() => {
                        const next = [...navLinks];
                        [next[i + 1], next[i]] = [next[i], next[i + 1]];
                        setNavLinks(next);
                      }}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remove link"
                      onClick={() =>
                        setNavLinks(navLinks.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNavLinks([...navLinks, { label: "", href: "/" }])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add link
                </Button>
              </div>
            )}

            {tab === "hero" && (
              <>
                <Field label="Eyebrow (small caps line above the wordmark)">
                  <Input
                    value={form.hero.eyebrow ?? ""}
                    onChange={e => set("hero", { eyebrow: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Heading (first line)">
                    <Input
                      value={form.hero.heading ?? ""}
                      onChange={e => set("hero", { heading: e.target.value })}
                    />
                  </Field>
                  <Field label="Subheading (italic second line)">
                    <Input
                      value={form.hero.subheading ?? ""}
                      onChange={e => set("hero", { subheading: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Marquee pills (one per line)">
                  <Textarea
                    rows={6}
                    value={(form.hero.pills ?? []).join("\n")}
                    onChange={e =>
                      set("hero", {
                        pills: e.target.value
                          .split("\n")
                          .map(p => p.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
              </>
            )}

            {tab === "social" && (
              <>
                {(
                  [
                    ["tiktok", "TikTok URL"],
                    ["instagram", "Instagram URL"],
                    ["youtube", "YouTube URL"],
                    ["pinterest", "Pinterest URL"],
                    ["email", "Contact email"],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <Input
                      value={form.social[key] ?? ""}
                      onChange={e => set("social", { [key]: e.target.value })}
                    />
                  </Field>
                ))}
              </>
            )}

            {tab === "seo" && (
              <>
                <Field label="Default page title">
                  <Input
                    value={form.seo.defaultTitle ?? ""}
                    onChange={e => set("seo", { defaultTitle: e.target.value })}
                  />
                </Field>
                <Field label="Default description">
                  <Textarea
                    rows={3}
                    value={form.seo.defaultDescription ?? ""}
                    onChange={e =>
                      set("seo", { defaultDescription: e.target.value })
                    }
                  />
                </Field>
                <Field label="Social share image URL (Open Graph)">
                  <Input
                    value={form.seo.ogImageUrl ?? ""}
                    onChange={e => set("seo", { ogImageUrl: e.target.value })}
                  />
                </Field>
                <Field label="Twitter/X handle (e.g. @simplysoph)">
                  <Input
                    value={form.seo.twitterHandle ?? ""}
                    onChange={e => set("seo", { twitterHandle: e.target.value })}
                  />
                </Field>
              </>
            )}

            {tab === "theme" && (
              <>
                <Field label="Default appearance for new visitors">
                  <Select
                    value={form.theme.defaultMode ?? "dark"}
                    onValueChange={value =>
                      set("theme", {
                        defaultMode: value as "light" | "dark" | "system",
                      })
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">Follow device</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Accent color (any CSS color; empty = theme default)">
                  <div className="flex items-center gap-3">
                    <Input
                      className="w-64"
                      placeholder="e.g. #DC2626 or oklch(0.6 0.2 20)"
                      value={form.theme.accentColor ?? ""}
                      onChange={e =>
                        set("theme", { accentColor: e.target.value })
                      }
                    />
                    <span
                      aria-hidden="true"
                      className="h-8 w-8 rounded-md border"
                      style={{
                        background:
                          form.theme.accentColor || "var(--primary)",
                      }}
                    />
                  </div>
                </Field>
                <Field label="Corner radius (CSS length; empty = theme default)">
                  <Input
                    className="w-48"
                    placeholder="e.g. 0.75rem"
                    value={form.theme.radius ?? ""}
                    onChange={e => set("theme", { radius: e.target.value })}
                  />
                </Field>
              </>
            )}

            <div className="pt-2">
              <Button
                onClick={() => saveMutation.mutate(tab)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving…" : `Save ${TABS.find(t => t.key === tab)?.label}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
