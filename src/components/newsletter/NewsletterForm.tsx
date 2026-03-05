import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

interface NewsletterFormProps {
  variant?: 'default' | 'compact' | 'footer';
}

export function NewsletterForm({ variant = 'default' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletter_subscriptions')
        .select('id, is_active')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        if (existing.is_active) {
          toast.info('You are already subscribed to our newsletter!');
        } else {
          // Reactivate subscription
          await supabase
            .from('newsletter_subscriptions')
            .update({ is_active: true })
            .eq('id', existing.id);
          
          toast.success('Welcome back! Your subscription has been reactivated.');
          setSubscribed(true);
        }
        setLoading(false);
        return;
      }

      // Insert new subscription
      const { error: insertError } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: email.toLowerCase().trim() });

      if (insertError) {
        throw insertError;
      }

      // Send welcome email via SMTP
      try {
        await supabase.functions.invoke('send-smtp-email', {
          body: {
            type: 'newsletter_welcome',
            to: email.toLowerCase().trim(),
          },
        });
      } catch (emailError) {
        // Don't fail the subscription if email fails
      }

      toast.success('Successfully subscribed! Check your inbox for a welcome email.');
      setSubscribed(true);
      setEmail('');
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className={`flex items-center gap-3 ${variant === 'footer' ? 'text-muted-foreground' : 'text-foreground'}`}>
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-sm">Thanks for subscribing!</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </Button>
      </form>
    );
  }

  if (variant === 'footer') {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-background/50 border-border"
          disabled={loading}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Subscribe
            </>
          )}
        </Button>
      </form>
    );
  }

  // Default variant
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Newsletter</h3>
          <p className="text-sm text-muted-foreground">Get notified about new articles</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Subscribing...
            </>
          ) : (
            'Subscribe to Newsletter'
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        We respect your privacy. Unsubscribe anytime.
      </p>
    </div>
  );
}
