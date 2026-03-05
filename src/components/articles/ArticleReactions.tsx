import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Heart, ThumbsUp, Lightbulb, Flame } from 'lucide-react';

const REACTIONS = [
  { type: 'like', icon: ThumbsUp, label: 'Like' },
  { type: 'love', icon: Heart, label: 'Love' },
  { type: 'insightful', icon: Lightbulb, label: 'Insightful' },
  { type: 'fire', icon: Flame, label: 'Fire' },
];

interface ArticleReactionsProps {
  articleId: string;
}

export function ArticleReactions({ articleId }: ArticleReactionsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [animating, setAnimating] = useState<string | null>(null);

  const { data: reactions } = useQuery({
    queryKey: ['article-reactions', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_reactions')
        .select('reaction_type, user_id')
        .eq('article_id', articleId);
      
      if (error) throw error;
      return data;
    },
  });

  const toggleReaction = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!user) throw new Error('Must be logged in');

      const existingReaction = reactions?.find(
        r => r.user_id === user.id && r.reaction_type === reactionType
      );

      if (existingReaction) {
        const { error } = await supabase
          .from('article_reactions')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('article_reactions')
          .insert({ article_id: articleId, user_id: user.id, reaction_type: reactionType });
        if (error) throw error;
      }
    },
    onMutate: (reactionType) => {
      setAnimating(reactionType);
      setTimeout(() => setAnimating(null), 300);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-reactions', articleId] });
    },
    onError: () => {
      toast.error('Failed to update reaction');
    },
  });

  const handleReaction = (reactionType: string) => {
    if (!user) {
      toast.error('Please sign in to react');
      return;
    }
    toggleReaction.mutate(reactionType);
  };

  const getReactionCount = (type: string) => 
    reactions?.filter(r => r.reaction_type === type).length || 0;

  const hasUserReacted = (type: string) =>
    user && reactions?.some(r => r.user_id === user.id && r.reaction_type === type);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-2">React:</span>
      {REACTIONS.map(({ type, icon: Icon, label }) => {
        const count = getReactionCount(type);
        const active = hasUserReacted(type);
        
        return (
          <Button
            key={type}
            variant={active ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReaction(type)}
            className={`gap-1.5 transition-transform ${animating === type ? 'scale-110' : ''}`}
            title={label}
          >
            <Icon className={`h-4 w-4 ${active ? 'fill-current' : ''}`} />
            {count > 0 && <span>{count}</span>}
          </Button>
        );
      })}
    </div>
  );
}
