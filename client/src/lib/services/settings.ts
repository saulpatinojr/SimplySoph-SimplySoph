import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./common";

/**
 * Runtime site configuration, stored as one Firestore doc per section in the
 * `siteConfig` collection (world-readable, admin-writable — see
 * firestore.rules). Every field is optional: consumers resolve values through
 * the SiteConfigProvider, which deep-merges these docs over hardcoded
 * defaults, so a missing doc or field can never blank the public site.
 */
export type SiteBranding = {
  title?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
};

export type SiteNavLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type SiteNavigation = {
  links?: SiteNavLink[];
};

export type SiteHero = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  pills?: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export type SiteSocial = {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  pinterest?: string;
  email?: string;
};

export type SiteSeo = {
  defaultTitle?: string;
  titleTemplate?: string;
  defaultDescription?: string;
  ogImageUrl?: string;
  twitterHandle?: string;
};

export type SiteTheme = {
  defaultMode?: "light" | "dark" | "system";
  accentColor?: string;
  radius?: string;
};

export type SiteConfig = {
  branding: SiteBranding;
  navigation: SiteNavigation;
  hero: SiteHero;
  social: SiteSocial;
  seo: SiteSeo;
  theme: SiteTheme;
};

export type SiteConfigSection = keyof SiteConfig;

const SITE_CONFIG_COLLECTION = "siteConfig";

const SECTIONS: SiteConfigSection[] = [
  "branding",
  "navigation",
  "hero",
  "social",
  "seo",
  "theme",
];

/** Fetch every siteConfig section in a single collection read. */
export async function getSiteConfig(): Promise<Partial<SiteConfig>> {
  const snapshot = await getDocs(collection(db(), SITE_CONFIG_COLLECTION));
  const config: Partial<SiteConfig> = {};
  for (const docSnap of snapshot.docs) {
    const section = docSnap.id as SiteConfigSection;
    if (SECTIONS.includes(section)) {
      // updatedAt/updatedBy are audit metadata, not config values.
      const { updatedAt: _at, updatedBy: _by, ...data } = docSnap.data();
      config[section] = data as never;
    }
  }
  return config;
}

/** Merge-write one section; existing fields not present in `data` survive. */
export async function updateSiteConfigSection<S extends SiteConfigSection>(
  section: S,
  data: SiteConfig[S],
  updatedBy?: string
): Promise<void> {
  await setDoc(
    doc(db(), SITE_CONFIG_COLLECTION, section),
    { ...data, updatedAt: serverTimestamp(), updatedBy: updatedBy ?? null },
    { merge: true }
  );
}
