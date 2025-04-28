import React from 'react';
import { Helmet } from 'react-helmet';

interface TwitterCardProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  twitterUsername?: string;
}

export default function TwitterCard({
  title = 'PLAN WISE ESL | Advanced AI-Powered Teaching Platform',
  description = 'Personalized language learning with interactive vocabulary, adaptive pronunciation guidance, and multi-provider AI technology.',
  image = '/twitter-card-image.svg',
  url = 'https://planwiseesl.com',
  twitterUsername = 'planwiseesl'
}: TwitterCardProps) {
  // Get the full URL for the image
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;
  
  return (
    <Helmet>
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={`@${twitterUsername}`} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Open Graph Meta Tags (for other platforms) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
}