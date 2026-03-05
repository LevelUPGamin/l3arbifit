import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Eye } from 'lucide-react';

interface PopularArticle {
  id: string;
  title: string;
  slug: string;
  view_count: number | null;
  reading_time_minutes: number | null;
}

export function PopularArticles() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['popular-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, view_count, reading_time_minutes')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as PopularArticle[];
    },
  });

  if (isLoading) {
    return (
      <aside className="border-l-2 border-foreground pl-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-serif text-xl font-bold">Popular</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </aside>
    );
  }

  if (!articles || articles.length === 0) return null;

  return (
    <aside className="border-l-2 border-foreground pl-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5" />
        <h3 className="font-serif text-xl font-bold">Popular</h3>
      </div>
      <ol className="space-y-4">
        {articles.map((article, index) => (
          <li key={article.id} className="group">
            <Link to={`/article/${article.slug}`} className="flex gap-4">
              <span className="font-serif text-3xl font-bold text-muted-foreground/50 group-hover:text-foreground transition-colors">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <h4 className="font-serif font-semibold group-hover:underline underline-offset-4 line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{article.reading_time_minutes || 1} min read</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {(article.view_count || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
