import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Disc3, Music, DollarSign, TrendingUp, FileText, Play, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { TopArtists } from '@/components/dashboard/top-artists'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch dashboard stats
  const [
    { count: artistCount },
    { count: releaseCount },
    { count: trackCount },
    { count: contractCount },
    { data: recentTransactions },
    { data: recentRoyalties },
  ] = await Promise.all([
    supabase.from('artists').select('*', { count: 'exact', head: true }),
    supabase.from('releases').select('*', { count: 'exact', head: true }),
    supabase.from('tracks').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('amount, type').limit(100),
    supabase.from('royalties').select('revenue, streams').limit(100),
  ])

  // Calculate totals
  const totalRevenue = recentTransactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalExpenses = recentTransactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalRoyalties = recentRoyalties?.reduce((sum, r) => sum + Number(r.revenue), 0) || 0
  const totalStreams = recentRoyalties?.reduce((sum, r) => sum + Number(r.streams), 0) || 0

  const stats = [
    {
      title: 'Total Artists',
      value: artistCount?.toLocaleString() || '0',
      icon: Users,
      description: 'Active roster',
      href: '/dashboard/artists',
      trend: '+12%',
    },
    {
      title: 'Releases',
      value: releaseCount?.toLocaleString() || '0',
      icon: Disc3,
      description: 'Albums & singles',
      href: '/dashboard/releases',
      trend: '+8%',
    },
    {
      title: 'Tracks',
      value: trackCount?.toLocaleString() || '0',
      icon: Music,
      description: 'Total catalog',
      href: '/dashboard/tracks',
      trend: '+24%',
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'This period',
      href: '/dashboard/accounting',
      trend: '+18%',
    },
    {
      title: 'Total Streams',
      value: totalStreams >= 1000000 
        ? `${(totalStreams / 1000000).toFixed(1)}M` 
        : totalStreams >= 1000 
          ? `${(totalStreams / 1000).toFixed(1)}K` 
          : totalStreams.toString(),
      icon: Play,
      description: 'Across platforms',
      href: '/dashboard/analytics',
      trend: '+32%',
    },
    {
      title: 'Active Contracts',
      value: contractCount?.toLocaleString() || '0',
      icon: FileText,
      description: 'Current agreements',
      href: '/dashboard/contracts',
      trend: '+5%',
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to 2NoteFireRecord</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/releases/new">New Release</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/artists/new">Add Artist</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <div className="flex items-center text-xs text-success">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {stat.trend}
                </div>
              </div>
              <Link 
                href={stat.href} 
                className="absolute inset-0 z-10"
                aria-label={`View ${stat.title}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Artists</CardTitle>
              <CardDescription>By streaming performance</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/artists">
                View all
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <TopArtists />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across the label</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/notifications">
              View all
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <RecentActivity />
        </CardContent>
      </Card>
    </div>
  )
}
