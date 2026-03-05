import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Eye, UserPlus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityItem {
  id: string;
  type: 'comment' | 'view' | 'subscriber' | 'article';
  message: string;
  timestamp: string;
  link?: string;
}

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const activities: ActivityItem[] = [];

      // Get recent comments
      const { data: comments } = await supabase
        .from('comments')
        .select('id, content, created_at, article:articles(slug, title)')
        .order('created_at', { ascending: false })
        .limit(3);

      comments?.forEach((comment: any) => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          message: `New comment on "${comment.article?.title || 'an article'}"`,
          timestamp: comment.created_at,
          link: comment.article?.slug ? `/article/${comment.article.slug}` : undefined,
        });
      });

      // Get recent articles
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, slug, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(2);

      articles?.forEach((article) => {
        if (article.published_at) {
          activities.push({
            id: `article-${article.id}`,
            type: 'article',
            message: `"${article.title}" was published`,
            timestamp: article.published_at,
            link: `/article/${article.slug}`,
          });
        }
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activities.slice(0, 5);
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'subscriber':
        return <UserPlus className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="border border-border rounded-lg p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="border border-border rounded-lg p-5">
        <h3 className="font-serif text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">No recent activity yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-serif text-base font-semibold flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Recent Activity
        </h3>
      </div>
      <ul className="divide-y divide-border">
        {activities.map((activity, index) => (
          <li
            key={activity.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {activity.link ? (
              <Link
                to={activity.link}
                className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors group"
              >
                <span className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                  {getIcon(activity.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2 group-hover:text-foreground transition-colors leading-snug">
                    {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 text-muted-foreground">{getIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2 leading-snug">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
