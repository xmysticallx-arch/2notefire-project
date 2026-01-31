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
import { ArrowLeft, Edit, Trash2, Music, Calendar, Disc3, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Release, Track, Artist } from "@/lib/types"

export default function ReleaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [release, setRelease] = useState<Release & { artist?: Artist } | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchRelease() {
      const supabase = createClient()
      const { data } = await supabase
        .from("releases")
        .select("*, artist:artists(*)")
        .eq("id", params.id)
        .single()

      if (data) {
        setRelease(data as Release & { artist?: Artist })

        // Fetch tracks for this release
        const { data: tracksData } = await supabase
          .from("tracks")
          .select("*")
          .eq("release_id", params.id)
          .order("track_number", { ascending: true })

        if (tracksData) setTracks(tracksData as Track[])
      }
      setLoading(false)
    }

    fetchRelease()
  }, [params.id])

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("releases").delete().eq("id", params.id)
    if (!error) {
      router.push("/dashboard/releases")
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
        <Link href="/dashboard/releases">
          <Button variant="link">Back to Releases</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/releases">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{release.title}</h1>
            <p className="text-muted-foreground">
              {release.artist?.stage_name || release.artist?.name || "Unknown Artist"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/releases/${release.id}/edit`}>
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
                  Are you sure you want to delete "{release.title}"? This action cannot be undone.
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
              {release.genre && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Genre</span>
                  <span className="text-sm font-medium">{release.genre}</span>
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
                    <Badge variant="outline" className="capitalize">
                      {track.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {release.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{release.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
