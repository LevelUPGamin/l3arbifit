-- Complete Database Schema for L3arbiFit
-- Run this entire script in your new Supabase project's SQL Editor

-- ===========================================
-- 1. CREATE ENUMS
-- ===========================================

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'reader');

-- Create article status enum
CREATE TYPE public.article_status AS ENUM ('draft', 'published');

-- ===========================================
-- 2. CREATE TABLES
-- ===========================================

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'reader',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status article_status NOT NULL DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  reading_time_minutes INTEGER DEFAULT 1,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  scheduled_publish_at TIMESTAMPTZ,
  series_id UUID,
  series_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Create admin_logs table
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create site_settings table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Newsletter subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create article reactions table
CREATE TABLE public.article_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(article_id, user_id, reaction_type)
);

-- Create article series table
CREATE TABLE public.article_series (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  cover_image text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ===========================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_series ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 4. CREATE FUNCTIONS
-- ===========================================

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reader');

  RETURN NEW;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION public.calculate_reading_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  word_count INTEGER;
BEGIN
  word_count := array_length(regexp_split_to_array(COALESCE(NEW.content, ''), '\s+'), 1);
  NEW.reading_time_minutes := GREATEST(1, CEIL(word_count::NUMERIC / 200));
  RETURN NEW;
END;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_article_view(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = article_id;
END;
$$;

-- ===========================================
-- 5. CREATE TRIGGERS
-- ===========================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for reading time calculation
CREATE TRIGGER calculate_article_reading_time
BEFORE INSERT OR UPDATE OF content ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.calculate_reading_time();

-- ===========================================
-- 6. CREATE ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Profiles RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Categories RLS policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Articles RLS policies
CREATE POLICY "Published articles are viewable by everyone"
ON public.articles FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can view all articles"
ON public.articles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create articles"
ON public.articles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles"
ON public.articles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles"
ON public.articles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Bookmarks RLS policies
CREATE POLICY "Users can view own bookmarks"
ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Admin logs RLS policies
CREATE POLICY "Admins can view logs"
ON public.admin_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create logs"
ON public.admin_logs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site settings RLS policies
CREATE POLICY "Site settings are viewable by everyone"
ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Newsletter subscriptions policies
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage subscriptions"
ON public.newsletter_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Comments policies
CREATE POLICY "Comments on published articles are viewable by everyone"
ON public.comments
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.articles WHERE id = article_id AND status = 'published'));

CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Contact messages policies
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
ON public.contact_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Article reactions policies
CREATE POLICY "Reactions are viewable by everyone" ON public.article_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add reactions" ON public.article_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.article_reactions FOR DELETE USING (auth.uid() = user_id);

-- Article series policies
CREATE POLICY "Series are viewable by everyone" ON public.article_series FOR SELECT USING (true);
CREATE POLICY "Admins can manage series" ON public.article_series FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- 7. CREATE STORAGE BUCKET
-- ===========================================

-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Storage policies for article images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-images' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access for article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'article-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'article-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===========================================
-- 8. INSERT DEFAULT DATA
-- ===========================================

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
('News', 'news', 'Breaking news and current events'),
('Opinion', 'opinion', 'Editorial and opinion pieces'),
('Features', 'features', 'In-depth feature articles'),
('Culture', 'culture', 'Arts, culture, and entertainment'),
('Technology', 'technology', 'Tech news and reviews');

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
('theme', '"paper"'),
('site_title', '"L3arbiFit"'),
('site_tagline', '"Transform your body and elevate your mind"');

-- ===========================================
-- SETUP COMPLETE!
-- ===========================================