import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Article } from '@/lib/types';
import { User, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Author() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['author-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['author-articles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, category:categories(*)')
        .eq('author_id', id)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Article[];
    },
    enabled: !!id,
  });

  if (profileLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="flex items-center gap-6 mb-12">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="headline-lg mb-4">Author Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This author profile doesn't exist.
          </p>
          <Link to="/" className="btn-editorial">Back to Home</Link>
        </div>
      </Layout>
    );
  }

  const initials = profile.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Author Header */}
        <header className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12 pb-12 border-b-2 border-foreground">
          <Avatar className="h-24 w-24 border-2 border-foreground">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'Author'} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="headline-lg mb-2">{profile.full_name || 'Anonymous'}</h1>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {articles?.length || 0} articles
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
              </span>
            </div>
            
            {profile.bio && (
              <p className="text-muted-foreground max-w-xl">{profile.bio}</p>
            )}
          </div>
        </header>

        {/* Author's Articles */}
        <section>
          <h2 className="headline-md mb-8">Articles by {profile.full_name?.split(' ')[0] || 'this author'}</h2>
          
          {articlesLoading ? (
            <div className="grid gap-8 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No published articles yet.
            </p>
          )}
        </section>
      </div>
    </Layout>
  );
}
