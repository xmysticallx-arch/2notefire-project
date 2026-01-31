import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DollarSign, 
  Play, 
  Download,
  TrendingUp,
  Music2,
  CreditCard,
  Clock,
  CheckCircle,
} from 'lucide-react'
import type { Royalty } from '@/lib/types'

const platformColors: Record<string, string> = {
  spotify: 'bg-chart-2',
  apple_music: 'bg-chart-1',
  youtube: 'bg-destructive',
  amazon: 'bg-warning',
  deezer: 'bg-chart-3',
  tidal: 'bg-chart-4',
}

export default async function RoyaltiesPage() {
  const supabase = await createClient()
  
  const { data: royalties, error } = await supabase
    .from('royalties')
    .select('*, artist:artists(id, name, stage_name), track:tracks(id, title)')
    .order('created_at', { ascending: false })

  // Calculate totals
  const totalRevenue = royalties?.reduce((sum, r) => sum + Number(r.revenue), 0) || 0
  const totalStreams = royalties?.reduce((sum, r) => sum + Number(r.streams), 0) || 0
  const pendingPayouts = royalties?.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.revenue), 0) || 0
  const paidRoyalties = royalties?.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.revenue), 0) || 0

  // Group by platform for summary
  const platformSummary = royalties?.reduce((acc, r) => {
    const platform = r.platform
    if (!acc[platform]) {
      acc[platform] = { streams: 0, revenue: 0 }
    }
    acc[platform].streams += Number(r.streams)
    acc[platform].revenue += Number(r.revenue)
    return acc
  }, {} as Record<string, { streams: number; revenue: number }>)

  const maxPlatformStreams = Math.max(...Object.values(platformSummary || {}).map(p => p.streams), 1)

  const formatStreams = (streams: number) => {
    if (streams >= 1000000) return `${(streams / 1000000).toFixed(1)}M`
    if (streams >= 1000) return `${(streams / 1000).toFixed(0)}K`
    return streams.toString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20'
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'processing':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Royalties</h1>
          <p className="text-muted-foreground">Track streaming revenue and artist payouts</p>
        </div>
        <Button>
          <DollarSign className="mr-2 h-4 w-4" />
          Process Payouts
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +18% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Streams
            </CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStreams(totalStreams)}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +32% from last period
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payouts
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">${pendingPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Out
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${paidRoyalties.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>Streams by streaming service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(platformSummary || {}).map(([platform, data]) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{platform.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">{formatStreams(data.streams)}</span>
                  </div>
                  <Progress 
                    value={(data.streams / maxPlatformStreams) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              {(!platformSummary || Object.keys(platformSummary).length === 0) && (
                <p className="text-center text-muted-foreground py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Royalties Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Royalties</CardTitle>
            <CardDescription>Latest royalty reports and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-destructive">
                Error loading royalties: {error.message}
              </div>
            ) : royalties && royalties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artist / Track</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Streams</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {royalties.slice(0, 10).map((royalty: Royalty & { artist?: { name: string; stage_name: string | null }; track?: { title: string } }) => (
                    <TableRow key={royalty.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {royalty.artist?.stage_name || royalty.artist?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {royalty.track?.title || 'All tracks'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {royalty.platform.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{formatStreams(royalty.streams)}</TableCell>
                      <TableCell>${Number(royalty.revenue).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(royalty.status)}>
                          {royalty.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No royalties yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Royalty data will appear here once your music starts streaming.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
