import { Helmet } from "react-helmet";

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
  title = "SimplySoph - Premium Fashion Creator Platform",
  description = "Discover the latest fashion trends, styling tips, and exclusive content from SimplySoph. Join our community of fashion enthusiasts and creators.",
  image = "https://simplysoph-66c78.web.app/ss-icon-banner.png",
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
}: MetaTagsProps) {
  const siteName = "SimplySoph";
  const twitterHandle = "@simplysoph"; // Update with actual Twitter handle

  // Construct full URL if relative
  const fullUrl = url
    ? url.startsWith("http")
      ? url
      : `https://simplysoph.com${url}`
    : undefined;
  const fullImage = image
    ? image.startsWith("http")
      ? image
      : `https://simplysoph.com${image}`
    : "https://simplysoph.com/ss-icon-banner.png";

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      {fullUrl && <meta property="og:url" content={fullUrl} />}
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
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
