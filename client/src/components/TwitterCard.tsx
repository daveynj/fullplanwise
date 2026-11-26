import React from 'react';
import { homepageMeta } from '@shared/homepage-content';
import { siteFacts } from '@shared/site-facts';

interface TwitterCardProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  twitterUsername?: string;
}

export default function TwitterCard({
  title = homepageMeta.title,
  description = homepageMeta.description,
  image = homepageMeta.imagePath,
  url = siteFacts.url,
  twitterUsername = 'PlanwiseESL',
}: TwitterCardProps) {
  // Get the full URL for the image
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;
  void title;
  void description;
  void fullImageUrl;
  void twitterUsername;

  // Using just inline meta tags to avoid Hook errors from Helmet
  return (
    <div className="twitter-card-meta" aria-hidden="true" style={{ display: 'none' }}>
      {/* Meta tags are managed in client/index.html, server prerenders, and SEOHead */}
    </div>
  );
}