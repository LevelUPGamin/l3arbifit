import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { Article } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  const { data: articles, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, tagFilter],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('articles')
        .select(`*, category:categories(*)`)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (debouncedQuery) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${debouncedQuery}%,excerpt.ilike.%${debouncedQuery}%,content.ilike.%${debouncedQuery}%`
        );
      }

      if (tagFilter) {
        queryBuilder = queryBuilder.contains('tags', [tagFilter]);
      }

      const { data, error } = await queryBuilder.limit(20);
      if (error) throw error;
      return data as unknown as Article[];
    },
    enabled: !!(debouncedQuery || tagFilter),
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="headline-lg text-center mb-8">Search Articles</h1>
          
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, content, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>

          {tagFilter && (
            <p className="text-center text-muted-foreground mt-4">
              Showing articles tagged with "{tagFilter}"
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : !debouncedQuery && !tagFilter ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="body-lg">Enter a search term to find articles</p>
          </div>
        ) : articles?.length === 0 ? (
          <div className="text-center py-12">
            <p className="body-lg text-muted-foreground">
              No articles found for "{debouncedQuery || tagFilter}"
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles?.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}