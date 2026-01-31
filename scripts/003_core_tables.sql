-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  department TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Artists table
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  genre TEXT,
  image_url TEXT,
  email TEXT,
  phone TEXT,
  social_links JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artists_select" ON public.artists FOR SELECT USING (true);
CREATE POLICY "artists_insert" ON public.artists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "artists_update" ON public.artists FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "artists_delete" ON public.artists FOR DELETE USING (auth.uid() IS NOT NULL);

-- Releases table
CREATE TABLE IF NOT EXISTS public.releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  release_date DATE,
  cover_art_url TEXT,
  status TEXT DEFAULT 'draft',
  genre TEXT,
  label TEXT DEFAULT '2NoteFireRecord',
  upc TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "releases_select" ON public.releases FOR SELECT USING (true);
CREATE POLICY "releases_insert" ON public.releases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "releases_update" ON public.releases FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "releases_delete" ON public.releases FOR DELETE USING (auth.uid() IS NOT NULL);

-- Tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  release_id UUID REFERENCES public.releases(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES public.artists(id),
  track_number INTEGER,
  duration INTEGER,
  audio_url TEXT,
  isrc TEXT,
  status TEXT DEFAULT 'pending',
  lyrics TEXT,
  credits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tracks_select" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "tracks_insert" ON public.tracks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tracks_update" ON public.tracks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "tracks_delete" ON public.tracks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Transactions table (accounting)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  artist_id UUID REFERENCES public.artists(id),
  release_id UUID REFERENCES public.releases(id),
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Royalties table
CREATE TABLE IF NOT EXISTS public.royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id),
  release_id UUID REFERENCES public.releases(id),
  platform TEXT,
  streams BIGINT DEFAULT 0,
  amount DECIMAL(12,2) DEFAULT 0,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.royalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "royalties_select" ON public.royalties FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "royalties_insert" ON public.royalties FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id),
  type TEXT,
  status TEXT DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  terms TEXT,
  royalty_rate DECIMAL(5,2),
  advance_amount DECIMAL(12,2),
  document_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "contracts_update" ON public.contracts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES public.tracks(id),
  release_id UUID REFERENCES public.releases(id),
  artist_id UUID REFERENCES public.artists(id),
  platform TEXT,
  streams BIGINT DEFAULT 0,
  downloads BIGINT DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  date DATE,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_select" ON public.analytics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "analytics_insert" ON public.analytics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "settings_insert" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT true,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_select" ON public.permissions FOR SELECT USING (true);

-- Insert default permissions
INSERT INTO public.permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
('admin', 'artists', true, true, true, true),
('admin', 'releases', true, true, true, true),
('admin', 'tracks', true, true, true, true),
('admin', 'transactions', true, true, true, true),
('admin', 'royalties', true, true, true, true),
('admin', 'contracts', true, true, true, true),
('admin', 'analytics', true, true, true, true),
('admin', 'users', true, true, true, true),
('user', 'artists', false, true, false, false),
('user', 'releases', false, true, false, false),
('user', 'tracks', false, true, false, false),
('user', 'transactions', false, true, false, false),
('user', 'royalties', false, true, false, false),
('user', 'contracts', false, true, false, false),
('user', 'analytics', false, true, false, false),
('artist', 'artists', false, true, true, false),
('artist', 'releases', true, true, true, false),
('artist', 'tracks', true, true, true, false),
('artist', 'royalties', false, true, false, false),
('artist', 'contracts', false, true, false, false),
('artist', 'analytics', false, true, false, false);
