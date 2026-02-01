"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Loader2, Upload, Music, X, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Artist, Release } from "@/lib/types"

export default function NewTrackPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [formData, setFormData] = useState({
    title: "",
    artist_id: "",
    release_id: "",
    track_number: "",
    duration_seconds: "",
    isrc_code: "",
    status: "pending",
    explicit_content: false,
    composers: "",
    producers: "",
    lyrics: "",
    audio_file_url: "",
    audio_file_id: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const [artistsRes, releasesRes] = await Promise.all([
        supabase.from("artists").select("*").order("name"),
        supabase.from("releases").select("*").order("title"),
      ])
      if (artistsRes.data) setArtists(artistsRes.data)
      if (releasesRes.data) setReleases(releasesRes.data)
    }
    fetchData()
  }, [])

  const validateAudioFile = (file: File): string | null => {
    // Only accept WAV files
    const validTypes = ['audio/wav', 'audio/wave', 'audio/x-wav']
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.wav')) {
      return 'Only WAV files are accepted. Please upload a .wav file.'
    }
    
    // Max file size: 500MB
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 500MB.'
    }
    
    return null
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateAudioFile(file)
    if (error) {
      setUploadError(error)
      return
    }

    setAudioFile(file)
    setUploadError(null)
    
    // Auto-populate duration if possible
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.onloadedmetadata = () => {
      setFormData(prev => ({
        ...prev,
        duration_seconds: Math.round(audio.duration).toString()
      }))
      URL.revokeObjectURL(audio.src)
    }
  }

  const uploadToGoogleDrive = async (file: File, artistId?: string): Promise<{ fileId: string; webViewLink: string; streamingUrl?: string } | null> => {
    setUploading(true)
    setUploadProgress(0)

    try {
      // Upload to our API endpoint which handles Google Drive upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('fileName', file.name)
      if (artistId) {
        uploadFormData.append('artistId', artistId)
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/upload/google-drive', {
        method: 'POST',
        body: uploadFormData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload to Google Drive')
      }

      const data = await response.json()
      setUploadProgress(100)
      return {
        fileId: data.fileId,
        webViewLink: data.streamingUrl || data.webContentLink,
        streamingUrl: data.streamingUrl,
      }
    } catch (error) {
      console.error('Google Drive upload error:', error)
      // Fallback: Save to Supabase Storage if Google Drive fails
      return await uploadToSupabaseStorage(file)
    } finally {
      setUploading(false)
    }
  }

  const uploadToSupabaseStorage = async (file: File): Promise<{ fileId: string; webViewLink: string } | null> => {
    try {
      const supabase = createClient()
      const fileName = `track-${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage
        .from('tracks')
        .getPublicUrl(fileName)

      return {
        fileId: fileName,
        webViewLink: publicUrl.publicUrl
      }
    } catch (error) {
      console.error('Supabase storage error:', error)
      setUploadError('Failed to upload audio file. Please try again.')
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setUploadError(null)

    try {
      let audioFileData = null

      // Upload audio file if selected
      if (audioFile) {
        audioFileData = await uploadToGoogleDrive(audioFile, formData.artist_id || undefined)
        if (!audioFileData) {
          setLoading(false)
          return
        }
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from("tracks").insert({
        title: formData.title,
        artist_id: formData.artist_id || null,
        release_id: formData.release_id || null,
        track_number: formData.track_number ? parseInt(formData.track_number) : null,
        duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : null,
        isrc_code: formData.isrc_code || null,
        status: formData.status,
        explicit_content: formData.explicit_content,
        composers: formData.composers ? formData.composers.split(",").map(s => s.trim()) : [],
        producers: formData.producers ? formData.producers.split(",").map(s => s.trim()) : [],
        lyrics: formData.lyrics || null,
        audio_file_url: audioFileData?.webViewLink || null,
        audio_file_id: audioFileData?.fileId || null,
        created_by: user?.id,
      })

      if (error) throw error
      router.push("/dashboard/tracks")
    } catch (error) {
      console.error("Error creating track:", error)
      setUploadError("Failed to create track. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const removeAudioFile = () => {
    setAudioFile(null)
    setFormData(prev => ({ ...prev, duration_seconds: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tracks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">New Track</h1>
          <p className="text-muted-foreground">Add a new track to the catalog</p>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Audio File Upload */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Audio File</CardTitle>
            <CardDescription>Upload the track audio file (WAV format only, max 500MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,audio/wav,audio/wave,audio/x-wav"
              className="hidden"
              onChange={handleFileSelect}
            />
            
            {audioFile ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                      {formData.duration_seconds && ` • ${Math.floor(parseInt(formData.duration_seconds) / 60)}:${(parseInt(formData.duration_seconds) % 60).toString().padStart(2, '0')}`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeAudioFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">WAV files only (max 500MB)</p>
              </div>
            )}

            {uploading && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Track Details */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Track Details</CardTitle>
            <CardDescription>Enter the track information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
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
                <Label htmlFor="duration_seconds">Duration (seconds)</Label>
                <Input
                  id="duration_seconds"
                  type="number"
                  min="0"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                  placeholder="e.g., 210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isrc_code">ISRC Code</Label>
                <Input
                  id="isrc_code"
                  value={formData.isrc_code}
                  onChange={(e) => setFormData({ ...formData, isrc_code: e.target.value })}
                  placeholder="e.g., USRC12345678"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="explicit_content"
                  checked={formData.explicit_content}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, explicit_content: checked as boolean })
                  }
                />
                <Label htmlFor="explicit_content">Contains explicit content</Label>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="composers">Composers (comma separated)</Label>
                <Input
                  id="composers"
                  value={formData.composers}
                  onChange={(e) => setFormData({ ...formData, composers: e.target.value })}
                  placeholder="e.g., John Doe, Jane Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="producers">Producers (comma separated)</Label>
                <Input
                  id="producers"
                  value={formData.producers}
                  onChange={(e) => setFormData({ ...formData, producers: e.target.value })}
                  placeholder="e.g., Producer X, Producer Y"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lyrics">Lyrics</Label>
              <Textarea
                id="lyrics"
                value={formData.lyrics}
                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                placeholder="Track lyrics..."
                rows={6}
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={loading || uploading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? 'Uploading...' : loading ? 'Creating...' : 'Create Track'}
              </Button>
              <Link href="/dashboard/tracks">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
