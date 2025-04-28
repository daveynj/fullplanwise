import React from 'react';

interface TwitterCardProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  twitterUsername?: string;
}

export default function TwitterCard({
  title = 'Instant ESL Lessons. Smarter, Faster.',
  description = 'Planwise generates full ESL lessons with AI — in seconds.',
  image = '/twitter-card-final.png',
  url = 'https://planwiseesl.com',
  twitterUsername = 'planwiseesl'
}: TwitterCardProps) {
  // Get the full URL for the image
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;
  
  // Using just inline meta tags to avoid Hook errors from Helmet
  return (
    <div className="twitter-card-meta" aria-hidden="true" style={{ display: 'none' }}>
      {/* Meta tags will be added directly to the HTML head in index.html */}
    </div>
  );
}