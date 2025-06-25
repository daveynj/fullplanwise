import { Helmet } from "react-helmet";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    author: string;
    section: string;
    tags: string[];
  };
}

export function SEOHead({ 
  title, 
  description, 
  keywords = [], 
  canonicalUrl,
  ogImage = "/twitter-card-new.png",
  article 
}: SEOHeadProps) {
  const fullTitle = title.includes("LinguaBoost") ? title : `${title} | LinguaBoost - AI-Powered ESL Lessons`;
  const fullDescription = description.length > 160 ? description.substring(0, 157) + "..." : description;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={article ? "article" : "website"} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      
      {/* Article-specific Open Graph */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          <meta property="article:author" content={article.author} />
          <meta property="article:section" content={article.section} />
          {article.tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="en-US" />
      <meta name="author" content="LinguaBoost Team" />
      
      {/* Schema.org Structured Data */}
      {article && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": fullDescription,
            "image": ogImage,
            "author": {
              "@type": "Organization",
              "name": "LinguaBoost"
            },
            "publisher": {
              "@type": "Organization",
              "name": "LinguaBoost",
              "logo": {
                "@type": "ImageObject",
                "url": "/PlanWise_ESL_logo.png"
              }
            },
            "datePublished": article.publishedTime,
            "dateModified": article.modifiedTime || article.publishedTime,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonicalUrl
            }
          })}
        </script>
      )}
    </Helmet>
  );
}