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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Upload, X, ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Release, Artist } from "@/lib/types"

export default function EditReleasePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [artists, setArtists] = useState<Artist[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    artist_id: "",
    release_type: "single",
    status: "draft",
    release_date: "",
    upc_code: "",
    genre: "",
    description: "",
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const [releaseRes, artistsRes] = await Promise.all([
        supabase.from("releases").select("*").eq("id", params.id).single(),
        supabase.from("artists").select("*").order("name"),
      ])

      if (releaseRes.data) {
        const r = releaseRes.data as Release
        setFormData({
          title: r.title,
          artist_id: r.artist_id || "",
          release_type: r.release_type || "single",
          status: r.status,
          release_date: r.release_date || "",
          upc_code: r.upc_code || "",
          genre: r.genre || "",
          description: r.description || "",
        })
        if (r.cover_art_url) setCoverPreview(r.cover_art_url)
      }
      if (artistsRes.data) setArtists(artistsRes.data as Artist[])
      setFetching(false)
    }

    fetchData()
  }, [params.id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setCoverPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      let cover_art_url = coverPreview

      if (coverFile) {
        const fileExt = coverFile.name.split(".").pop()
        const fileName = `release-${params.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from("releases")
          .upload(fileName, coverFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("releases").getPublicUrl(fileName)
          cover_art_url = publicUrl
        }
      }

      const { error } = await supabase
        .from("releases")
        .update({
          ...formData,
          cover_art_url,
          release_date: formData.release_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error
      router.push(`/dashboard/releases/${params.id}`)
    } catch (error) {
      console.error("Error updating release:", error)
      alert("Failed to update release")
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
        <Link href={`/dashboard/releases/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Release</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Cover Art</CardTitle>
            </CardHeader>
            <CardContent>
              {coverPreview ? (
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={coverPreview || "/placeholder.svg"} alt="Cover" fill className="object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      setCoverFile(null)
                      setCoverPreview(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/30 transition-colors hover:border-primary/50">
                  <ImageIcon className="mb-2 h-12 w-12 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload cover art</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Release Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist *</Label>
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
                  <Label>Release Type</Label>
                  <Select
                    value={formData.release_type}
                    onValueChange={(value) => setFormData({ ...formData, release_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                      <SelectItem value="compilation">Compilation</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="release_date">Release Date</Label>
                  <Input
                    id="release_date"
                    type="date"
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upc_code">UPC Code</Label>
                  <Input
                    id="upc_code"
                    value={formData.upc_code}
                    onChange={(e) => setFormData({ ...formData, upc_code: e.target.value })}
                    placeholder="Universal Product Code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="e.g., Hip-Hop, R&B"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Link href={`/dashboard/releases/${params.id}`}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
