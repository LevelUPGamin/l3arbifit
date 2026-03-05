-- Add featured flag to articles
ALTER TABLE public.articles ADD COLUMN is_featured boolean DEFAULT false;

-- Add view count to articles
ALTER TABLE public.articles ADD COLUMN view_count integer DEFAULT 0;

-- Add scheduled publish date
ALTER TABLE public.articles ADD COLUMN scheduled_publish_at timestamp with time zone;

-- Add bio to profiles
ALTER TABLE public.profiles ADD COLUMN bio text;

-- Create article reactions table
CREATE TABLE public.article_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(article_id, user_id, reaction_type)
);

ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions
CREATE POLICY "Reactions are viewable by everyone" ON public.article_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add reactions" ON public.article_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.article_reactions FOR DELETE USING (auth.uid() = user_id);

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

ALTER TABLE public.article_series ENABLE ROW LEVEL SECURITY;

-- RLS for series
CREATE POLICY "Series are viewable by everyone" ON public.article_series FOR SELECT USING (true);
CREATE POLICY "Admins can manage series" ON public.article_series FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add series reference to articles
ALTER TABLE public.articles ADD COLUMN series_id uuid REFERENCES public.article_series(id) ON DELETE SET NULL;
ALTER TABLE public.articles ADD COLUMN series_order integer;

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