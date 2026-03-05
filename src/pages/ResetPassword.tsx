import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase sets the session from the recovery link hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ password, confirm });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated! You can now sign in.');
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12">
        <Link to="/" className="masthead-title text-background text-2xl">L3arbiFit</Link>
        <div>
          <blockquote className="font-serif text-3xl font-medium leading-snug text-background/90 mb-6">
            "Security is not a product, but a process."
          </blockquote>
          <p className="text-background/50 caption">— Bruce Schneier</p>
        </div>
        <p className="text-background/40 text-sm">
          © {new Date().getFullYear()} L3arbiFit. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Back link */}
          <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="w-12 h-12 bg-foreground flex items-center justify-center mb-6">
              <KeyRound className="w-5 h-5 text-background" />
            </div>
            <h1 className="headline-md mb-2">Set new password</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Choose a strong password to secure your account.
            </p>
          </div>

          {/* Recovery status */}
          {!ready && (
            <div className="flex items-start gap-3 bg-muted border border-border p-4 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Waiting for recovery session… Make sure you opened this link directly from your email.
              </p>
            </div>
          )}

          {ready && (
            <div className="flex items-center gap-2 bg-muted border border-border p-3 mb-6">
              <ShieldCheck className="w-4 h-4 text-foreground shrink-0" />
              <p className="text-sm font-medium">Recovery session active</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="caption">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="caption">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 btn-editorial-filled mt-2"
              disabled={loading || !ready}
            >
              {loading ? 'Updating password…' : 'Set New Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
