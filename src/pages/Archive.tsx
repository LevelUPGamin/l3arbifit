import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Article } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';

interface MonthGroup {
  month: string;
  year: number;
  articles: Article[];
}

export default function Archive() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['archive-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, published_at, reading_time_minutes')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as Article[];
    },
  });

  // Group articles by month/year
  const groupedArticles: MonthGroup[] = [];
  if (articles) {
    const groups: Record<string, Article[]> = {};
    articles.forEach((article) => {
      if (article.published_at) {
        const date = parseISO(article.published_at);
        const key = format(date, 'MMMM yyyy');
        if (!groups[key]) groups[key] = [];
        groups[key].push(article);
      }
    });
    
    Object.entries(groups).forEach(([monthYear, arts]) => {
      const date = parseISO(arts[0].published_at!);
      groupedArticles.push({
        month: format(date, 'MMMM'),
        year: date.getFullYear(),
        articles: arts,
      });
    });
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="h-8 w-8" />
            <h1 className="headline-xl">Archive</h1>
          </div>
          <p className="text-muted-foreground">
            Browse all articles by date
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {groupedArticles.map((group) => (
              <section key={`${group.month}-${group.year}`}>
                <h2 className="headline-md mb-6 pb-2 border-b-2 border-foreground">
                  {group.month} <span className="text-muted-foreground">{group.year}</span>
                </h2>
                <ul className="space-y-4">
                  {group.articles.map((article) => (
                    <li key={article.id}>
                      <Link
                        to={`/article/${article.slug}`}
                        className="group flex items-baseline gap-4"
                      >
                        <span className="text-sm text-muted-foreground shrink-0">
                          {format(parseISO(article.published_at!), 'dd')}
                        </span>
                        <span className="font-serif text-lg group-hover:underline underline-offset-4">
                          {article.title}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {article.reading_time_minutes} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            
            {groupedArticles.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No articles published yet.
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
