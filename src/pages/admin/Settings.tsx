import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [siteTitle, setSiteTitle] = useState('L3arbiFit');
  const [siteTagline, setSiteTagline] = useState('All the news that matters');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState('#f59e0b');
  const [saving, setSaving] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*');
      return data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, unknown>);
    },
  });

  useEffect(() => {
    if (settings) {
      if (settings.site_title) setSiteTitle(settings.site_title as string);
      if (settings.site_tagline) setSiteTagline(settings.site_tagline as string);
      if (settings.theme) setTheme(settings.theme as 'paper' | 'ink');
      if (settings.primary_color) setPrimaryColor(settings.primary_color as string);
      if (settings.secondary_color) setSecondaryColor(settings.secondary_color as string);
    }
  }, [settings, setTheme]);

  // whenever colors change apply them globally
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
    // override the default primary/secondary used by tailwind
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--secondary', secondaryColor);
  }, [primaryColor, secondaryColor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { key: 'site_title', value: JSON.stringify(siteTitle) },
        { key: 'site_tagline', value: JSON.stringify(siteTagline) },
        { key: 'theme', value: JSON.stringify(theme) },
        { key: 'primary_color', value: JSON.stringify(primaryColor) },
        { key: 'secondary_color', value: JSON.stringify(secondaryColor) },
      ];

      for (const update of updates) {
        await supabase
          .from('site_settings')
          .upsert({ 
            key: update.key, 
            value: JSON.parse(update.value), 
            updated_by: user!.id 
          }, { onConflict: 'key' });
      }

      await supabase.from('admin_logs').insert({
        user_id: user!.id,
        action: 'updated',
        entity_type: 'site_settings',
        details: { site_title: siteTitle, site_tagline: siteTagline, theme, primaryColor, secondaryColor },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Settings saved');
    },
    onError: () => {
      toast.error('Failed to save settings');
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
    <AdminLayout title="Site Settings">
      <div className="max-w-2xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic site information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteTitle">Site Title</Label>
              <Input
                id="siteTitle"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTagline">Tagline</Label>
              <Input
                id="siteTagline"
                value={siteTagline}
                onChange={(e) => setSiteTagline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-8 p-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-8 p-0"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Choose the visual appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={(v) => setTheme(v as 'paper' | 'ink')}>
              <div className="flex items-center space-x-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="paper" id="paper" />
                <div>
                  <Label htmlFor="paper" className="cursor-pointer font-medium">Paper</Label>
                  <p className="text-sm text-muted-foreground">
                    Warm, off-white background with classic newspaper feel
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 mt-2">
                <RadioGroupItem value="ink" id="ink" />
                <div>
                  <Label htmlFor="ink" className="cursor-pointer font-medium">Ink</Label>
                  <p className="text-sm text-muted-foreground">
                    High-contrast black and white for better readability
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </AdminLayout>
  );
}