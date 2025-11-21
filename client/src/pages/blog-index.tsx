import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogPost } from "@shared/schema";

const POSTS_PER_PAGE = 9;

export default function BlogIndex() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch posts with proper pagination from backend using default fetcher
  const { data: postsData, isLoading } = useQuery<{ posts: BlogPost[]; total: number }>({
    queryKey: [
      '/api/blog/posts',
      {
        page: currentPage,
        pageSize: POSTS_PER_PAGE,
        ...(searchQuery && { search: searchQuery }),
      },
    ],
  });

  const filteredPosts = postsData?.posts || [];
  const totalPages = Math.ceil((postsData?.total || 0) / POSTS_PER_PAGE);

  const truncateExcerpt = (text: string, maxLines: number = 3) => {
    const words = text.split(' ');
    const maxWords = maxLines * 15;
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...';
    }
    return text;
  };

  return (
    <>
      <SEOHead
        title="Blog - ESL Teaching Tips & Resources | Plan Wise ESL"
        description="Discover expert ESL teaching strategies, lesson planning tips, and professional development resources for English language educators."
        canonicalUrl="/blog"
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <header className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-blog-title">
              ESL Teaching Blog
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Expert tips, strategies, and insights for English language educators
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-10 pr-4 py-6 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-blog"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted h-48 rounded-t-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg" data-testid="text-no-posts">
                {searchQuery ? 'No articles found matching your search.' : 'No articles found.'}
              </p>
            </div>
          ) : (
            <>
              {/* Blog Grid - 3 columns on desktop, 1 on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {filteredPosts.map((post) => (
                  /* Blog Card Component using semantic HTML5 <article> tag */
                  <article
                    key={post.id}
                    className="group flex flex-col h-full bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
                    data-testid={`article-post-${post.id}`}
                  >
                    {/* Thumbnail Image - 16:9 aspect ratio */}
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {post.featuredImageUrl ? (
                        <img
                          src={post.featuredImageUrl}
                          alt={post.featuredImageAlt || post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <span className="text-4xl">📚</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-grow p-6">
                      {/* Category Label - small tag above title */}
                      {post.category && (
                        <Badge
                          variant="secondary"
                          className="w-fit mb-3"
                          data-testid={`badge-category-${post.id}`}
                        >
                          {post.category}
                        </Badge>
                      )}

                      {/* Title - using h3 tag for SEO hierarchy */}
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`} data-testid={`link-post-${post.id}`}>
                          {post.title}
                        </Link>
                      </h3>

                      {/* Excerpt - limited to 3 lines */}
                      <p className="text-muted-foreground mb-4 flex-grow line-clamp-3">
                        {truncateExcerpt(post.excerpt)}
                      </p>

                      {/* Call to Action - "Read Article" link */}
                      <Link href={`/blog/${post.slug}`}>
                        <Button
                          variant="ghost"
                          className="w-full justify-between group-hover:bg-primary/10"
                          data-testid={`button-read-${post.id}`}
                        >
                          <span>Read Article</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* Standard Pagination - NOT infinite scroll */}
              {totalPages > 1 && !searchQuery && (
                <nav
                  className="flex items-center justify-center gap-2"
                  aria-label="Blog pagination"
                  data-testid="nav-pagination"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            data-testid={`button-page-${page}`}
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 flex items-center">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
