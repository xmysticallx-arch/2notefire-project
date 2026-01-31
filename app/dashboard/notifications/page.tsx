import React from "react"
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  CheckCheck, 
  Disc3, 
  Users, 
  FileText, 
  DollarSign,
  Music,
  AlertCircle,
  Info,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

const typeIcons: Record<string, React.ElementType> = {
  release: Disc3,
  artist: Users,
  contract: FileText,
  payment: DollarSign,
  track: Music,
  alert: AlertCircle,
  info: Info,
  success: CheckCircle,
}

const typeColors: Record<string, string> = {
  release: 'bg-chart-1/10 text-chart-1',
  artist: 'bg-chart-2/10 text-chart-2',
  contract: 'bg-chart-3/10 text-chart-3',
  payment: 'bg-success/10 text-success',
  track: 'bg-chart-4/10 text-chart-4',
  alert: 'bg-destructive/10 text-destructive',
  info: 'bg-chart-2/10 text-chart-2',
  success: 'bg-success/10 text-success',
}

// Sample notifications - in production these would come from the database
const sampleNotifications: Notification[] = [
  {
    id: '1',
    user_id: null,
    title: 'New Release Published',
    message: 'FireStorm\'s album "Eternal Flames" is now live on all platforms.',
    type: 'release',
    read: false,
    link: '/dashboard/releases/1',
    metadata: {},
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: null,
    title: 'Artist Contract Signed',
    message: 'Nova Beats has signed their recording contract.',
    type: 'contract',
    read: false,
    link: '/dashboard/contracts/2',
    metadata: {},
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    user_id: null,
    title: 'Royalty Payment Processed',
    message: 'Q4 royalties of $12,500 have been distributed to 8 artists.',
    type: 'payment',
    read: true,
    link: '/dashboard/royalties',
    metadata: {},
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    user_id: null,
    title: 'Track Approved',
    message: '"Summer Heat" by Blaze Runner has been approved for release.',
    type: 'track',
    read: true,
    link: '/dashboard/tracks/4',
    metadata: {},
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    user_id: null,
    title: 'Contract Expiring Soon',
    message: 'Echo Wave\'s distribution agreement expires in 30 days.',
    type: 'alert',
    read: true,
    link: '/dashboard/contracts/5',
    metadata: {},
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default async function NotificationsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch notifications from database
  const { data: dbNotifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  // Use sample notifications if none in database
  const notifications = dbNotifications?.length ? dbNotifications : sampleNotifications

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up'}
          </p>
        </div>
        <Button variant="outline">
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {['all', 'unread'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {notifications.length > 0 ? (
                  <div className="divide-y">
                    {notifications
                      .filter(n => tab === 'all' || !n.read)
                      .map((notification) => {
                        const Icon = typeIcons[notification.type] || Info
                        return (
                          <div 
                            key={notification.id}
                            className={cn(
                              'flex items-start gap-4 p-4 transition-colors hover:bg-muted/50',
                              !notification.read && 'bg-muted/30'
                            )}
                          >
                            <div className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                              typeColors[notification.type] || 'bg-muted text-muted-foreground'
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className={cn(
                                  'text-sm',
                                  !notification.read && 'font-medium'
                                )}>
                                  {notification.title}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      You&apos;re all caught up! Check back later.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
