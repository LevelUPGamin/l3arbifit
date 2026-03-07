import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Page } from '@/lib/types';

export default function Pages() {
  const { data: pages } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: async () => {
      const { data } = await supabase.from('pages').select('*').order('slug');
      return data || [];
    },
  });

  return (
    <AdminLayout title="Pages">
      <div className="flex justify-end mb-6">
        <Link to="/admin/pages/new">
          <Button size="sm">+ New page</Button>
        </Link>
      </div>
      <div className="grid gap-4">
        {pages?.map((page) => (
          <Card key={page.id}>
            <CardContent className="flex justify-between items-center">
              <div>
                <CardTitle>{page.title}</CardTitle>
                <p className="text-sm text-muted-foreground">/{page.slug}</p>
              </div>
              <Link to={`/admin/pages/${page.slug}`} className="text-primary underline">
                Edit &rarr;
              </Link>
            </CardContent>
          </Card>
        ))}
        {pages?.length === 0 && (
          <p className="text-muted-foreground">You haven't created any pages yet.</p>
        )}
      </div>
    </AdminLayout>
  );
}
