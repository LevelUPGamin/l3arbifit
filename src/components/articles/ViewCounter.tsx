import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye } from 'lucide-react';

interface ViewCounterProps {
  articleId: string;
  viewCount: number;
}

export function ViewCounter({ articleId, viewCount }: ViewCounterProps) {
  useEffect(() => {
    // Increment view count on mount
    const incrementView = async () => {
      const viewedArticles = JSON.parse(sessionStorage.getItem('viewedArticles') || '[]');
      
      if (!viewedArticles.includes(articleId)) {
        await supabase.rpc('increment_article_view', { article_id: articleId });
        sessionStorage.setItem('viewedArticles', JSON.stringify([...viewedArticles, articleId]));
      }
    };

    incrementView();
  }, [articleId]);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Eye className="h-4 w-4" />
      <span>{viewCount.toLocaleString()} views</span>
    </div>
  );
}
