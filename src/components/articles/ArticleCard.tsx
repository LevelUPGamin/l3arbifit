import { Link } from 'react-router-dom';
import { Article } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  isBookmarked?: boolean;
  onBookmarkChange?: () => void;
}

export function ArticleCard({ 
  article, 
  featured = false,
  isBookmarked = false,
  onBookmarkChange
}: ArticleCardProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [bookmarking, setBookmarking] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
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
      onBookmarkChange?.();
    } catch (error) {
      toast.error('Failed to update bookmark');
    } finally {
      setBookmarking(false);
    }
  };

  const publishedDate = article.published_at 
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : formatDistanceToNow(new Date(article.created_at), { addSuffix: true });

  if (featured) {
    return (
      <article className="article-card-featured group">
        {article.cover_image && (
          <div className="aspect-[16/9] overflow-hidden mb-6">
            <img 
              src={article.cover_image} 
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        
        <div className="flex items-center gap-4 mb-4">
          {article.category && (
            <Link 
              to={`/category/${article.category.slug}`}
              className="tag-pill tag-pill-filled"
            >
              {article.category.name}
            </Link>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {article.reading_time_minutes} min read
          </div>
        </div>

        <Link to={`/article/${article.slug}`}>
          <h2 className="headline-lg mb-4 group-hover:underline decoration-2 underline-offset-4">
            {article.title}
          </h2>
        </Link>

        {article.excerpt && (
          <p className="body-lg text-muted-foreground mb-6">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {article.author?.full_name || 'Anonymous'}
            </span>
            <span className="text-sm text-muted-foreground">{publishedDate}</span>
          </div>
          
          {user && (
            <button
              onClick={handleBookmark}
              disabled={bookmarking}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {bookmarked ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="article-card group">
      {article.cover_image && (
        <div className="aspect-[4/3] overflow-hidden mb-4 -mx-6 -mt-6">
          <img 
            src={article.cover_image} 
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        {article.category && (
          <Link 
            to={`/category/${article.category.slug}`}
            className="tag-pill text-[10px]"
          >
            {article.category.name}
          </Link>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {article.reading_time_minutes} min
        </div>
      </div>

      <Link to={`/article/${article.slug}`}>
        <h3 className="headline-sm mb-2 group-hover:underline decoration-1 underline-offset-2">
          {article.title}
        </h3>
      </Link>

      {article.excerpt && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {article.excerpt}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{publishedDate}</span>
        
        {user && (
          <button
            onClick={handleBookmark}
            disabled={bookmarking}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {bookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </article>
  );
}