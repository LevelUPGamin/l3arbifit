import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from 'lucide-react';

export function TagCloud() {
  const { data: tags, isLoading } = useQuery({
    queryKey: ['all-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('tags')
        .eq('status', 'published');
      
      if (error) throw error;
      
      // Count tag occurrences
      const tagCounts: Record<string, number> = {};
      data.forEach((article) => {
        article.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      // Sort by count and return top 20
      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }));
    },
  });

  if (isLoading || !tags || tags.length === 0) return null;

  const maxCount = Math.max(...tags.map(t => t.count));
  const minCount = Math.min(...tags.map(t => t.count));

  const getSize = (count: number) => {
    if (maxCount === minCount) return 'text-sm';
    const ratio = (count - minCount) / (maxCount - minCount);
    if (ratio > 0.7) return 'text-lg font-semibold';
    if (ratio > 0.4) return 'text-base';
    return 'text-sm';
  };

  return (
    <aside className="border-t-2 border-foreground pt-6 mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Tag className="h-5 w-5" />
        <h3 className="font-serif text-xl font-bold">Topics</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {tags.map(({ tag, count }) => (
          <Link
            key={tag}
            to={`/search?tag=${encodeURIComponent(tag)}`}
            className={`tag-pill hover:bg-foreground hover:text-background transition-colors ${getSize(count)}`}
          >
            {tag}
            <span className="ml-1 text-muted-foreground text-xs">({count})</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
