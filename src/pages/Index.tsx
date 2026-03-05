import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { FeaturedArticles } from '@/components/articles/FeaturedArticles';
import { PopularArticles } from '@/components/articles/PopularArticles';
import { TagCloud } from '@/components/articles/TagCloud';
import { NewsletterForm } from '@/components/newsletter/NewsletterForm';
import { LiveStats } from '@/components/home/LiveStats';
import { RecentActivity } from '@/components/home/RecentActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ARTICLES_PER_PAGE = 9;

export default function Index() {
  const [page, setPage] = useState(1);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', 'published', page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('articles')
        .select(`*, category:categories(*)`, { count: 'exact' })
        .eq('status', 'published')
        .eq('is_featured', false)
        .order('published_at', { ascending: false })
        .range((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE - 1);
      
      if (error) throw error;
      return { articles: data as unknown as Article[], count: count || 0 };
    },
  });

  const totalPages = Math.ceil((articles?.count || 0) / ARTICLES_PER_PAGE);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Live Stats */}
        <LiveStats />
        
        {/* Featured Articles */}
        <FeaturedArticles />

        {isLoading ? (
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64" />)}
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : articles?.articles.length === 0 && page === 1 ? (
          <div className="text-center py-24">
            <h2 className="headline-lg mb-4">Welcome to L3arbiFit</h2>
            <p className="text-muted-foreground body-lg mb-8">
              No articles published yet. Check back soon!
            </p>
            <Link to="/auth" className="btn-editorial">
              Sign In to Get Started
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-4">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="section-header">
                <span className="section-title">Latest Stories</span>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {articles?.articles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Tag Cloud */}
              <TagCloud />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <PopularArticles />
              
              {/* Recent Activity */}
              <RecentActivity />
              
              {/* Newsletter Subscription */}
              <NewsletterForm />
              
              {/* Archive Link */}
              <div className="pt-6 border-t border-border">
                <Link
                  to="/archive"
                  className="text-sm uppercase tracking-widest font-medium hover:underline"
                >
                  View Archive →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
