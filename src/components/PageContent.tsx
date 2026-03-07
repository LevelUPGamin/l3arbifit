import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page, PageSection } from '@/lib/types';
import { ReactNode } from 'react';

interface PageContentProps {
  slug: string;
  className?: string;
  loadingFallback?: ReactNode;
  notFoundFallback?: ReactNode;
}

export default function PageContent({
  slug,
  className = '',
  loadingFallback = <p>Loading...</p>,
  notFoundFallback = <p>Page not found</p>,
}: PageContentProps) {
  const { data: page, isLoading } = useQuery<Page | null>({
    queryKey: ['page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      // supabase types sections as Json; convert to our structured type
      return {
        ...data,
        sections: (data.sections as unknown as PageSection[]) || [],
      } as Page;
    },
  });

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!page) {
    return <>{notFoundFallback}</>;
  }

  const sections = page.sections as PageSection[];

  return (
    <article className={className}>
      {sections.map((section, idx) => (
        <section
          key={section.id || idx}
          style={section.bgColor ? { backgroundColor: section.bgColor } : undefined}
          className="py-12"
        >
          <div className="container mx-auto px-4">
            {section.heading && (
              <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
            )}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        </section>
      ))}
    </article>
  );
}
