import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Article } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, ArrowLeft, Bookmark, BookmarkCheck, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { PdfExportButton } from '@/components/articles/PdfExportButton';
import { CommentSection } from '@/components/comments/CommentSection';
import { SocialShare } from '@/components/articles/SocialShare';
import { RelatedArticles } from '@/components/articles/RelatedArticles';
import { ReadingProgress } from '@/components/articles/ReadingProgress';
import { ViewCounter } from '@/components/articles/ViewCounter';
import { ArticleReactions } from '@/components/articles/ArticleReactions';
import { TableOfContents } from '@/components/articles/TableOfContents';
import { AuthorCard } from '@/components/articles/AuthorCard';
import { ReadingModeProvider, ReadingModeToggle, FontSizeControls, ReadingModeWrapper } from '@/components/articles/ReadingMode';

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`*, category:categories(*)`)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Article not found');
      return data as unknown as Article;
    },
    enabled: !!slug,
  });

  // Check if bookmarked
  useQuery({
    queryKey: ['bookmark', article?.id, user?.id],
    queryFn: async () => {
      if (!user || !article) return false;
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', article.id)
        .maybeSingle();
      setBookmarked(!!data);
      return !!data;
    },
    enabled: !!user && !!article,
  });

  const handleBookmark = async () => {
    if (!user || !article) {
      toast.error('Please sign in to bookmark articles');
      return;
    }

    setBookmarking(true);
    try {
      if (bookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', article.id);
        setBookmarked(false);
        toast.success('Removed from bookmarks');
      } else {
        await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, article_id: article.id });
        setBookmarked(true);
        toast.success('Added to bookmarks');
      }
    } catch {
      toast.error('Failed to update bookmark');
    } finally {
      setBookmarking(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="headline-lg mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className="btn-editorial">
            Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const publishedDate = article.published_at 
    ? format(new Date(article.published_at), 'MMMM d, yyyy')
    : format(new Date(article.created_at), 'MMMM d, yyyy');

  return (
    <ReadingModeProvider>
      <Layout>
        <ReadingProgress />
        {article.content && <TableOfContents content={article.content} />}
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Back link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 no-print"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </Link>

          {/* Article header */}
          <header className="mb-12">
            {article.category && (
              <Link 
                to={`/category/${article.category.slug}`}
                className="tag-pill tag-pill-filled mb-6 inline-block no-print"
              >
                {article.category.name}
              </Link>
            )}

            <h1 className="headline-xl mb-6 text-balance">{article.title}</h1>

            {article.excerpt && (
              <p className="body-lg text-muted-foreground mb-8">{article.excerpt}</p>
            )}

            {/* Author info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
              <AuthorCard authorId={article.author_id} />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {publishedDate}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {article.reading_time_minutes} min read
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pb-8 border-b border-border">
              <ViewCounter articleId={article.id} viewCount={(article as any).view_count || 0} />
              
              <div className="flex-1" />
              
              {/* Reading controls */}
              <div className="flex items-center gap-2 no-print">
                <FontSizeControls />
                <ReadingModeToggle />
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2 no-print">
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBookmark}
                    disabled={bookmarking}
                  >
                    {bookmarked ? (
                      <BookmarkCheck className="h-4 w-4 mr-2" />
                    ) : (
                      <Bookmark className="h-4 w-4 mr-2" />
                    )}
                    {bookmarked ? 'Saved' : 'Save'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <PdfExportButton article={article} variant="ghost" />
              </div>
            </div>
          </header>

          {/* Cover image */}
          {article.cover_image && (
            <figure className="mb-12">
              <img 
                src={article.cover_image} 
                alt={article.title}
                className="w-full aspect-[16/9] object-cover"
              />
            </figure>
          )}

          {/* Article content with reading mode */}
          <ReadingModeWrapper className="article-content prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
          </ReadingModeWrapper>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border no-print">
              <h3 className="caption mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link 
                    key={tag} 
                    to={`/search?tag=${encodeURIComponent(tag)}`}
                    className="tag-pill"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author bio section */}
          <div className="mt-12 pt-8 border-t-2 border-foreground no-print">
            <h3 className="caption mb-6">Written by</h3>
            <AuthorCard authorId={article.author_id} />
          </div>

          {/* Reactions */}
          <div className="mt-8 pt-8 border-t border-border no-print">
            <ArticleReactions articleId={article.id} />
          </div>

          {/* Social Share */}
          <div className="mt-8 pt-8 border-t border-border no-print">
            <SocialShare 
              title={article.title} 
              url={window.location.href} 
              excerpt={article.excerpt || undefined}
            />
          </div>

          {/* Related Articles */}
          <RelatedArticles 
            currentArticleId={article.id} 
            categoryId={article.category_id}
            tags={article.tags}
          />

          {/* Comments */}
          <CommentSection articleId={article.id} />
        </article>
      </Layout>
    </ReadingModeProvider>
  );
}
