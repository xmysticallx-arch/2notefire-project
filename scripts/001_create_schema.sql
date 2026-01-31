-- 2NoteFireRecord Database Schema
-- Complete schema for music label management system

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES public.profiles(id)
);

-- Permissions table for RBAC
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow profile creation" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for artists
CREATE POLICY "Anyone can view artists" ON public.artists FOR SELECT USING (true);
CREATE POLICY "Staff can create artists" ON public.artists FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user'))
);
CREATE POLICY "Staff can update artists" ON public.artists FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user'))
  OR user_id = auth.uid()
);
CREATE POLICY "Admins can delete artists" ON public.artists FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for releases
CREATE POLICY "Anyone can view releases" ON public.releases FOR SELECT USING (true);
CREATE POLICY "Staff can create releases" ON public.releases FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user'))
  OR EXISTS (SELECT 1 FROM public.artists WHERE user_id = auth.uid() AND id = artist_id)
);
CREATE POLICY "Staff can update releases" ON public.releases FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user'))
  OR EXISTS (SELECT 1 FROM public.artists WHERE user_id = auth.uid() AND id = artist_id)
);
CREATE POLICY "Admins can delete releases" ON public.releases FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for tracks
CREATE POLICY "Anyone can view tracks" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "Staff and artists can create tracks" ON public.tracks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user'))
  OR EXISTS (SELECT 1 FROM public.artists WHERE user_id = auth.uid() AND id = artist_id)
);
CREATE POLICY "Staff can update tracks" ON public.tracks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user'))
  OR EXISTS (SELECT 1 FROM public.artists WHERE user_id = auth.uid() AND id = artist_id)
);
CREATE POLICY "Admins can delete tracks" ON public.tracks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for accounting
CREATE POLICY "Authorized users can view accounting" ON public.accounting_transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR department IN ('finance', 'management'))
  )
);
CREATE POLICY "Finance can manage accounting" ON public.accounting_transactions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR department IN ('finance', 'management'))
  )
);

-- RLS Policies for royalties
CREATE POLICY "View royalties" ON public.royalties FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user'))
  OR EXISTS (SELECT 1 FROM public.artists WHERE user_id = auth.uid() AND id = artist_id)
);
CREATE POLICY "Manage royalties" ON public.royalties FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR department = 'management')
  )
);

-- RLS Policies for analytics
CREATE POLICY "View analytics" ON public.analytics FOR SELECT USING (true);
CREATE POLICY "Admins manage analytics" ON public.analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for contracts
CREATE POLICY "View contracts" ON public.contracts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user'))
  OR EXISTS (SELECT 1 FROM public.artists WHERE user_id = auth.uid() AND id = artist_id)
);
CREATE POLICY "Manage contracts" ON public.contracts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR department IN ('legal', 'management'))
  )
);

-- RLS Policies for notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for settings
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for permissions
CREATE POLICY "Anyone can view permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage permissions" ON public.permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for accounting categories
CREATE POLICY "Anyone can view categories" ON public.accounting_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.accounting_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create trigger for auto-creating profile on signup
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_releases_updated_at BEFORE UPDATE ON public.releases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounting_updated_at BEFORE UPDATE ON public.accounting_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_royalties_updated_at BEFORE UPDATE ON public.royalties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions
INSERT INTO public.permissions (role, department, module, can_create, can_read, can_update, can_delete) VALUES
-- Admin permissions (full access)
('admin', NULL, 'dashboard', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'artists', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'releases', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'tracks', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'accounting', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'royalties', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'analytics', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'contracts', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'settings', TRUE, TRUE, TRUE, TRUE),
('admin', NULL, 'users', TRUE, TRUE, TRUE, TRUE),
-- Management department permissions
('user', 'management', 'dashboard', TRUE, TRUE, TRUE, TRUE),
('user', 'management', 'artists', TRUE, TRUE, TRUE, TRUE),
('user', 'management', 'releases', TRUE, TRUE, TRUE, TRUE),
('user', 'management', 'tracks', TRUE, TRUE, TRUE, TRUE),
('user', 'management', 'accounting', TRUE, TRUE, TRUE, TRUE),
('user', 'management', 'royalties', TRUE, TRUE, TRUE, TRUE),
('user', 'management', 'analytics', TRUE, TRUE, TRUE, TRUE),
('user', 'management', 'contracts', TRUE, TRUE, TRUE, TRUE),
('user', 'management', 'settings', FALSE, TRUE, FALSE, FALSE),
-- Finance department permissions
('user', 'finance', 'dashboard', FALSE, TRUE, FALSE, FALSE),
('user', 'finance', 'artists', FALSE, TRUE, FALSE, FALSE),
('user', 'finance', 'releases', FALSE, TRUE, FALSE, FALSE),
('user', 'finance', 'tracks', FALSE, TRUE, FALSE, FALSE),
('user', 'finance', 'accounting', TRUE, TRUE, TRUE, TRUE),
('user', 'finance', 'royalties', FALSE, TRUE, FALSE, FALSE),
('user', 'finance', 'analytics', FALSE, TRUE, FALSE, FALSE),
-- A&R department permissions
('user', 'ar', 'dashboard', FALSE, TRUE, FALSE, FALSE),
('user', 'ar', 'artists', TRUE, TRUE, TRUE, FALSE),
('user', 'ar', 'releases', TRUE, TRUE, TRUE, FALSE),
('user', 'ar', 'tracks', TRUE, TRUE, TRUE, FALSE),
('user', 'ar', 'analytics', FALSE, TRUE, FALSE, FALSE),
-- Marketing department permissions
('user', 'marketing', 'dashboard', FALSE, TRUE, FALSE, FALSE),
('user', 'marketing', 'artists', FALSE, TRUE, FALSE, FALSE),
('user', 'marketing', 'releases', FALSE, TRUE, FALSE, FALSE),
('user', 'marketing', 'tracks', FALSE, TRUE, FALSE, FALSE),
('user', 'marketing', 'analytics', FALSE, TRUE, FALSE, FALSE),
-- Artist role permissions
('artist', NULL, 'dashboard', FALSE, TRUE, FALSE, FALSE),
('artist', NULL, 'artists', FALSE, TRUE, TRUE, FALSE),
('artist', NULL, 'releases', TRUE, TRUE, TRUE, FALSE),
('artist', NULL, 'tracks', TRUE, TRUE, TRUE, FALSE),
('artist', NULL, 'royalties', FALSE, TRUE, FALSE, FALSE),
('artist', NULL, 'analytics', FALSE, TRUE, FALSE, FALSE),
('artist', NULL, 'settings', FALSE, TRUE, TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- Insert default accounting categories
INSERT INTO public.accounting_categories (name, type, description) VALUES
('Royalty Payment', 'expense', 'Payments to artists'),
('Production Cost', 'expense', 'Recording and production expenses'),
('Marketing', 'expense', 'Promotional and marketing expenses'),
('Distribution', 'expense', 'Distribution platform fees'),
('Legal', 'expense', 'Legal and contract expenses'),
('Equipment', 'expense', 'Studio equipment purchases'),
('Streaming Revenue', 'income', 'Revenue from streaming platforms'),
('Download Sales', 'income', 'Revenue from digital downloads'),
('Merchandise', 'income', 'Revenue from merchandise sales'),
('Licensing', 'income', 'Revenue from sync licensing'),
('Live Performance', 'income', 'Revenue from live events')
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO public.settings (key, value, category, description) VALUES
('default_currency', '"USD"', 'general', 'Default currency for the system'),
('default_language', '"en"', 'general', 'Default language for the system'),
('default_royalty_percentage', '50', 'royalties', 'Default artist royalty percentage'),
('discord_webhook_url', '""', 'notifications', 'Discord webhook for notifications'),
('company_name', '"2NoteFireRecord"', 'general', 'Company name'),
('exchange_rate_usd_idr', '15500', 'general', 'Exchange rate USD to IDR')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_artist_id ON public.releases(artist_id);
CREATE INDEX IF NOT EXISTS idx_releases_status ON public.releases(status);
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON public.tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_release_id ON public.tracks(release_id);
CREATE INDEX IF NOT EXISTS idx_accounting_date ON public.accounting_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_royalties_artist_id ON public.royalties(artist_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics(date);
CREATE INDEX IF NOT EXISTS idx_contracts_artist_id ON public.contracts(artist_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON public.permissions(role);
