import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

export function FeaturedArticles() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, category:categories(*)')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data as unknown as Article[];
    },
  });

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-8">
          <Star className="h-5 w-5" />
          <h2 className="headline-md">Featured</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[4/3]" />
          ))}
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center gap-2 mb-8">
        <Star className="h-5 w-5 fill-foreground" />
        <h2 className="headline-md">Featured</h2>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            to={`/article/${article.slug}`}
            className={`group relative block overflow-hidden border-2 border-foreground ${
              index === 0 ? 'md:col-span-2 md:row-span-2' : ''
            }`}
          >
            {article.cover_image && (
              <img
                src={article.cover_image}
                alt={article.title}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  index === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'
                }`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {article.category && (
                <Badge variant="secondary" className="mb-3">
                  {article.category.name}
                </Badge>
              )}
              <h3 className={`font-serif font-bold text-foreground ${
                index === 0 ? 'text-2xl md:text-3xl' : 'text-lg'
              }`}>
                {article.title}
              </h3>
              {article.excerpt && index === 0 && (
                <p className="mt-2 text-muted-foreground line-clamp-2">{article.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
