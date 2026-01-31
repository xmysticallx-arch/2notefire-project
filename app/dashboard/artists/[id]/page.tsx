import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Music, 
  Disc3, 
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import type { Artist, Release, Track } from '@/lib/types'

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !artist) {
    notFound()
  }

  // Fetch artist's releases and tracks
  const [
    { data: releases },
    { data: tracks },
    { data: royalties },
  ] = await Promise.all([
    supabase.from('releases').select('*').eq('artist_id', id).order('created_at', { ascending: false }).limit(5),
    supabase.from('tracks').select('*').eq('artist_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('royalties').select('revenue, streams').eq('artist_id', id),
  ])

  const totalRevenue = royalties?.reduce((sum, r) => sum + Number(r.revenue), 0) || 0
  const totalStreams = royalties?.reduce((sum, r) => sum + Number(r.streams), 0) || 0

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20'
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border'
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const formatStreams = (streams: number) => {
    if (streams >= 1000000) return `${(streams / 1000000).toFixed(1)}M`
    if (streams >= 1000) return `${(streams / 1000).toFixed(0)}K`
    return streams.toString()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/artists">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{artist.stage_name || artist.name}</h1>
            <p className="text-muted-foreground">Artist Profile</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/artists/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Artist
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Artist Profile Card */}
        <Card className="lg:row-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={artist.image_url || ''} alt={artist.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(artist.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{artist.stage_name || artist.name}</h2>
              {artist.stage_name && (
                <p className="text-sm text-muted-foreground">{artist.name}</p>
              )}
              <Badge variant="outline" className={`mt-2 ${getStatusColor(artist.contract_status)}`}>
                {artist.contract_status}
              </Badge>
              <p className="mt-2 text-sm text-muted-foreground">{artist.genre || 'No genre set'}</p>
            </div>

            <div className="mt-6 space-y-4">
              {artist.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{artist.email}</span>
                </div>
              )}
              {artist.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{artist.phone}</span>
                </div>
              )}
              {artist.country && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{artist.country}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(artist.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {artist.bio && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Biography</h3>
                <p className="text-sm text-muted-foreground">{artist.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Streams
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatStreams(totalStreams)}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Lifetime earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Releases
              </CardTitle>
              <Disc3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{releases?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Albums & singles</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tracks
              </CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tracks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">In catalog</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Releases and Tracks */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="releases" className="w-full">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="releases">Releases</TabsTrigger>
                <TabsTrigger value="tracks">Tracks</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="releases" className="mt-0">
                {releases && releases.length > 0 ? (
                  <div className="space-y-4">
                    {releases.map((release: Release) => (
                      <div key={release.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <Disc3 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{release.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {release.release_type} • {release.release_date ? new Date(release.release_date).toLocaleDateString() : 'TBD'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{release.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No releases yet</p>
                )}
              </TabsContent>
              <TabsContent value="tracks" className="mt-0">
                {tracks && tracks.length > 0 ? (
                  <div className="space-y-2">
                    {tracks.map((track: Track, index: number) => (
                      <div key={track.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-sm text-muted-foreground">{index + 1}</span>
                          <div>
                            <p className="font-medium">{track.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {track.duration_seconds ? `${Math.floor(track.duration_seconds / 60)}:${(track.duration_seconds % 60).toString().padStart(2, '0')}` : '--:--'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{track.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No tracks yet</p>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
