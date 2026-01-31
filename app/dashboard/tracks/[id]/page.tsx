'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save, Trash2, Music, Clock, User, Disc3 } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { AudioPlayer } from '@/components/audio-player'
import type { Artist, Release } from '@/lib/types'

interface TrackData {
  id: string
  title: string
  artist_id: string | null
  release_id: string | null
  track_number: number | null
  duration_seconds: number | null
  isrc_code: string | null
  status: string
  explicit_content: boolean
  composers: string[]
  producers: string[]
  lyrics: string | null
  audio_file_url: string | null
  audio_file_id: string | null
  created_at: string
  artist?: { name: string; stage_name: string | null }
  release?: { title: string }
}

export default function TrackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [track, setTrack] = useState<TrackData | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [formData, setFormData] = useState({
    title: '',
    artist_id: '',
    release_id: '',
    track_number: '',
    duration_seconds: '',
    isrc_code: '',
    status: 'pending',
    explicit_content: false,
    composers: '',
    producers: '',
    lyrics: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      const [trackRes, artistsRes, releasesRes] = await Promise.all([
        supabase
          .from('tracks')
          .select('*, artist:artists(name, stage_name), release:releases(title)')
          .eq('id', id)
          .single(),
        supabase.from('artists').select('*').order('name'),
        supabase.from('releases').select('*').order('title'),
      ])

      if (trackRes.error || !trackRes.data) {
        setError('Track not found')
        setIsLoading(false)
        return
      }

      setTrack(trackRes.data as TrackData)
      if (artistsRes.data) setArtists(artistsRes.data)
      if (releasesRes.data) setReleases(releasesRes.data)

      setFormData({
        title: trackRes.data.title || '',
        artist_id: trackRes.data.artist_id || '',
        release_id: trackRes.data.release_id || '',
        track_number: trackRes.data.track_number?.toString() || '',
        duration_seconds: trackRes.data.duration_seconds?.toString() || '',
        isrc_code: trackRes.data.isrc_code || '',
        status: trackRes.data.status || 'pending',
        explicit_content: trackRes.data.explicit_content || false,
        composers: trackRes.data.composers?.join(', ') || '',
        producers: trackRes.data.producers?.join(', ') || '',
        lyrics: trackRes.data.lyrics || '',
      })

      setIsLoading(false)
    }

    fetchData()
  }, [id])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tracks')
        .update({
          title: formData.title,
          artist_id: formData.artist_id || null,
          release_id: formData.release_id || null,
          track_number: formData.track_number ? parseInt(formData.track_number) : null,
          duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : null,
          isrc_code: formData.isrc_code || null,
          status: formData.status,
          explicit_content: formData.explicit_content,
          composers: formData.composers ? formData.composers.split(',').map(s => s.trim()) : [],
          producers: formData.producers ? formData.producers.split(',').map(s => s.trim()) : [],
          lyrics: formData.lyrics || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Refresh track data
      const { data: updatedTrack } = await supabase
        .from('tracks')
        .select('*, artist:artists(name, stage_name), release:releases(title)')
        .eq('id', id)
        .single()

      if (updatedTrack) {
        setTrack(updatedTrack as TrackData)
      }

      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('tracks').delete().eq('id', id)

      if (error) throw error

      router.push('/dashboard/tracks')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete track')
      setIsSaving(false)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20'
      case 'review':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !track) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      </div>
    )
  }

  if (!track) return null

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/tracks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{track.title}</h1>
            <p className="text-muted-foreground">
              {track.artist?.stage_name || track.artist?.name || 'Unknown Artist'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Audio Player */}
        {track.audio_file_url && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Audio Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioPlayer
                src={track.audio_file_url}
                title={track.title}
                artist={track.artist?.stage_name || track.artist?.name}
              />
            </CardContent>
          </Card>
        )}

        {/* Track Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Track Details</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit track information' : 'View track metadata'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Select
                    value={formData.artist_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, artist_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select artist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No artist</SelectItem>
                      {artists.map((artist) => (
                        <SelectItem key={artist.id} value={artist.id}>
                          {artist.stage_name || artist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="release">Release</Label>
                  <Select
                    value={formData.release_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, release_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select release" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No release</SelectItem>
                      {releases.map((release) => (
                        <SelectItem key={release.id} value={release.id}>
                          {release.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="track_number">Track Number</Label>
                  <Input
                    id="track_number"
                    type="number"
                    value={formData.track_number}
                    onChange={(e) => setFormData({ ...formData, track_number: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="isrc">ISRC Code</Label>
                  <Input
                    id="isrc"
                    value={formData.isrc_code}
                    onChange={(e) => setFormData({ ...formData, isrc_code: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="explicit"
                    checked={formData.explicit_content}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, explicit_content: checked as boolean })
                    }
                  />
                  <Label htmlFor="explicit">Explicit content</Label>
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="composers">Composers</Label>
                  <Input
                    id="composers"
                    value={formData.composers}
                    onChange={(e) => setFormData({ ...formData, composers: e.target.value })}
                    placeholder="Comma separated"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="producers">Producers</Label>
                  <Input
                    id="producers"
                    value={formData.producers}
                    onChange={(e) => setFormData({ ...formData, producers: e.target.value })}
                    placeholder="Comma separated"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="lyrics">Lyrics</Label>
                  <Textarea
                    id="lyrics"
                    value={formData.lyrics}
                    onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                    rows={6}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{track.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Artist</p>
                    <p className="font-medium">
                      {track.artist?.stage_name || track.artist?.name || 'Not assigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Disc3 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Release</p>
                    <p className="font-medium">{track.release?.title || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(track.duration_seconds)}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant="outline" className={getStatusColor(track.status)}>
                    {track.status}
                  </Badge>
                  {track.explicit_content && (
                    <Badge variant="outline" className="ml-2">Explicit</Badge>
                  )}
                </div>
                {track.isrc_code && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">ISRC Code</p>
                    <p className="font-mono text-sm">{track.isrc_code}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits */}
        <Card>
          <CardHeader>
            <CardTitle>Credits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Composers</p>
              {track.composers?.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {track.composers.map((composer, i) => (
                    <Badge key={i} variant="secondary">{composer}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None listed</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Producers</p>
              {track.producers?.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {track.producers.map((producer, i) => (
                    <Badge key={i} variant="secondary">{producer}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None listed</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lyrics */}
        {track.lyrics && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Lyrics</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap font-sans text-sm">{track.lyrics}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
