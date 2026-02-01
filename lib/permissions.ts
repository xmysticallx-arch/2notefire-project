'use server'

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export type Permission = {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

export type UserRole = 'admin' | 'user' | 'artist' | 'finance'

export type UserPermissions = {
  role: UserRole
  permissions: string[]
  features: string[]
  canAccessRoute: (route: string) => boolean
  hasPermission: (permission: string) => boolean
  hasFeature: (feature: string) => boolean
}

/**
 * Get the current user's role from their profile
 */
export const getCurrentUserRole = cache(async (): Promise<UserRole> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return 'user' // Default role for unauthenticated
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return (profile?.role as UserRole) || 'user'
})

/**
 * Get all permissions for a specific role
 */
export const getRolePermissions = cache(async (role: UserRole): Promise<string[]> => {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('role_permissions')
    .select('permission:permissions(name)')
    .eq('role', role)
  
  if (!data) return []
  
  return data
    .map(item => (item.permission as any)?.name)
    .filter(Boolean) as string[]
})

/**
 * Get user-specific permission overrides
 */
export const getUserSpecificPermissions = cache(async (userId: string): Promise<{
  granted: string[]
  denied: string[]
}> => {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_permissions')
    .select('permission:permissions(name), granted')
    .eq('user_id', userId)
  
  if (!data) return { granted: [], denied: [] }
  
  const granted = data
    .filter(item => item.granted)
    .map(item => (item.permission as any)?.name)
    .filter(Boolean) as string[]
  
  const denied = data
    .filter(item => !item.granted)
    .map(item => (item.permission as any)?.name)
    .filter(Boolean) as string[]
  
  return { granted, denied }
})

/**
 * Get enabled features for a user
 */
export const getUserFeatures = cache(async (userId: string, role: UserRole): Promise<string[]> => {
  const supabase = await createClient()
  
  // Get role-based features
  const { data: roleFeatures } = await supabase
    .from('feature_settings')
    .select('feature_key')
    .eq('enabled', true)
    .contains('visible_to_roles', [role])
  
  const baseFeaturesSet = new Set(roleFeatures?.map(f => f.feature_key) || [])
  
  // Get user-specific feature overrides
  const { data: userFeatures } = await supabase
    .from('user_feature_settings')
    .select('feature_key, enabled')
    .eq('user_id', userId)
  
  // Apply user overrides
  userFeatures?.forEach(override => {
    if (override.enabled) {
      baseFeaturesSet.add(override.feature_key)
    } else {
      baseFeaturesSet.delete(override.feature_key)
    }
  })
  
  return Array.from(baseFeaturesSet)
})

/**
 * Get menu items (sidebar) that user has access to
 */
export const getUserMenuItems = cache(async (userId: string, role: UserRole) => {
  const supabase = await createClient()
  
  const { data: features } = await supabase
    .from('feature_settings')
    .select('*')
    .eq('enabled', true)
    .contains('visible_to_roles', [role])
    .order('sidebar_order', { ascending: true })
  
  if (!features) return []
  
  // Apply user-specific overrides
  const { data: userOverrides } = await supabase
    .from('user_feature_settings')
    .select('feature_key, enabled')
    .eq('user_id', userId)
  
  const overridesMap = new Map(
    userOverrides?.map(o => [o.feature_key, o.enabled]) || []
  )
  
  return features.filter(feature => {
    const override = overridesMap.get(feature.feature_key)
    return override !== undefined ? override : true
  })
})

/**
 * Main function to get complete user permissions
 */
export const getUserPermissions = cache(async (): Promise<UserPermissions> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      role: 'user',
      permissions: [],
      features: [],
      canAccessRoute: () => false,
      hasPermission: () => false,
      hasFeature: () => false,
    }
  }
  
  const role = await getCurrentUserRole()
  const rolePermissions = await getRolePermissions(role)
  const { granted, denied } = await getUserSpecificPermissions(user.id)
  const features = await getUserFeatures(user.id, role)
  
  // Merge permissions: role permissions + granted - denied
  const allPermissions = new Set([...rolePermissions, ...granted])
  denied.forEach(p => allPermissions.delete(p))
  
  const permissionsArray = Array.from(allPermissions)
  
  return {
    role,
    permissions: permissionsArray,
    features,
    canAccessRoute: (route: string) => {
      // Admin can access everything
      if (role === 'admin') return true
      
      // Check if route is in user's enabled features
      const routeParts = route.split('/').filter(Boolean)
      if (routeParts[0] === 'dashboard' && routeParts.length > 1) {
        const featureKey = routeParts[1]
        return features.includes(featureKey)
      }
      
      return true // Allow public routes
    },
    hasPermission: (permission: string) => {
      return role === 'admin' || permissionsArray.includes(permission)
    },
    hasFeature: (feature: string) => {
      return role === 'admin' || features.includes(feature)
    },
  }
})

/**
 * Check if user has a specific permission
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const perms = await getUserPermissions()
  return perms.hasPermission(permission)
}

/**
 * Check if user has access to a feature
 */
export async function checkFeature(feature: string): Promise<boolean> {
  const perms = await getUserPermissions()
  return perms.hasFeature(feature)
}

/**
 * Check if user can access a route
 */
export async function checkRoute(route: string): Promise<boolean> {
  const perms = await getUserPermissions()
  return perms.canAccessRoute(route)
}

/**
 * Middleware helper to protect routes
 */
export async function requirePermission(permission: string): Promise<void> {
  const hasAccess = await checkPermission(permission)
  if (!hasAccess) {
    throw new Error('Insufficient permissions')
  }
}

/**
 * Middleware helper to protect features
 */
export async function requireFeature(feature: string): Promise<void> {
  const hasAccess = await checkFeature(feature)
  if (!hasAccess) {
    throw new Error('Feature not available')
  }
}

/**
 * Get permission-filtered menu for sidebar
 */
export async function getPermissionFilteredMenu() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const role = await getCurrentUserRole()
  return getUserMenuItems(user.id, role)
}
