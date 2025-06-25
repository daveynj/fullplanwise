import { useEffect } from "react";

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
  
  useEffect(() => {
    // Set document title
    document.title = fullTitle;
    
    // Function to set or update meta tag
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Set or update link tag
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };
    
    // Set basic meta tags
    setMetaTag('description', fullDescription);
    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }
    setMetaTag('robots', 'index, follow');
    setMetaTag('language', 'en-US');
    setMetaTag('author', 'LinguaBoost Team');
    
    // Set canonical URL
    if (canonicalUrl) {
      setLinkTag('canonical', canonicalUrl);
    }
    
    // Set Open Graph tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', fullDescription, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', article ? 'article' : 'website', true);
    if (canonicalUrl) {
      setMetaTag('og:url', canonicalUrl, true);
    }
    
    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', fullDescription);
    setMetaTag('twitter:image', ogImage);
    
    // Set article-specific Open Graph tags
    if (article) {
      setMetaTag('article:published_time', article.publishedTime, true);
      if (article.modifiedTime) {
        setMetaTag('article:modified_time', article.modifiedTime, true);
      }
      setMetaTag('article:author', article.author, true);
      setMetaTag('article:section', article.section, true);
      
      // Add article tags
      article.tags.forEach((tag, index) => {
        setMetaTag(`article:tag`, tag, true);
      });
      
      // Add structured data for articles
      const structuredData = {
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
          "@id": canonicalUrl || window.location.href
        }
      };
      
      // Remove existing structured data script
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Add new structured data script
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
    
    // Cleanup function
    return () => {
      // Reset title to default if needed
      if (document.title === fullTitle) {
        document.title = "LinguaBoost - AI-Powered ESL Lessons";
      }
    };
  }, [fullTitle, fullDescription, keywords, canonicalUrl, ogImage, article]);
  
  return null; // This component doesn't render anything
}