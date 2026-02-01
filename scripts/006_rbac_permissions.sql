-- RBAC Permission System for 2NoteFireRecord
-- This migration creates the full permission matrix infrastructure

-- 1. PERMISSIONS TABLE
-- Defines atomic permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  category text NOT NULL, -- menu, artist, release, finance, admin
  description text,
  created_at timestamptz DEFAULT now()
);

-- 2. ROLE_PERMISSIONS TABLE
-- Default permissions per role
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_key text REFERENCES public.permissions(key) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (role, permission_key)
);

-- 3. USER_PERMISSIONS TABLE
-- Per-user overrides (highest priority)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text REFERENCES public.permissions(key) ON DELETE CASCADE,
  allowed boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, permission_key)
);

-- 4. MENU_PERMISSIONS TABLE
-- Sidebar visibility control
CREATE TABLE IF NOT EXISTS public.menu_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key text NOT NULL,
  role text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (menu_key, role)
);

-- 5. USER_FEATURE_SETTINGS TABLE
-- Per-user feature overrides
CREATE TABLE IF NOT EXISTS public.user_feature_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key text REFERENCES public.feature_settings(feature_key) ON DELETE CASCADE,
  enabled boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions (all users can read, only admins can write)
CREATE POLICY "Anyone can view permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage permissions" ON public.permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- RLS Policies for role_permissions
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage role permissions" ON public.role_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- RLS Policies for user_permissions
CREATE POLICY "Users can view own permissions" ON public.user_permissions FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
CREATE POLICY "Only admins can manage user permissions" ON public.user_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- RLS Policies for menu_permissions
CREATE POLICY "Anyone can view menu permissions" ON public.menu_permissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage menu permissions" ON public.menu_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- RLS Policies for user_feature_settings
CREATE POLICY "Users can view own feature settings" ON public.user_feature_settings FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
CREATE POLICY "Only admins can manage user feature settings" ON public.user_feature_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- SEED DEFAULT PERMISSIONS
INSERT INTO public.permissions (key, category, description) VALUES
  -- Menu permissions
  ('menu.dashboard', 'menu', 'Access to Dashboard page'),
  ('menu.artists', 'menu', 'Access to Artists page'),
  ('menu.releases', 'menu', 'Access to Releases page'),
  ('menu.tracks', 'menu', 'Access to Tracks page'),
  ('menu.accounting', 'menu', 'Access to Accounting page'),
  ('menu.royalties', 'menu', 'Access to Royalties page'),
  ('menu.analytics', 'menu', 'Access to Analytics page'),
  ('menu.contracts', 'menu', 'Access to Contracts page'),
  ('menu.settings', 'menu', 'Access to Settings page'),
  
  -- Artist permissions
  ('artists.view', 'artist', 'View artists'),
  ('artists.view_all', 'artist', 'View all artists'),
  ('artists.view_own', 'artist', 'View own artist profile'),
  ('artists.create', 'artist', 'Create new artists'),
  ('artists.edit', 'artist', 'Edit artist information'),
  ('artists.edit_own', 'artist', 'Edit own artist profile'),
  ('artists.delete', 'artist', 'Delete artists'),
  
  -- Release permissions
  ('releases.view', 'release', 'View releases'),
  ('releases.view_all', 'release', 'View all releases'),
  ('releases.view_own', 'release', 'View own releases'),
  ('releases.create', 'release', 'Create new releases'),
  ('releases.edit', 'release', 'Edit release information'),
  ('releases.edit_own', 'release', 'Edit own releases'),
  ('releases.delete', 'release', 'Delete releases'),
  
  -- Track permissions
  ('tracks.view', 'track', 'View tracks'),
  ('tracks.view_all', 'track', 'View all tracks'),
  ('tracks.view_own', 'track', 'View own tracks'),
  ('tracks.create', 'track', 'Create new tracks'),
  ('tracks.edit', 'track', 'Edit track information'),
  ('tracks.edit_own', 'track', 'Edit own tracks'),
  ('tracks.delete', 'track', 'Delete tracks'),
  
  -- Finance permissions
  ('finance.view', 'finance', 'View financial data'),
  ('finance.accounting', 'finance', 'Access accounting module'),
  ('finance.royalties', 'finance', 'Access royalties module'),
  ('finance.create', 'finance', 'Create financial records'),
  ('finance.edit', 'finance', 'Edit financial records'),
  ('finance.delete', 'finance', 'Delete financial records'),
  
  -- Admin permissions
  ('admin.users', 'admin', 'Manage users'),
  ('admin.features', 'admin', 'Manage feature settings'),
  ('admin.permissions', 'admin', 'Manage permissions')
ON CONFLICT (key) DO NOTHING;

-- SEED DEFAULT ROLE PERMISSIONS
-- Admin role - full access
INSERT INTO public.role_permissions (role, permission_key, allowed) VALUES
  ('admin', 'menu.dashboard', true),
  ('admin', 'menu.artists', true),
  ('admin', 'menu.releases', true),
  ('admin', 'menu.tracks', true),
  ('admin', 'menu.accounting', true),
  ('admin', 'menu.royalties', true),
  ('admin', 'menu.analytics', true),
  ('admin', 'menu.contracts', true),
  ('admin', 'menu.settings', true),
  ('admin', 'artists.view_all', true),
  ('admin', 'artists.create', true),
  ('admin', 'artists.edit', true),
  ('admin', 'artists.delete', true),
  ('admin', 'releases.view_all', true),
  ('admin', 'releases.create', true),
  ('admin', 'releases.edit', true),
  ('admin', 'releases.delete', true),
  ('admin', 'tracks.view_all', true),
  ('admin', 'tracks.create', true),
  ('admin', 'tracks.edit', true),
  ('admin', 'tracks.delete', true),
  ('admin', 'finance.accounting', true),
  ('admin', 'finance.royalties', true),
  ('admin', 'finance.create', true),
  ('admin', 'finance.edit', true),
  ('admin', 'admin.users', true),
  ('admin', 'admin.features', true),
  ('admin', 'admin.permissions', true)
ON CONFLICT (role, permission_key) DO NOTHING;

-- User role - standard access (no accounting)
INSERT INTO public.role_permissions (role, permission_key, allowed) VALUES
  ('user', 'menu.dashboard', true),
  ('user', 'menu.artists', true),
  ('user', 'menu.releases', true),
  ('user', 'menu.tracks', true),
  ('user', 'menu.analytics', true),
  ('user', 'menu.settings', true),
  ('user', 'artists.view_all', true),
  ('user', 'artists.create', true),
  ('user', 'artists.edit', true),
  ('user', 'releases.view_all', true),
  ('user', 'releases.create', true),
  ('user', 'releases.edit', true),
  ('user', 'tracks.view_all', true),
  ('user', 'tracks.create', true),
  ('user', 'tracks.edit', true)
ON CONFLICT (role, permission_key) DO NOTHING;

-- Artist role - RESTRICTED access (only own content)
INSERT INTO public.role_permissions (role, permission_key, allowed) VALUES
  ('artist', 'menu.releases', true),
  ('artist', 'menu.tracks', true),
  ('artist', 'menu.settings', true),
  ('artist', 'artists.view_own', true),
  ('artist', 'artists.edit_own', true),
  ('artist', 'releases.view_own', true),
  ('artist', 'releases.edit_own', true),
  ('artist', 'tracks.view_own', true),
  ('artist', 'tracks.edit_own', true)
ON CONFLICT (role, permission_key) DO NOTHING;

-- Finance role - ONLY accounting access
INSERT INTO public.role_permissions (role, permission_key, allowed) VALUES
  ('finance', 'menu.accounting', true),
  ('finance', 'finance.accounting', true),
  ('finance', 'finance.create', true),
  ('finance', 'finance.edit', true)
ON CONFLICT (role, permission_key) DO NOTHING;

-- SEED DEFAULT MENU PERMISSIONS
INSERT INTO public.menu_permissions (menu_key, role, visible) VALUES
  -- Admin sees all
  ('dashboard', 'admin', true),
  ('artists', 'admin', true),
  ('releases', 'admin', true),
  ('tracks', 'admin', true),
  ('accounting', 'admin', true),
  ('royalties', 'admin', true),
  ('analytics', 'admin', true),
  ('contracts', 'admin', true),
  ('notifications', 'admin', true),
  ('settings', 'admin', true),
  
  -- User sees most (no accounting)
  ('dashboard', 'user', true),
  ('artists', 'user', true),
  ('releases', 'user', true),
  ('tracks', 'user', true),
  ('royalties', 'user', true),
  ('analytics', 'user', true),
  ('contracts', 'user', false),
  ('notifications', 'user', true),
  ('settings', 'user', true),
  
  -- Artist sees ONLY their content
  ('dashboard', 'artist', false),
  ('artists', 'artist', false),
  ('releases', 'artist', true),
  ('tracks', 'artist', true),
  ('accounting', 'artist', false),
  ('royalties', 'artist', false),
  ('analytics', 'artist', false),
  ('contracts', 'artist', false),
  ('notifications', 'artist', false),
  ('settings', 'artist', true),
  
  -- Finance sees ONLY accounting
  ('dashboard', 'finance', false),
  ('artists', 'finance', false),
  ('releases', 'finance', false),
  ('tracks', 'finance', false),
  ('accounting', 'finance', true),
  ('royalties', 'finance', false),
  ('analytics', 'finance', false),
  ('contracts', 'finance', false),
  ('notifications', 'finance', false),
  ('settings', 'finance', false)
ON CONFLICT (menu_key, role) DO UPDATE 
  SET visible = EXCLUDED.visible;

-- Create helper function to check permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id uuid,
  p_permission_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_user_override boolean;
  v_role_permission boolean;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check user-specific override first (highest priority)
  SELECT allowed INTO v_user_override 
  FROM public.user_permissions 
  WHERE user_id = p_user_id AND permission_key = p_permission_key;
  
  IF v_user_override IS NOT NULL THEN
    RETURN v_user_override;
  END IF;
  
  -- Check role permission
  SELECT allowed INTO v_role_permission 
  FROM public.role_permissions 
  WHERE role = v_role AND permission_key = p_permission_key;
  
  IF v_role_permission IS NOT NULL THEN
    RETURN v_role_permission;
  END IF;
  
  -- Default deny
  RETURN false;
END;
$$;

-- Create helper function to get user menu visibility
CREATE OR REPLACE FUNCTION public.get_user_menu_visibility(
  p_user_id uuid,
  p_menu_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_visible boolean;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check menu visibility for role
  SELECT visible INTO v_visible 
  FROM public.menu_permissions 
  WHERE menu_key = p_menu_key AND role = v_role;
  
  -- Default to false if not found
  RETURN COALESCE(v_visible, false);
END;
$$;
