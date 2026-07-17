import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSiteConfig, type SiteConfig } from "@/lib/content";
import { queryKeys } from "@/lib/queryKeys";
import { APP_TITLE, APP_LOGO, TIKTOK_PROFILE_URL } from "@/const";

/**
 * Baseline config mirroring what was hardcoded before the siteConfig
 * collection existed. The provider deep-merges Firestore data over these,
 * so with no siteConfig docs (or while the fetch is in flight) the site
 * renders exactly as it always has — it can never blank or flash empty.
 */
export const SITE_CONFIG_DEFAULTS: SiteConfig = {
  branding: {
    title: APP_TITLE,
    tagline: "bold stories. vivid style. everyday magic.",
    logoUrl: APP_LOGO,
    faviconUrl: "/icons/logo_short.png",
  },
  navigation: {
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Videos", href: "/videos" },
      { label: "Photos", href: "/photos" },
      { label: "Passport", href: "/passport" },
      { label: "Menagerie", href: "/menagerie" },
      { label: "Looks", href: "/looks" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  hero: {
    eyebrow: "Fashion & Style Creator",
    heading: "Simply",
    subheading: "Soph",
    pills: [
      "Style Diaries", "Outfit Inspo", "Beauty Finds", "Travel Logs",
      "Fashion Week", "Get Ready With Me", "Trend Reports", "Creative Direction",
    ],
  },
  social: {
    tiktok: TIKTOK_PROFILE_URL,
    instagram: "https://www.instagram.com/simplysoph",
    youtube: "https://www.youtube.com/@simplysoph",
    pinterest: "https://www.pinterest.com/simplysoph",
    email: "hello@simplysoph.com",
  },
  seo: {
    defaultTitle: "SimplySoph - Premium Fashion Creator Platform",
    defaultDescription:
      "Discover the latest fashion trends, styling tips, and exclusive content from SimplySoph. Join our community of fashion enthusiasts and creators.",
    ogImageUrl: "https://simplysoph-66c78.web.app/ss-icon-banner.png",
    twitterHandle: "@simplysoph",
  },
  theme: {
    defaultMode: "dark",
  },
};

/**
 * Merge partial Firestore config over the defaults, one section at a time.
 * Only defined values override — an admin clearing a field falls back to
 * the default rather than rendering an empty string.
 */
export function resolveSiteConfig(remote: Partial<SiteConfig>): SiteConfig {
  const sections = Object.keys(SITE_CONFIG_DEFAULTS) as (keyof SiteConfig)[];
  const resolved = {} as SiteConfig;
  for (const section of sections) {
    const base = SITE_CONFIG_DEFAULTS[section] as Record<string, unknown>;
    const over = (remote[section] ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(over)) {
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0);
      if (!isEmpty) merged[key] = value;
    }
    resolved[section] = merged as never;
  }
  return resolved;
}

const SiteConfigContext = createContext<SiteConfig>(SITE_CONFIG_DEFAULTS);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: queryKeys.siteConfig.root,
    queryFn: getSiteConfig,
    staleTime: 5 * 60 * 1000,
  });

  const config = data ? resolveSiteConfig(data) : SITE_CONFIG_DEFAULTS;

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
