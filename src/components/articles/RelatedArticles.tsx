import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface RelatedArticlesProps {
  currentArticleId: string;
  categoryId?: string | null;
  tags?: string[] | null;
}

export function RelatedArticles({ currentArticleId, categoryId, tags }: RelatedArticlesProps) {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['related-articles', currentArticleId, categoryId, tags],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('id, title, slug, excerpt, cover_image, published_at, reading_time_minutes')
        .eq('status', 'published')
        .neq('id', currentArticleId)
        .order('published_at', { ascending: false })
        .limit(3);

      // Prioritize same category
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // If we don't have enough articles from the same category, fetch more
      if (data && data.length < 3) {
        const { data: moreData } = await supabase
          .from('articles')
          .select('id, title, slug, excerpt, cover_image, published_at, reading_time_minutes')
          .eq('status', 'published')
          .neq('id', currentArticleId)
          .not('id', 'in', `(${data.map(a => a.id).join(',')})`)
          .order('published_at', { ascending: false })
          .limit(3 - data.length);
        
        if (moreData) {
          return [...data, ...moreData] as Article[];
        }
      }
      
      return data as Article[];
    },
    enabled: !!currentArticleId,
  });

  if (isLoading) {
    return (
      <section className="mt-16 pt-12 border-t-2 border-foreground no-print">
        <h2 className="headline-md mb-8">Related Articles</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[16/10] w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t-2 border-foreground no-print">
      <h2 className="headline-md mb-8">Related Articles</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {articles.map((article) => (
          <Link 
            key={article.id} 
            to={`/article/${article.slug}`}
            className="group block"
          >
            {article.cover_image && (
              <div className="aspect-[16/10] overflow-hidden mb-4 border border-border">
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            <h3 className="font-serif text-lg font-semibold mb-2 group-hover:underline underline-offset-4">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.excerpt}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {article.reading_time_minutes} min read
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
