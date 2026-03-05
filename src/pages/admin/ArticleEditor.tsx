import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { ImageUpload } from '@/components/editor/ImageUpload';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/lib/types';
import { Save, Eye, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { z } from 'zod';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  content: z.string().optional(),
  cover_image: z.string().url('Invalid URL').optional().or(z.literal('')),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return data as Category[];
    },
  });

  const { data: article, isLoading } = useQuery({
    queryKey: ['article-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt || '');
      setContent(article.content || '');
      setCoverImage(article.cover_image || '');
      setCategoryId(article.category_id);
      setTags(article.tags?.join(', ') || '');
    }
  }, [article]);

  // Auto-generate slug from title
  useEffect(() => {
    if (isNew && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, isNew]);

  const suggestTags = async () => {
    if (!title && !content) {
      toast.error('Please add a title or content first');
      return;
    }

    setSuggestingTags(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-tags`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ title, content, excerpt }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to suggest tags');
      }

      const data = await response.json();
      if (data.tags && data.tags.length > 0) {
        const existingTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        const newTags = [...new Set([...existingTags, ...data.tags])];
        setTags(newTags.join(', '));
        toast.success('AI suggested tags added!');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to suggest tags';
      toast.error(message);
    } finally {
      setSuggestingTags(false);
    }
  };


  const saveMutation = useMutation({
    mutationFn: async (status: 'draft' | 'published') => {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const validation = articleSchema.safeParse({
        title,
        slug,
        excerpt: excerpt || undefined,
        content: content || undefined,
        cover_image: coverImage || undefined,
        category_id: categoryId,
        tags: tagsArray,
      });

      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const articleData = {
        title,
        slug,
        excerpt: excerpt || null,
        content: content || null,
        cover_image: coverImage || null,
        category_id: categoryId,
        tags: tagsArray,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        author_id: user!.id,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('articles')
          .insert(articleData)
          .select()
          .single();
        if (error) throw error;

        await supabase.from('admin_logs').insert({
          user_id: user!.id,
          action: 'created',
          entity_type: 'article',
          entity_id: data.id,
          details: { title },
        });

        return data;
      } else {
        const { data, error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;

        await supabase.from('admin_logs').insert({
          user_id: user!.id,
          action: 'updated',
          entity_type: 'article',
          entity_id: id,
          details: { title },
        });

        return data;
      }
    },
    onSuccess: async (data, status) => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success(status === 'published' ? 'Article published!' : 'Article saved as draft');
      
      // Send email notification to subscribers when publishing
      if (status === 'published') {
        try {
          await supabase.functions.invoke('send-smtp-email', {
            body: {
              type: 'new_article',
              data: {
                title: data.title,
                excerpt: data.excerpt || 'A new article has been published on L3arbiFit.',
                slug: data.slug,
              },
            },
          });
          toast.success('Email notifications sent to subscribers!');
        } catch (emailError) {
          // Don't show error toast - article was still published successfully
        }
      }
      
      if (isNew) {
        navigate(`/admin/articles/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save article');
    },
  });

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true);
    try {
      await saveMutation.mutateAsync(status);
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && isLoading) {
    return (
      <AdminLayout title="Loading...">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/2" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isNew ? 'New Article' : 'Edit Article'}>
      <div className="max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/admin/articles')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to articles
        </Button>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="article-slug"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the article..."
              rows={2}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId || ''} onValueChange={(v) => setCategoryId(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={suggestTags}
                  disabled={suggestingTags}
                  className="h-6 text-xs"
                >
                  {suggestingTags ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  AI Suggest
                </Button>
              </div>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="news, technology, opinion"
              />
            </div>
          </div>

          <ImageUpload
            value={coverImage}
            onChange={setCoverImage}
            label="Cover Image"
          />

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your article content here..."
            />
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-border">
            <Button
              onClick={() => handleSave('draft')}
              disabled={saving || !title || !slug}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={saving || !title || !slug}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
