import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, BookOpen, Sun, Moon, Search, Menu, UserCog, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category, Article } from '@/lib/types';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('articles')
        .select('*, category:categories(*)')
        .eq('status', 'published')
        .or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`)
        .limit(6);
      setSearchResults((data as unknown as Article[]) ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (slug: string) => {
    setSearchOpen(false);
    navigate(`/article/${slug}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return data as Category[];
    },
  });

  const categories = categoriesData ?? [];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <header className="border-b border-border bg-background">
        {/* Top bar */}
        <div className="border-b border-border">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">{currentDate}</span>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle theme">
                {theme === 'paper' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              {!user && (
                <Link to="/auth" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Masthead */}
        <div className="masthead">
          <Link to="/" className="inline-block">
            <h1 className="masthead-title">L3arbiFit</h1>
          </Link>
          <p className="masthead-tagline">All the news that matters</p>
        </div>
      </header>

      {/* Sticky Navigation */}
      <nav className={cn(
        'sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-300',
        scrolled && 'shadow-md'
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 relative" ref={searchContainerRef}>

            {/* Mobile menu */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link to="/" className="text-lg font-medium py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    {categories.map((cat) => (
                      <Link key={cat.id} to={`/category/${cat.slug}`} className="text-lg font-medium py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>{cat.name}</Link>
                    ))}
                    <Link to="/about" className="text-lg font-medium py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>About</Link>
                    <Link to="/archive" className="text-lg font-medium py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Archive</Link>
                    <Link to="/contact" className="text-lg font-medium py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop nav — hidden when search is open */}
            <div className={cn('hidden lg:flex items-center gap-8 transition-opacity duration-200', searchOpen && 'opacity-0 pointer-events-none')}>
              <Link to="/" className="text-sm uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors">Home</Link>
              {categories.map((cat) => (
                <Link key={cat.id} to={`/category/${cat.slug}`} className="text-sm uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors">{cat.name}</Link>
              ))}
              <Link to="/about" className="text-sm uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors">About</Link>
              <Link to="/archive" className="text-sm uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors">Archive</Link>
              <Link to="/contact" className="text-sm uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors">Contact</Link>
            </div>

            {/* Inline search bar — expands over nav */}
            {searchOpen && (
              <form
                onSubmit={handleSearchSubmit}
                className="absolute inset-0 flex items-center gap-2 bg-background/95 backdrop-blur z-10 px-2"
              >
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search articles… press Enter to see all results"
                  className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(o => !o)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-1">{user.isAdmin ? 'Admin' : 'Reader'}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setProfileDialogOpen(true)} className="flex items-center gap-2 cursor-pointer">
                      <UserCog className="h-4 w-4" />Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/bookmarks" className="flex items-center gap-2 cursor-pointer">
                        <BookOpen className="h-4 w-4" />My Bookmarks
                      </Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4" />Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <ProfileEditDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
            </div>

            {/* Search results dropdown */}
            {searchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border shadow-lg z-20 max-h-96 overflow-y-auto">
                {searching ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">No results for "{searchQuery}"</div>
                ) : (
                  <>
                    {searchResults.map(article => (
                      <button
                        key={article.id}
                        onClick={() => handleResultClick(article.slug)}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 flex items-start gap-3"
                      >
                        {article.cover_image && (
                          <img src={article.cover_image} alt="" className="w-12 h-10 object-cover shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium font-serif leading-snug line-clamp-1">{article.title}</p>
                          {article.excerpt && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{article.excerpt}</p>
                          )}
                          {article.category && (
                            <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1 inline-block">{article.category.name}</span>
                          )}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={handleSearchSubmit as any}
                      className="w-full px-4 py-3 text-sm text-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-t border-border"
                    >
                      See all results for "{searchQuery}" →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
