"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Upload, Music, X } from "lucide-react"
import Link from "next/link"
import type { Track, Artist, Release } from "@/lib/types"

export default function EditTrackPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [artists, setArtists] = useState<Artist[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    artist_id: "",
    release_id: "",
    track_number: "",
    duration_seconds: "",
    isrc_code: "",
    lyrics: "",
    composers: "",
    producers: "",
    status: "pending",
    explicit_content: false,
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const [trackRes, artistsRes, releasesRes] = await Promise.all([
        supabase.from("tracks").select("*").eq("id", params.id).single(),
        supabase.from("artists").select("*").order("name"),
        supabase.from("releases").select("*").order("title"),
      ])

      if (trackRes.data) {
        const t = trackRes.data as Track
        setFormData({
          title: t.title,
          artist_id: t.artist_id || "",
          release_id: t.release_id || "",
          track_number: t.track_number?.toString() || "",
          duration_seconds: t.duration_seconds?.toString() || "",
          isrc_code: t.isrc_code || "",
          lyrics: t.lyrics || "",
          composers: t.composers?.join(", ") || "",
          producers: t.producers?.join(", ") || "",
          status: t.status,
          explicit_content: t.explicit_content || false,
        })
        if (t.file_url) setExistingAudioUrl(t.file_url)
      }
      if (artistsRes.data) setArtists(artistsRes.data as Artist[])
      if (releasesRes.data) setReleases(releasesRes.data as Release[])
      setFetching(false)
    }

    fetchData()
  }, [params.id])

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAudioFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      let file_url = existingAudioUrl

      if (audioFile) {
        const fileExt = audioFile.name.split(".").pop()
        const fileName = `track-${params.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from("tracks")
          .upload(fileName, audioFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("tracks").getPublicUrl(fileName)
          file_url = publicUrl
        }
      }

      const { error } = await supabase
        .from("tracks")
        .update({
          title: formData.title,
          artist_id: formData.artist_id || null,
          release_id: formData.release_id || null,
          track_number: formData.track_number ? parseInt(formData.track_number) : null,
          duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : null,
          isrc_code: formData.isrc_code || null,
          lyrics: formData.lyrics || null,
          composers: formData.composers ? formData.composers.split(",").map(s => s.trim()) : null,
          producers: formData.producers ? formData.producers.split(",").map(s => s.trim()) : null,
          status: formData.status,
          explicit_content: formData.explicit_content,
          file_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error
      router.push(`/dashboard/tracks/${params.id}`)
    } catch (error) {
      console.error("Error updating track:", error)
      alert("Failed to update track")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/tracks/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Track</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Track Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Track Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Artist *</Label>
                <Select
                  value={formData.artist_id}
                  onValueChange={(value) => setFormData({ ...formData, artist_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select artist" />
                  </SelectTrigger>
                  <SelectContent>
                    {artists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id}>
                        {artist.stage_name || artist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Release</Label>
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
              <div className="space-y-2">
                <Label htmlFor="track_number">Track Number</Label>
                <Input
                  id="track_number"
                  type="number"
                  min="1"
                  value={formData.track_number}
                  onChange={(e) => setFormData({ ...formData, track_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="isrc_code">ISRC Code</Label>
                <Input
                  id="isrc_code"
                  value={formData.isrc_code}
                  onChange={(e) => setFormData({ ...formData, isrc_code: e.target.value })}
                  placeholder="e.g., US-S1Z-99-00001"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="composers">Composers</Label>
                <Input
                  id="composers"
                  value={formData.composers}
                  onChange={(e) => setFormData({ ...formData, composers: e.target.value })}
                  placeholder="Comma-separated names"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="producers">Producers</Label>
                <Input
                  id="producers"
                  value={formData.producers}
                  onChange={(e) => setFormData({ ...formData, producers: e.target.value })}
                  placeholder="Comma-separated names"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lyrics">Lyrics</Label>
              <Textarea
                id="lyrics"
                value={formData.lyrics}
                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="explicit"
                checked={formData.explicit_content}
                onCheckedChange={(checked) => setFormData({ ...formData, explicit_content: checked as boolean })}
              />
              <Label htmlFor="explicit">Contains explicit content</Label>
            </div>

            <div className="space-y-2">
              <Label>Audio File</Label>
              {audioFile ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                  <Music className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">New file selected</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setAudioFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : existingAudioUrl ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                  <Music className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Existing audio file</p>
                    <audio controls className="mt-2 w-full" src={existingAudioUrl} />
                  </div>
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>Replace</span>
                    </Button>
                    <input type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} />
                  </label>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/30 p-8 transition-colors hover:border-primary/50">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload audio file</p>
                  <p className="text-xs text-muted-foreground">MP3, WAV, FLAC</p>
                  <input type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} />
                </label>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Link href={`/dashboard/tracks/${params.id}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
