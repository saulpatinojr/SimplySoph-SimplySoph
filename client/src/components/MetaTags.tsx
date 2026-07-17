import { Helmet } from "react-helmet";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string | null;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export default function MetaTags({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
}: MetaTagsProps) {
  const { seo, branding } = useSiteConfig();
  const resolvedTitle = title ?? seo.defaultTitle ?? "SimplySoph";
  const resolvedDescription = description ?? seo.defaultDescription ?? "";
  const resolvedImage = image ?? seo.ogImageUrl;
  const siteName = branding.title ?? "SimplySoph";
  const twitterHandle = seo.twitterHandle;

  // Construct full URL if relative
  const fullUrl = url
    ? url.startsWith("http")
      ? url
      : `https://simplysoph.com${url}`
    : undefined;
  const fullImage = resolvedImage
    ? resolvedImage.startsWith("http")
      ? resolvedImage
      : `https://simplysoph.com${resolvedImage}`
    : "https://simplysoph.com/ss-icon-banner.png";

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={fullImage} />
      {fullUrl && <meta property="og:url" content={fullUrl} />}
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={fullImage} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

      {/* Article specific meta tags */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" && section && (
        <meta property="article:section" content={section} />
      )}
      {type === "article" && tags && tags.length > 0 && (
        <meta property="article:tag" content={tags.join(", ")} />
      )}

      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <link rel="canonical" href={fullUrl} />

      {/* Favicon and app icons */}
      <link rel="icon" type="image/png" href="/icons/logo_short.png" />

      {/* Theme color for mobile browsers */}
      <meta name="msapplication-TileColor" content="#DC2626" />
    </Helmet>
  );
}
