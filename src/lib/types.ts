export type AppRole = 'admin' | 'reader';
export type ArticleStatus = 'draft' | 'published';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category_id: string | null;
  author_id: string;
  status: ArticleStatus;
  tags: string[];
  reading_time_minutes: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  // Joined fields
  category?: Category;
  author?: Profile;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  article?: Article;
}

export interface AdminLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
  updated_by: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
  roles: AppRole[];
  isAdmin: boolean;
}