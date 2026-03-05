import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Users, MessageSquare, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

interface Stats {
  totalViews: number;
  totalSubscribers: number;
  totalComments: number;
  totalArticles: number;
}

export function LiveStats() {
  const [animatedStats, setAnimatedStats] = useState<Stats>({
    totalViews: 0,
    totalSubscribers: 0,
    totalComments: 0,
    totalArticles: 0,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['live-stats'],
    queryFn: async () => {
      const [viewsResult, subscribersResult, commentsResult, articlesResult] = await Promise.all([
        supabase.from('articles').select('view_count'),
        supabase.from('newsletter_subscriptions').select('id').eq('is_active', true),
        supabase.from('comments').select('id'),
        supabase.from('articles').select('id').eq('status', 'published'),
      ]);

      const totalViews = viewsResult.data?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;
      const totalSubscribers = subscribersResult.data?.length || 0;
      const totalComments = commentsResult.data?.length || 0;
      const totalArticles = articlesResult.data?.length || 0;

      return { totalViews, totalSubscribers, totalComments, totalArticles };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Animate counter on load
  useEffect(() => {
    if (!stats) return;

    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        totalViews: Math.round(stats.totalViews * easeOut),
        totalSubscribers: Math.round(stats.totalSubscribers * easeOut),
        totalComments: Math.round(stats.totalComments * easeOut),
        totalArticles: Math.round(stats.totalArticles * easeOut),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats(stats);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const statItems = [
    { label: 'Views', value: animatedStats.totalViews, icon: Eye },
    { label: 'Subscribers', value: animatedStats.totalSubscribers, icon: Users },
    { label: 'Comments', value: animatedStats.totalComments, icon: MessageSquare },
    { label: 'Articles', value: animatedStats.totalArticles, icon: FileText },
  ];

  return (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Live Stats
          </span>
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statItems.map((stat, index) => (
          <div
            key={stat.label}
            className="group animate-fade-in text-center"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 mb-4 group-hover:bg-muted transition-colors">
              <stat.icon className="h-5 w-5 text-foreground/70 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-1">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-[0.15em]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
