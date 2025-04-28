import { Card, CardContent } from "@/components/ui/card";

export default function TwitterCardPreview() {
  const title = "Instant ESL Lessons. Smarter, Faster.";
  const description = "Planwise generates full ESL lessons with AI — in seconds.";
  const imageUrl = "/twitter-card-perfect.png";
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Twitter Card Preview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Card Preview</h2>
          <Card className="overflow-hidden">
            <div className="aspect-[1200/628] relative">
              <img 
                src={imageUrl} 
                alt="Twitter Card Preview" 
                className="w-full h-full object-cover border-b"
              />
            </div>
            <CardContent className="p-4 bg-gray-50">
              <h3 className="font-bold text-xl">{title}</h3>
              <p className="text-gray-600 mt-1">{description}</p>
              <p className="text-gray-400 mt-2 text-sm">planwiseesl.com</p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Meta Tag Information</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-xs overflow-x-auto">
{`<!-- Twitter Card Meta Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@planwiseesl" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="https://planwiseesl.com${imageUrl}" />

<!-- Open Graph Meta Tags -->
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="https://planwiseesl.com${imageUrl}" />
<meta property="og:url" content="https://planwiseesl.com" />
<meta property="og:type" content="website" />`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}