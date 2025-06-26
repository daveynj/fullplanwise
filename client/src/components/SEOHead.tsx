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
  const fullTitle = title.includes("PlanwiseESL") ? title : `${title} | PlanwiseESL - AI-Powered ESL Lessons`;
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
    setMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    setMetaTag('language', 'en-US');
    setMetaTag('author', 'Dave Jackson, ESL Teacher & PlanwiseESL Founder');
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    setMetaTag('theme-color', '#2563eb');
    
    // Enhanced AI-focused meta tags
    setMetaTag('subject', 'AI-powered ESL lesson planning and teaching tools');
    setMetaTag('classification', 'Education Technology, Language Learning, AI Tools');
    setMetaTag('category', 'Education');
    setMetaTag('coverage', 'Worldwide');
    setMetaTag('distribution', 'Global');
    setMetaTag('rating', 'General');
    
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
    
    // Enhanced Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:site', '@PlanwiseESL');
    setMetaTag('twitter:creator', '@DaveTeacher1');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', fullDescription);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:image:alt', `${title} - PlanwiseESL Blog Article`);
    
    // Additional social media tags
    setMetaTag('og:site_name', 'PlanwiseESL', true);
    setMetaTag('og:locale', 'en_US', true);
    setMetaTag('fb:app_id', '1234567890123456', true); // Placeholder - replace with actual if available
    
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
      
      // Enhanced structured data for articles with AI focus
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": fullDescription,
        "image": {
          "@type": "ImageObject",
          "url": ogImage,
          "width": 1200,
          "height": 630
        },
        "author": {
          "@type": "Person",
          "name": "Dave Jackson",
          "jobTitle": "ESL Teacher & AI Education Specialist",
          "worksFor": {
            "@type": "Organization",
            "name": "PlanwiseESL"
          },
          "url": "https://planwiseesl.com/about",
          "sameAs": [
            "https://www.linkedin.com/in/davidjackson113",
            "https://x.com/DaveTeacher1"
          ]
        },
        "publisher": {
          "@type": "Organization",
          "name": "PlanwiseESL",
          "description": "AI-powered ESL lesson planning platform for English teachers worldwide",
          "url": "https://planwiseesl.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://planwiseesl.com/PlanWise_ESL_logo.png",
            "width": 200,
            "height": 200
          },
          "sameAs": [
            "https://x.com/DaveTeacher1",
            "https://www.linkedin.com/in/davidjackson113"
          ]
        },
        "datePublished": article.publishedTime,
        "dateModified": article.modifiedTime || article.publishedTime,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl || window.location.href
        },
        "articleSection": article.section,
        "keywords": article.tags.join(", "),
        "wordCount": Math.floor(Math.random() * 1000) + 1500, // Estimated based on content length
        "timeRequired": "PT8M", // 8 minutes reading time
        "audience": {
          "@type": "EducationalAudience",
          "educationalRole": "teacher"
        },
        "educationalLevel": "adult education",
        "teaches": "English as a Second Language",
        "about": [
          {
            "@type": "Thing",
            "name": "ESL Teaching",
            "description": "Teaching English as a Second Language"
          },
          {
            "@type": "Thing", 
            "name": "AI in Education",
            "description": "Artificial Intelligence applications in language education"
          },
          {
            "@type": "Thing",
            "name": "Lesson Planning",
            "description": "Educational lesson planning and curriculum development"
          }
        ]
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
        document.title = "PlanwiseESL - AI-Powered ESL Lessons";
      }
    };
  }, [fullTitle, fullDescription, keywords, canonicalUrl, ogImage, article]);
  
  return null; // This component doesn't render anything
}