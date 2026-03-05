import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { Article, Category as CategoryType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

export default function Category() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as CategoryType;
    },
    enabled: !!slug,
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', 'category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`*, category:categories(*)`)
        .eq('status', 'published')
        .eq('category_id', category!.id)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Article[];
    },
    enabled: !!category,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <header className="mb-12 pb-8 border-b-4 border-double border-foreground">
          <h1 className="headline-xl mb-2">{category?.name || slug}</h1>
          {category?.description && (
            <p className="text-muted-foreground body-lg">{category.description}</p>
          )}
        </header>

        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : articles?.length === 0 ? (
          <div className="text-center py-24">
            <h2 className="headline-md mb-4">No articles yet</h2>
            <p className="text-muted-foreground">
              Check back soon for articles in this category
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