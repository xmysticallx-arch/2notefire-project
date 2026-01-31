import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Disc3, Calendar, Music } from 'lucide-react'
import Link from 'next/link'
import type { Release } from '@/lib/types'

export default async function ArtistReleasesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('id, name, stage_name')
    .eq('id', id)
    .single()

  if (artistError || !artist) {
    notFound()
  }

  const { data: releases } = await supabase
    .from('releases')
    .select('*')
    .eq('artist_id', id)
    .order('release_date', { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success/10 text-success border-success/20'
      case 'approved':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'review':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'draft':
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/artists/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {artist.stage_name || artist.name}&apos;s Releases
            </h1>
            <p className="text-muted-foreground">Manage albums and singles</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/artists/${id}/releases/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Release
          </Link>
        </Button>
      </div>

      {releases && releases.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {releases.map((release: Release) => (
            <Card key={release.id} className="overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {release.cover_art_url ? (
                  <img
                    src={release.cover_art_url || "/placeholder.svg"}
                    alt={release.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Disc3 className="h-16 w-16 text-primary/50" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{release.title}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{release.release_type}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(release.status)}>
                    {release.status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {release.release_date
                        ? new Date(release.release_date).toLocaleDateString()
                        : 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Music className="h-4 w-4" />
                    <span>{release.total_tracks || 0} tracks</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/dashboard/artists/${id}/releases/${release.id}`}>
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <Link href={`/dashboard/artists/${id}/releases/${release.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Disc3 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No releases yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating a new release for this artist.
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/dashboard/artists/${id}/releases/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Release
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
