import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Page, PageSection } from '@/lib/types';
import { ArrowLeft, Save, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function PageEditor() {
  const { slug } = useParams<{ slug: string }>();
  const isNew = slug === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [sections, setSections] = useState<PageSection[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['page-edit', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!slug,
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setPageSlug(existing.slug);
      setSections((existing.sections as unknown as PageSection[]) || []);
    }
  }, [existing]);

  // auto-generate slug when creating new page
  useEffect(() => {
    if (isNew && title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setPageSlug(generated);
    }
  }, [title, isNew]);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { id: uuidv4(), heading: '', content: '', bgColor: '#ffffff' },
    ]);
  };

  const updateSection = (id: string, changes: Partial<PageSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...changes } : s))
    );
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const arr = [...prev];
      const [moved] = arr.splice(index, 1);
      arr.splice(newIndex, 0, moved);
      return arr;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title || !pageSlug) {
        throw new Error('Title and slug are required');
      }
      const payload = {
        title,
        slug: pageSlug,
        sections,
        updated_by: user!.id,
      } as Partial<Page>;

      if (isNew) {
        const { data, error } = await supabase
          .from('pages')
          .insert(payload as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('pages')
          .update(payload as any)
          .eq('slug', slug)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      toast.success('Page saved');
      if (isNew) {
        navigate(`/admin/pages/${data.slug}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save page');
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMutation.mutateAsync();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title={isNew ? 'New Page' : `Edit: ${title || pageSlug}`}>      
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/admin/pages')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to pages
      </Button>

      <div className="space-y-6 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={pageSlug}
              onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="page-slug"
              disabled={!isNew}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Sections</h3>
            <Button size="sm" onClick={addSection}>
              <Plus className="h-4 w-4" /> Add section
            </Button>
          </div>

          {sections.map((sec, idx) => (
            <div key={sec.id} className="p-4 border border-border rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(sec.id, 'up')}
                    disabled={idx === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(sec.id, 'down')}
                    disabled={idx === sections.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeSection(sec.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Heading</Label>
                <Input
                  value={sec.heading || ''}
                  onChange={(e) => updateSection(sec.id, { heading: e.target.value })}
                  placeholder="Optional section heading"
                />
              </div>
              <div className="space-y-2">
                <Label>Background color</Label>
                <Input
                  type="color"
                  value={sec.bgColor || '#ffffff'}
                  onChange={(e) => updateSection(sec.id, { bgColor: e.target.value })}
                  className="w-12 h-8 p-0"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  content={sec.content}
                  onChange={(html) => updateSection(sec.id, { content: html })}
                  placeholder="Section content..."
                />
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save page'}
        </Button>
      </div>
    </AdminLayout>
  );
}
