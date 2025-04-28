import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Twitter, Share2 } from "lucide-react";

export default function TwitterCardPreview() {
  const [url, setUrl] = useState(window.location.origin);
  const [cardData, setCardData] = useState({
    title: "PLAN WISE ESL | Advanced AI-Powered Teaching Platform",
    description: "Create personalized ESL lessons with interactive vocabulary, adaptive pronunciation guidance, and multi-provider AI technology.",
    image: `${window.location.origin}/twitter-card-image.svg`
  });
  
  useEffect(() => {
    document.title = "Twitter Card Preview | PLAN WISE ESL";
    
    // Try to fetch the metadata from meta tags
    const getMetaTags = () => {
      const titleTag = document.querySelector('meta[property="og:title"]') || 
                      document.querySelector('meta[name="twitter:title"]');
      
      const descriptionTag = document.querySelector('meta[property="og:description"]') || 
                            document.querySelector('meta[name="twitter:description"]');
      
      const imageTag = document.querySelector('meta[property="og:image"]') || 
                      document.querySelector('meta[name="twitter:image"]');
      
      if (titleTag) setCardData(prev => ({ ...prev, title: titleTag.getAttribute('content') || prev.title }));
      if (descriptionTag) setCardData(prev => ({ ...prev, description: descriptionTag.getAttribute('content') || prev.description }));
      if (imageTag) setCardData(prev => ({ ...prev, image: imageTag.getAttribute('content') || prev.image }));
    };
    
    getMetaTags();
  }, []);

  const handleGenerateURL = () => {
    const twitterIntentUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Check out this amazing ESL platform!')}`;
    window.open(twitterIntentUrl, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Twitter Card Preview</h1>
      
      <Tabs defaultValue="preview">
        <TabsList className="grid grid-cols-2 w-[400px] mx-auto mb-6">
          <TabsTrigger value="preview">Card Preview</TabsTrigger>
          <TabsTrigger value="validator">Validator Tool</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="space-y-6">
          <Card className="shadow-lg border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
              <CardTitle className="text-xl text-blue-900">Card Preview</CardTitle>
              <CardDescription>
                This is how your Twitter card will appear when shared on Twitter
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="twitter-card-preview border rounded-lg overflow-hidden shadow-md">
                <div className="w-full aspect-[1.91/1] bg-gray-100 overflow-hidden">
                  <img 
                    src={cardData.image} 
                    alt="Twitter Card Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/twitter-card-image.svg';
                    }} 
                  />
                </div>
                <div className="p-4 border-t">
                  <h3 className="font-bold text-lg line-clamp-1">{cardData.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{cardData.description}</p>
                  <div className="flex items-center mt-2 text-gray-500 text-xs">
                    <span>{new URL(window.location.origin).hostname}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-lg">Share on Twitter</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerateURL}
                    className="bg-[#1DA1F2] hover:bg-[#1a94df]"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Share on Twitter
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => copyToClipboard(window.location.origin)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold mb-2">Meta Tag Implementation</h3>
                <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
{`<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@planwiseesl" />
<meta name="twitter:title" content="${cardData.title}" />
<meta name="twitter:description" content="${cardData.description}" />
<meta name="twitter:image" content="${cardData.image}" />

<!-- Open Graph Meta Tags -->
<meta property="og:title" content="${cardData.title}" />
<meta property="og:description" content="${cardData.description}" />
<meta property="og:image" content="${cardData.image}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="validator" className="space-y-6">
          <Card className="shadow-lg border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
              <CardTitle className="text-xl text-blue-900">Twitter Card Validator</CardTitle>
              <CardDescription>
                Use these tools to validate your Twitter card implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url">Website URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      id="url" 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://yourwebsite.com" 
                    />
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`https://cards-dev.twitter.com/validator?url=${encodeURIComponent(url)}`, '_blank')}
                    >
                      Validate
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Opens Twitter's official Card Validator tool
                  </p>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold mb-2">Twitter Card Validation Steps</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Ensure all meta tags are in the <code>&lt;head&gt;</code> section of your HTML</li>
                    <li>The card image must be at least 300x157 pixels (larger recommended)</li>
                    <li>Use absolute URLs for the image (https://...)</li>
                    <li>Twitter will cache your card for up to 7 days</li>
                    <li>For updates, validate the URL in Twitter's Card Validator</li>
                    <li>Test your card by sharing on Twitter to see the live preview</li>
                  </ol>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50 text-sm text-gray-500">
              <div>
                <p>
                  For more information, visit the 
                  <a 
                    href="https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mx-1"
                  >
                    Twitter Card Documentation
                  </a>
                </p>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}