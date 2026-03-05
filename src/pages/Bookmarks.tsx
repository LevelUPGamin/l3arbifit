import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { Article, Bookmark } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, Navigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Bookmarks() {
  const { user, loading: authLoading } = useAuth();

  const { data: bookmarks, isLoading, refetch } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`*, article:articles(*, category:categories(*))`)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as (Bookmark & { article: Article })[];
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="headline-lg mb-2">My Bookmarks</h1>
          <p className="text-muted-foreground">
            Articles you've saved to read later
          </p>
        </header>

        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : bookmarks?.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h2 className="headline-md mb-4">No bookmarks yet</h2>
            <p className="text-muted-foreground mb-8">
              Save articles to read later by clicking the bookmark icon
            </p>
            <Link to="/" className="btn-editorial">
              Browse Articles
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks?.map((bookmark) => (
              <ArticleCard 
                key={bookmark.id} 
                article={bookmark.article} 
                isBookmarked={true}
                onBookmarkChange={refetch}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}