"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, Trash2, Music, Disc3 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Release, Track, Artist } from "@/lib/types"

export default function ArtistReleaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [release, setRelease] = useState<Release | null>(null)
  const [artist, setArtist] = useState<Artist | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const [releaseRes, artistRes] = await Promise.all([
        supabase.from("releases").select("*").eq("id", params.releaseId).single(),
        supabase.from("artists").select("*").eq("id", params.id).single(),
      ])

      if (releaseRes.data) {
        setRelease(releaseRes.data as Release)
        
        const { data: tracksData } = await supabase
          .from("tracks")
          .select("*")
          .eq("release_id", params.releaseId)
          .order("track_number", { ascending: true })
        
        if (tracksData) setTracks(tracksData as Track[])
      }
      if (artistRes.data) setArtist(artistRes.data as Artist)
      setLoading(false)
    }

    fetchData()
  }, [params.id, params.releaseId])

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("releases").delete().eq("id", params.releaseId)
    if (!error) {
      router.push(`/dashboard/artists/${params.id}/releases`)
    } else {
      alert("Failed to delete release")
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "approved": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "review": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!release) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Release not found</p>
        <Link href={`/dashboard/artists/${params.id}/releases`}>
          <Button variant="link">Back to Releases</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/artists/${params.id}/releases`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{release.title}</h1>
            <p className="text-muted-foreground">{artist?.stage_name || artist?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/artists/${params.id}/releases/${params.releaseId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Release</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{release.title}"? This will also delete all associated tracks.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
              {release.cover_art_url ? (
                <Image
                  src={release.cover_art_url || "/placeholder.svg"}
                  alt={release.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Disc3 className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={getStatusColor(release.status)}>{release.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-medium capitalize">{release.release_type}</span>
              </div>
              {release.release_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Release Date</span>
                  <span className="text-sm font-medium">
                    {new Date(release.release_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {release.upc_code && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">UPC</span>
                  <span className="text-sm font-mono">{release.upc_code}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Tracks ({tracks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tracks.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No tracks added yet</p>
            ) : (
              <div className="space-y-2">
                {tracks.map((track) => (
                  <Link
                    key={track.id}
                    href={`/dashboard/tracks/${track.id}`}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium">
                      {track.track_number || "-"}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{track.title}</p>
                      {track.duration_seconds && (
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize">{track.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
