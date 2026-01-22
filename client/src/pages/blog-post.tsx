import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SEOHead } from "@/components/SEOHead";
import { BlogHeader } from "@/components/layout/blog-header";
import DOMPurify from 'isomorphic-dompurify';
import {
  Calendar,
  User,
  Clock,
  Home,
  ChevronRight,
  Search,
  ArrowRight,
  BookOpen
} from "lucide-react";
import type { BlogPost } from "@shared/schema";

// Sanitize HTML content to prevent XSS attacks
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'iframe', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });
};

// Extract headings from HTML content and add IDs for Table of Contents
const extractHeadingsAndAddIds = (html: string): { 
  content: string; 
  headings: { id: string; text: string; level: number }[] 
} => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const headings: { id: string; text: string; level: number }[] = [];
  
  const headingElements = tempDiv.querySelectorAll('h1, h2, h3');
  headingElements.forEach((heading, index) => {
    const text = heading.textContent || '';
    const id = `heading-${index}`;
    heading.id = id;
    headings.push({
      id,
      text,
      level: parseInt(heading.tagName[1])
    });
  });
  
  return {
    content: tempDiv.innerHTML,
    headings
  };
};

export default function BlogPost() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [tocHeadings, setTocHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  // Fetch current post
  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ['/api/blog/posts', slug],
    queryFn: () => fetch(`/api/blog/posts/slug/${slug}`).then(res => {
      if (!res.ok) throw new Error('Post not found');
      return res.json();
    }),
    enabled: !!slug,
  });

  // Fetch all posts for related posts and popular posts
  const { data: postsData } = useQuery<{ posts: BlogPost[]; total: number }>({
    queryKey: ['/api/blog/posts', { pageSize: 100 }],
  });

  // Extract headings and prepare content with IDs when post loads
  const contentWithIds = post?.content ? extractHeadingsAndAddIds(sanitizeHtml(post.content)) : null;
  
  useEffect(() => {
    if (contentWithIds) {
      setTocHeadings(contentWithIds.headings);
    }
  }, [post?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <BlogHeader />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <BlogHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <Link href="/blog">
              <Button>Back to Blog</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get related posts (same category, excluding current post)
  const relatedPosts = postsData?.posts
    .filter(p => p.id !== post.id && p.category === post.category)
    .slice(0, 3) || [];

  // Get popular posts (featured posts, excluding current)
  const popularPosts = postsData?.posts
    .filter(p => p.id !== post.id && p.featured)
    .slice(0, 5) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <SEOHead
        title={post.metaTitle || `${post.title} | Plan Wise ESL Blog`}
        description={post.metaDescription || post.excerpt}
        canonicalUrl={`/blog/${post.slug}`}
      />

      <BlogHeader />
      <main className="min-h-screen bg-background">
        {/* Breadcrumbs at the very top */}
        <nav
          className="bg-muted/30 py-3 px-4"
          aria-label="Breadcrumb"
          data-testid="nav-breadcrumb"
        >
          <div className="max-w-7xl mx-auto">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li className="flex items-center">
                <Link href="/" className="hover:text-foreground flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" />
              <li className="flex items-center">
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              {post.category && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <li className="flex items-center">
                    <span className="hover:text-foreground">{post.category}</span>
                  </li>
                </>
              )}
              <ChevronRight className="h-4 w-4" />
              <li className="text-foreground font-medium truncate max-w-xs">
                {post.title}
              </li>
            </ol>
          </div>
        </nav>

        {/* Main Content Area - 70% left / 30% right sidebar */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content - 70% on desktop */}
            <article className="flex-1 lg:w-[70%]">
              {/* Main Title - h1 tag for SEO */}
              <header className="mb-8">
                <h1
                  className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
                  data-testid="text-post-title"
                >
                  {post.title}
                </h1>

                {/* Meta info line: Author Name + Date Published */}
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span data-testid="text-post-author">{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.publishDate} data-testid="text-post-date">
                      {new Date(post.publishDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  {post.readTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  )}
                  {post.category && (
                    <Badge variant="secondary">{post.category}</Badge>
                  )}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </header>


              {/* Table of Contents box - sticky if possible */}
              {tocHeadings.length > 0 && (
                <aside className="mb-8 p-6 border rounded-lg bg-muted/30">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Table of Contents
                  </h2>
                  <nav>
                    <ul className="space-y-2">
                      {tocHeadings.map((heading) => (
                        <li
                          key={heading.id}
                          className={heading.level === 2 ? "ml-0" : "ml-4"}
                        >
                          <a
                            href={`#${heading.id}`}
                            className="text-sm hover:text-primary transition-colors hover:underline"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </aside>
              )}

              {/* Main Article Content */}
              <div
                className="prose prose-lg max-w-none dark:prose-invert
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-4xl prose-h1:mb-4
                  prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-lg prose-img:shadow-md
                  prose-ul:my-4 prose-ol:my-4
                  prose-li:text-muted-foreground
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic"
                dangerouslySetInnerHTML={{ __html: contentWithIds?.content || '' }}
                data-testid="content-post-body"
              />

              {/* Related Posts Section - 3 cards at the bottom */}
              {relatedPosts.length > 0 && (
                <section className="mt-16 pt-8 border-t" data-testid="section-related-posts">
                  <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedPosts.map((relatedPost) => (
                      <article
                        key={relatedPost.id}
                        className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="relative aspect-video bg-muted">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <span className="text-2xl">📚</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            <Link href={`/blog/${relatedPost.slug}`}>
                              {relatedPost.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {relatedPost.excerpt}
                          </p>
                          <Link href={`/blog/${relatedPost.slug}`}>
                            <Button variant="ghost" size="sm" className="w-full justify-between">
                              <span>Read More</span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* Sidebar - 30% on desktop, moves to bottom on mobile */}
            <aside className="lg:w-[30%] space-y-6">
              {/* Search Bar in Sidebar */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search Articles
                  </h3>
                  <form onSubmit={handleSearch}>
                    <div className="flex gap-2">
                      <Input
                        type="search"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-sidebar-search"
                      />
                      <Button type="submit" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Popular Posts in Sidebar */}
              {popularPosts.length > 0 && (
                <Card data-testid="card-popular-posts">
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4">Popular Posts</h3>
                    <div className="space-y-4">
                      {popularPosts.map((popularPost) => (
                        <Link
                          key={popularPost.id}
                          href={`/blog/${popularPost.slug}`}
                          className="group block"
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded bg-muted flex-shrink-0 overflow-hidden">
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <span className="text-sm">📚</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                                {popularPost.title}
                              </h4>
                              {popularPost.publishDate && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(popularPost.publishDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <Separator className="mt-4" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Categories */}
              {post.category && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4">Category</h3>
                    <Badge variant="secondary" className="text-sm">
                      {post.category}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
