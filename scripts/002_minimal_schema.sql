-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' NOT NULL,
  department TEXT,
  phone TEXT,
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Artists table
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  stage_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  email TEXT,
  phone TEXT,
  social_links JSONB DEFAULT '{}',
  contract_status TEXT DEFAULT 'active',
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- Releases table
CREATE TABLE IF NOT EXISTS public.releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  release_type TEXT DEFAULT 'single',
  status TEXT DEFAULT 'draft' NOT NULL,
  release_date DATE,
  cover_image_url TEXT,
  upc_code TEXT,
  label TEXT DEFAULT '2NoteFireRecord',
  genre TEXT,
  description TEXT,
  total_tracks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- Tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  release_id UUID REFERENCES public.releases(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  duration INTEGER,
  file_url TEXT,
  isrc_code TEXT,
  track_number INTEGER,
  status TEXT DEFAULT 'pending' NOT NULL,
  genre TEXT,
  bpm INTEGER,
  key_signature TEXT,
  lyrics TEXT,
  credits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id)
);

-- Accounting transactions table
CREATE TABLE IF NOT EXISTS public.accounting_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT NOT NULL,
  description TEXT,
  reference_number TEXT,
  transaction_date DATE NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  release_id UUID REFERENCES public.releases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- Royalties table
CREATE TABLE IF NOT EXISTS public.royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  release_id UUID REFERENCES public.releases(id) ON DELETE SET NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_revenue DECIMAL(15, 2) DEFAULT 0,
  net_revenue DECIMAL(15, 2) DEFAULT 0,
  artist_share_percentage DECIMAL(5, 2) DEFAULT 50.00,
  artist_earnings DECIMAL(15, 2) DEFAULT 0,
  label_earnings DECIMAL(15, 2) DEFAULT 0,
  streams_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- Analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  release_id UUID REFERENCES public.releases(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  streams INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  listeners INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  playlist_adds INTEGER DEFAULT 0,
  platform TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  contract_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  start_date DATE,
  end_date DATE,
  terms TEXT,
  file_url TEXT,
  template_id TEXT,
  royalty_percentage DECIMAL(5, 2),
  advance_amount DECIMAL(15, 2),
  signature_url TEXT,
  signed_date DATE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES public.profiles(id)
);

-- Permissions table for RBAC
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  department TEXT,
  module TEXT NOT NULL,
  can_create BOOLEAN DEFAULT FALSE,
  can_read BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(role, department, module)
);

-- Accounting categories table
CREATE TABLE IF NOT EXISTS public.accounting_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "artists_select" ON public.artists FOR SELECT USING (true);
CREATE POLICY "artists_insert" ON public.artists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "artists_update" ON public.artists FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "artists_delete" ON public.artists FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "releases_select" ON public.releases FOR SELECT USING (true);
CREATE POLICY "releases_insert" ON public.releases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "releases_update" ON public.releases FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "releases_delete" ON public.releases FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "tracks_select" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "tracks_insert" ON public.tracks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tracks_update" ON public.tracks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "tracks_delete" ON public.tracks FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "accounting_select" ON public.accounting_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "accounting_insert" ON public.accounting_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "accounting_update" ON public.accounting_transactions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "accounting_delete" ON public.accounting_transactions FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "royalties_select" ON public.royalties FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "royalties_insert" ON public.royalties FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "royalties_update" ON public.royalties FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "analytics_select" ON public.analytics FOR SELECT USING (true);
CREATE POLICY "analytics_insert" ON public.analytics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "analytics_update" ON public.analytics FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "contracts_select" ON public.contracts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "contracts_update" ON public.contracts FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "settings_select" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_all" ON public.settings FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "permissions_select" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "permissions_all" ON public.permissions FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "categories_select" ON public.accounting_categories FOR SELECT USING (true);
CREATE POLICY "categories_all" ON public.accounting_categories FOR ALL USING (auth.uid() IS NOT NULL);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data ->> 'role', 'user'),
    COALESCE(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
