import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Eye, BookmarkIcon, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [articles, users, bookmarks, messages, subscribers] = await Promise.all([
        supabase.from('articles').select('id, status', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('bookmarks').select('id', { count: 'exact' }),
        supabase.from('contact_messages').select('id, is_read', { count: 'exact' }),
        supabase.from('newsletter_subscriptions').select('id', { count: 'exact' }),
      ]);

      const publishedCount = articles.data?.filter(a => a.status === 'published').length || 0;
      const draftCount = articles.data?.filter(a => a.status === 'draft').length || 0;
      const unreadMessages = messages.data?.filter(m => !m.is_read).length || 0;

      return {
        totalArticles: articles.count || 0,
        publishedArticles: publishedCount,
        draftArticles: draftCount,
        totalUsers: users.count || 0,
        totalBookmarks: bookmarks.count || 0,
        totalMessages: messages.count || 0,
        unreadMessages,
        totalSubscribers: subscribers.count || 0,
      };
    },
  });

  const { data: recentArticles } = useQuery({
    queryKey: ['admin-recent-articles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['admin-recent-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <AdminLayout title="Dashboard">
      {/* Stats cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Articles
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{stats?.totalArticles || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.publishedArticles || 0} published, {stats?.draftArticles || 0} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered readers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookmarks
            </CardTitle>
            <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{stats?.totalBookmarks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Articles saved by users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.unreadMessages || 0} unread
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subscribers
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{stats?.totalSubscribers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Newsletter subscribers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent articles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Articles</CardTitle>
            <Link to="/admin/articles" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {recentArticles?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No articles yet</p>
            ) : (
              <ul className="space-y-3">
                {recentArticles?.map((article) => (
                  <li key={article.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <Link 
                        to={`/admin/articles/${article.id}`}
                        className="font-medium hover:underline"
                      >
                        {article.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(article.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`tag-pill text-[10px] ${article.status === 'published' ? 'tag-pill-filled' : ''}`}>
                      {article.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link to="/admin/logs" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {recentLogs?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity yet</p>
            ) : (
              <ul className="space-y-3">
                {recentLogs?.map((log) => (
                  <li key={log.id} className="py-2 border-b border-border last:border-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.action}</span>
                      {' on '}
                      <span className="text-muted-foreground">{log.entity_type}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}