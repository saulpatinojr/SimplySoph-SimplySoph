import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
  getFirebaseStorage: () => ({}),
  microsoftProvider: {},
}));

import {
  resolveSiteConfig,
  SITE_CONFIG_DEFAULTS,
} from "./SiteConfigContext";

describe("resolveSiteConfig", () => {
  it("returns full defaults when Firestore has no siteConfig docs", () => {
    expect(resolveSiteConfig({})).toEqual(SITE_CONFIG_DEFAULTS);
  });

  it("overrides only the fields present in remote data", () => {
    const resolved = resolveSiteConfig({
      branding: { title: "New Title" },
      social: { instagram: "https://instagram.com/other" },
    });
    expect(resolved.branding.title).toBe("New Title");
    expect(resolved.branding.logoUrl).toBe(SITE_CONFIG_DEFAULTS.branding.logoUrl);
    expect(resolved.social.instagram).toBe("https://instagram.com/other");
    expect(resolved.social.tiktok).toBe(SITE_CONFIG_DEFAULTS.social.tiktok);
    expect(resolved.navigation).toEqual(SITE_CONFIG_DEFAULTS.navigation);
  });

  it("falls back to defaults for empty strings, nulls, and empty arrays", () => {
    const resolved = resolveSiteConfig({
      branding: { title: "   ", logoUrl: undefined },
      navigation: { links: [] },
      hero: { heading: null as unknown as string },
    });
    expect(resolved.branding.title).toBe(SITE_CONFIG_DEFAULTS.branding.title);
    expect(resolved.navigation.links).toEqual(
      SITE_CONFIG_DEFAULTS.navigation.links
    );
    expect(resolved.hero.heading).toBe(SITE_CONFIG_DEFAULTS.hero.heading);
  });

  it("accepts replacement nav links", () => {
    const links = [{ label: "Shop", href: "/shop" }];
    expect(resolveSiteConfig({ navigation: { links } }).navigation.links).toEqual(
      links
    );
  });
});
