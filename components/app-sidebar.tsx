'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Users, 
  Disc3, 
  Music, 
  DollarSign, 
  BarChart3, 
  FileText, 
  Settings, 
  Bell,
  Flame,
  LogOut,
  User,
  ChevronUp,
  CreditCard,
  TrendingUp,
  Calculator,
  Shield,
  Cloud,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface AppSidebarProps {
  profile: Profile | null
}

interface NavItem {
  title: string
  icon: React.ElementType
  href: string
  featureKey?: string
  roles?: string[]
}

// Default nav items with role restrictions
const mainNavItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', featureKey: 'dashboard', roles: ['admin', 'user', 'artist'] },
  { title: 'Artists', icon: Users, href: '/dashboard/artists', featureKey: 'artists', roles: ['admin', 'user'] },
  { title: 'Releases', icon: Disc3, href: '/dashboard/releases', featureKey: 'releases', roles: ['admin', 'user', 'artist'] },
  { title: 'Tracks', icon: Music, href: '/dashboard/tracks', featureKey: 'tracks', roles: ['admin', 'user', 'artist'] },
]

const financeNavItems: NavItem[] = [
  { title: 'Accounting', icon: Calculator, href: '/dashboard/accounting', featureKey: 'accounting', roles: ['admin'] },
  { title: 'Royalties', icon: DollarSign, href: '/dashboard/royalties', featureKey: 'royalties', roles: ['admin', 'artist'] },
]

const managementNavItems: NavItem[] = [
  { title: 'Analytics', icon: TrendingUp, href: '/dashboard/analytics', featureKey: 'analytics', roles: ['admin', 'user'] },
  { title: 'Contracts', icon: FileText, href: '/dashboard/contracts', featureKey: 'contracts', roles: ['admin'] },
]

const systemNavItems: NavItem[] = [
  { title: 'Notifications', icon: Bell, href: '/dashboard/notifications', featureKey: 'notifications', roles: ['admin', 'user', 'artist'] },
  { title: 'Settings', icon: Settings, href: '/dashboard/settings', featureKey: 'settings', roles: ['admin', 'user', 'artist'] },
]

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const userRole = profile?.role || 'user'

  // Filter nav items based on user role
  const filterByRole = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true
      return item.roles.includes(userRole)
    })
  }

  const filteredMainNav = filterByRole(mainNavItems)
  const filteredFinanceNav = filterByRole(financeNavItems)
  const filteredManagementNav = filterByRole(managementNavItems)
  const filteredSystemNav = filterByRole(systemNavItems)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-foreground">
                  <Image
                    src="/logo.png"
                    alt="2NoteFireRecord"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">2NoteFireRecord</span>
                  <span className="text-xs text-sidebar-foreground/70">Label Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredFinanceNav.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Finance</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredFinanceNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {filteredManagementNav.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredManagementNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSystemNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile?.full_name || 'User'}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">{profile?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isCollapsed ? 'right' : 'top'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">{profile?.full_name || 'User'}</span>
                        <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0">
                          {userRole}
                        </Badge>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings/profile" className="cursor-pointer">
                    <User className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {userRole === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings/drive" className="cursor-pointer">
                        <Cloud className="mr-2 size-4" />
                        Google Drive
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings/features" className="cursor-pointer">
                        <Shield className="mr-2 size-4" />
                        Feature Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings/users" className="cursor-pointer">
                        <Users className="mr-2 size-4" />
                        User Management
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
