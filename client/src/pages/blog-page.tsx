import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import DOMPurify from 'isomorphic-dompurify';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Lightbulb,
  Globe,
  Users,
  Brain,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";
import type { BlogPost } from "@shared/schema";

// Sanitize HTML content to prevent XSS attacks
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
  });
};

export default function BlogPage() {
  const params = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  // Fetch blog posts from API
  const { data: postsData, isLoading } = useQuery<{ posts: BlogPost[]; total: number }>({
    queryKey: ['/api/blog/posts'],
    queryFn: () => fetch('/api/blog/posts?pageSize=100').then(res => res.json()),
  });

  const blogPosts = postsData?.posts || [];

  // Handle URL-based post selection
  useEffect(() => {
    if (params.id) {
      const postId = parseInt(params.id);
      if (!isNaN(postId)) {
        setSelectedPost(postId);
      }
    }
  }, [params.id]);

  // Function to render content with internal links
  const renderContentWithLinks = (text: string) => {
    // Replace mentions of key terms with internal links
    const linkReplacements = [
      { term: "AI-powered lesson planning", url: "/blog", text: "AI-powered lesson planning" },
      { term: "CEFR levels", url: "/blog", text: "CEFR levels" },
      { term: "ESL teaching", url: "/blog", text: "ESL teaching" },
      { term: "lesson generation", url: "/auth", text: "lesson generation platform" },
      { term: "PlanwiseESL", url: "/", text: "PlanwiseESL" },
      { term: "student engagement", url: "/blog", text: "student engagement strategies" }
    ];

    let processedText = text;
    linkReplacements.forEach(({ term, url, text: linkText }) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (!processedText.includes('<a href') && regex.test(processedText)) {
        processedText = processedText.replace(regex, `<a href="${url}" class="text-blue-600 hover:text-blue-800 underline font-medium">${linkText}</a>`);
      }
    });

    return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from posts
  const categories = ["All", ...Array.from(new Set(blogPosts.map(post => post.category)))];

  const featuredPost = blogPosts.find(post => post.featured);

  if (selectedPost) {
    const post = blogPosts.find(p => p.id === selectedPost);
    if (!post) return <div>Post not found</div>;

    return (
      <div className="min-h-screen bg-gray-50">
        <SEOHead
          title={post.title}
          description={post.excerpt}
          keywords={post.tags ?? undefined}
          canonicalUrl={`https://planwiseesl.com/blog/${post.id}`}
          article={{
            publishedTime: new Date(post.publishDate).toISOString(),
            author: "PlanwiseESL Team",
            section: post.category,
            tags: post.tags ?? []
          }}
        />
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Link href="/">
                <div className="flex items-center space-x-3">
                  <img src="/PlanWise_ESL_logo.png" alt="PlanwiseESL Logo" className="h-20 w-auto" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">PlanwiseESL</h1>
                    <p className="text-sm text-gray-500">AI-Powered ESL Lessons</p>
                  </div>
                </div>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => setSelectedPost(null)}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Blog
              </Button>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Article Header */}
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4">
                {post.category}
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-6 text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime} read</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-8">
                {(post.tags ?? []).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Article Body */}
            <div className="prose prose-lg max-w-none">
              {/* Render HTML content from Tiptap editor - sanitized to prevent XSS */}
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
            </div>

            {/* Call to Action */}
            <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Ready to Stop Drowning in Lesson Prep Like I Was?
              </h3>
              <p className="text-gray-600 mb-4">
                I built PlanwiseESL because I was tired of spending 60+ hours a week on lesson planning. Now I help teachers create professional, engaging lessons in 15 minutes instead of 3 hours. Want to see how?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium">
                    See How It Works - Free Demo + 30-Day Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/blog/14">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    Read My Full Story
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="ESL Teaching Blog - AI Lesson Planning & Teacher Success Stories | PlanwiseESL"
        description="Real ESL teacher stories, AI-powered lesson planning strategies, and proven methods to save 15+ hours weekly. Learn from Dave Jackson's journey from $6/hour to $55/hour teaching."
        keywords={[
          "ESL teacher blog", 
          "AI lesson planning", 
          "ESL teacher burnout solution", 
          "online English teaching", 
          "CEFR lesson plans", 
          "ESL teacher income", 
          "lesson planning software", 
          "English teacher resources",
          "AI for ESL teachers",
          "ESL teaching strategies",
          "teacher productivity tools",
          "lesson planning automation",
          "ESL teacher success stories",
          "teaching English online tips"
        ]}
        canonicalUrl="https://planwiseesl.com/blog"
      />
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <div className="flex items-center space-x-3">
              <img src="/PlanWise_ESL_logo.png" alt="PlanwiseESL Logo" className="h-20 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">PlanwiseESL Blog</h1>
                <p className="text-sm text-gray-500">Expert insights on AI-powered ESL teaching from real teachers</p>
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            ESL Teaching Excellence Through AI Innovation
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Master AI-powered lesson planning, boost student engagement, and transform your ESL teaching practice with evidence-based strategies and cutting-edge tools.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Brain className="h-4 w-4 mr-2" />
              AI-Powered Learning
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Globe className="h-4 w-4 mr-2" />
              CEFR Aligned
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              Evidence-Based
            </Badge>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Article */}
        {featuredPost && selectedCategory === "All" && !searchTerm && (
          <Card className="mb-12 overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Featured Article
                </Badge>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {featuredPost.title}
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{new Date(featuredPost.publishDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{featuredPost.readTime}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedPost(featuredPost.id)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.filter(post => !post.featured || selectedCategory !== "All" || searchTerm).map(post => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{post.readTime}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {(post.tags ?? []).slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">{new Date(post.publishDate).toLocaleDateString()}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedPost(post.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Read More
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="bg-white border-t border-gray-200 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Transform Your ESL Teaching with AI-Powered Lesson Planning
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Join 2,500+ ESL teachers who've cut lesson planning time by 86% using our AI platform. Create CEFR-aligned, culturally-adapted lessons in minutes, not hours. Start your transformation today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium">
                  Watch 4-Minute Lesson Demo (Free Trial)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/blog/14">
                <Button variant="outline" size="lg">
                  Read Dave's Full Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}