import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthorCardProps {
  authorId: string;
}

export function AuthorCard({ authorId }: AuthorCardProps) {
  const { data: author, isLoading } = useQuery({
    queryKey: ['author', authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authorId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!authorId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (!author) return null;

  const initials = author.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'A';

  return (
    <Link 
      to={`/author/${authorId}`}
      className="flex items-center gap-4 group"
    >
      <Avatar className="h-12 w-12 border-2 border-foreground/20 group-hover:border-foreground transition-colors">
        <AvatarImage src={author.avatar_url || undefined} alt={author.full_name || 'Author'} />
        <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-serif font-semibold group-hover:underline underline-offset-4">
          {author.full_name || 'Anonymous'}
        </p>
        <p className="text-xs text-muted-foreground">Author</p>
      </div>
    </Link>
  );
}
