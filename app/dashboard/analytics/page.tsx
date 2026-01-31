'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  Globe, 
  Music,
  Play,
  Download,
} from 'lucide-react'

// Sample data - in production this would come from Supabase
const streamingData = [
  { month: 'Jan', streams: 45000, downloads: 1200 },
  { month: 'Feb', streams: 52000, downloads: 1400 },
  { month: 'Mar', streams: 48000, downloads: 1100 },
  { month: 'Apr', streams: 61000, downloads: 1600 },
  { month: 'May', streams: 55000, downloads: 1300 },
  { month: 'Jun', streams: 67000, downloads: 1800 },
  { month: 'Jul', streams: 72000, downloads: 2100 },
  { month: 'Aug', streams: 78000, downloads: 2400 },
  { month: 'Sep', streams: 85000, downloads: 2800 },
  { month: 'Oct', streams: 92000, downloads: 3100 },
  { month: 'Nov', streams: 98000, downloads: 3500 },
  { month: 'Dec', streams: 105000, downloads: 3800 },
]

const platformData = [
  { name: 'Spotify', value: 45, color: 'var(--chart-2)' },
  { name: 'Apple Music', value: 25, color: 'var(--chart-1)' },
  { name: 'YouTube Music', value: 15, color: 'var(--destructive)' },
  { name: 'Amazon Music', value: 10, color: 'var(--warning)' },
  { name: 'Others', value: 5, color: 'var(--muted)' },
]

const geographicData = [
  { country: 'United States', streams: 320000, percentage: 35 },
  { country: 'United Kingdom', streams: 180000, percentage: 20 },
  { country: 'Germany', streams: 120000, percentage: 13 },
  { country: 'Canada', streams: 90000, percentage: 10 },
  { country: 'France', streams: 70000, percentage: 8 },
  { country: 'Australia', streams: 60000, percentage: 7 },
  { country: 'Others', streams: 60000, percentage: 7 },
]

const demographicData = [
  { age: '13-17', male: 8, female: 12 },
  { age: '18-24', male: 25, female: 28 },
  { age: '25-34', male: 22, female: 20 },
  { age: '35-44', male: 12, female: 10 },
  { age: '45-54', male: 5, female: 4 },
  { age: '55+', male: 2, female: 2 },
]

export default function AnalyticsPage() {
  const totalStreams = streamingData.reduce((sum, d) => sum + d.streams, 0)
  const totalDownloads = streamingData.reduce((sum, d) => sum + d.downloads, 0)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Streaming performance and audience insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Streams
            </CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStreams)}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +24% from last year
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Downloads
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalDownloads)}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +18% from last year
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Listeners
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125K</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              +32% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Countries Reached
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">Active markets</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="streams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="streams">Streams</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Streaming Performance</CardTitle>
              <CardDescription>Monthly streams and downloads over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={streamingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                      }}
                      formatter={(value: number) => [formatNumber(value), '']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="streams" 
                      name="Streams"
                      stroke="var(--chart-1)" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="downloads" 
                      name="Downloads"
                      stroke="var(--chart-2)" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>Streams by streaming service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                        }}
                        formatter={(value: number) => [`${value}%`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Platform Breakdown</CardTitle>
                <CardDescription>Percentage of total streams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformData.map((platform) => (
                    <div key={platform.name} className="flex items-center gap-4">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: platform.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{platform.name}</span>
                          <span className="text-sm text-muted-foreground">{platform.value}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${platform.value}%`,
                              backgroundColor: platform.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Markets</CardTitle>
              <CardDescription>Streams by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geographicData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis 
                      type="number"
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <YAxis 
                      type="category"
                      dataKey="country"
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                      }}
                      formatter={(value: number) => [formatNumber(value), 'Streams']}
                    />
                    <Bar 
                      dataKey="streams" 
                      fill="var(--chart-1)" 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audience Demographics</CardTitle>
              <CardDescription>Listener age and gender distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographicData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis 
                      dataKey="age" 
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                    <Bar 
                      dataKey="male" 
                      name="Male"
                      fill="var(--chart-3)" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey="female" 
                      name="Female"
                      fill="var(--chart-1)" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
