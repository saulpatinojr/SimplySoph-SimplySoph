import type { ContentProduct, ContentRelatedLink } from "@/lib/content";

export interface ContentMetadataValidationResult {
  isValid: boolean;
  totalIssues: number;
  firstIssue: string | null;
  issues: string[];
}

export type SaveIntent = "draft" | "published";

export interface EditorSaveGuardParams {
  intent: SaveIntent;
  featuredProducts?: ContentProduct[];
  relatedLinks?: ContentRelatedLink[];
  canonicalUrl?: string;
  disclosureText?: string;
  coverImage?: string;
  coverImageAlt?: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  photoCaptions?: string[];
}

export interface EditorSaveGuardResult {
  shouldBlockSave: boolean;
  issues: string[];
  firstIssue: string | null;
  totalIssues: number;
}

function isHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isUrlOrPath(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true;
  return isHttpUrl(trimmed);
}

function validateFeaturedProducts(products: ContentProduct[]): string[] {
  const issues: string[] = [];

  products.forEach((product, index) => {
    const item = `Featured product ${index + 1}`;
    if (!product.name?.trim()) {
      issues.push(`${item}: product name is required.`);
    }
    if (!product.productUrl?.trim()) {
      issues.push(`${item}: product URL is required.`);
    } else if (!isHttpUrl(product.productUrl)) {
      issues.push(`${item}: product URL must be a valid http(s) URL.`);
    }
    if (product.imageUrl?.trim() && !isHttpUrl(product.imageUrl)) {
      issues.push(`${item}: image URL must be a valid http(s) URL.`);
    }
  });

  return issues;
}

function validateRelatedLinks(links: ContentRelatedLink[]): string[] {
  const issues: string[] = [];

  links.forEach((link, index) => {
    const item = `Related link ${index + 1}`;
    if (!link.title?.trim()) {
      issues.push(`${item}: title is required.`);
    }

    if (!link.url?.trim()) {
      issues.push(`${item}: URL is required.`);
    } else if (link.type === "external" && !isHttpUrl(link.url)) {
      issues.push(`${item}: external URLs must be valid http(s) URLs.`);
    } else if (link.type !== "external" && !isUrlOrPath(link.url)) {
      issues.push(`${item}: URL must be a route path or valid http(s) URL.`);
    }

    if (link.imageUrl?.trim() && !isUrlOrPath(link.imageUrl)) {
      issues.push(`${item}: image URL must be a route path or valid http(s) URL.`);
    }
  });

  return issues;
}

export function validateContentMetadata(params: {
  featuredProducts?: ContentProduct[];
  relatedLinks?: ContentRelatedLink[];
}): ContentMetadataValidationResult {
  const productIssues = validateFeaturedProducts(params.featuredProducts || []);
  const relatedLinkIssues = validateRelatedLinks(params.relatedLinks || []);
  const issues = [...productIssues, ...relatedLinkIssues];

  return {
    isValid: issues.length === 0,
    totalIssues: issues.length,
    firstIssue: issues[0] ?? null,
    issues,
  };
}

function validatePublishReadiness(params: EditorSaveGuardParams): string[] {
  const issues: string[] = [];

  if (!params.canonicalUrl?.trim()) {
    issues.push("Canonical URL is required before publishing.");
  } else if (!isHttpUrl(params.canonicalUrl)) {
    issues.push("Canonical URL must be a valid http(s) URL.");
  }

  if (!params.disclosureText?.trim()) {
    issues.push("Disclosure text is required before publishing.");
  }

  if (params.coverImage?.trim() && !params.coverImageAlt?.trim()) {
    issues.push("Cover image alt text is required when a cover image is set.");
  }

  if (params.thumbnailUrl?.trim() && !params.thumbnailAlt?.trim()) {
    issues.push("Thumbnail alt text is required when a thumbnail is set.");
  }

  const photoCaptionIssues = (params.photoCaptions || [])
    .map((caption, index) => ({ caption, index }))
    .filter(photo => !photo.caption.trim())
    .map(photo => `Photo ${photo.index + 1}: caption/alt text is required before publishing.`);

  issues.push(...photoCaptionIssues);

  return issues;
}

export function getEditorSaveGuard(
  params: EditorSaveGuardParams
): EditorSaveGuardResult {
  const metadataValidation = validateContentMetadata({
    featuredProducts: params.featuredProducts,
    relatedLinks: params.relatedLinks,
  });

  const publishIssues =
    params.intent === "published" ? validatePublishReadiness(params) : [];
  const issues = [...metadataValidation.issues, ...publishIssues];

  return {
    shouldBlockSave: issues.length > 0,
    issues,
    firstIssue: issues[0] ?? null,
    totalIssues: issues.length,
  };
}
