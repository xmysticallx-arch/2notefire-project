'use client'

import React from "react"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Camera, Loader2, Save, Trash2, Disc3 } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

interface ReleaseFormData {
  title: string
  release_type: string
  status: string
  release_date: string
  cover_art_url: string
  upc_code: string
  genre: string
  description: string
}

const STATUS_WORKFLOW = ['draft', 'review', 'approved', 'published']

export default function EditReleasePage({
  params,
}: {
  params: Promise<{ id: string; releaseId: string }>
}) {
  const { id, releaseId } = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ReleaseFormData>({
    title: '',
    release_type: 'single',
    status: 'draft',
    release_date: '',
    cover_art_url: '',
    upc_code: '',
    genre: '',
    description: '',
  })

  useEffect(() => {
    const fetchRelease = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('id', releaseId)
        .single()

      if (error) {
        setError('Failed to load release')
        setIsLoading(false)
        return
      }

      setFormData({
        title: data.title || '',
        release_type: data.release_type || 'single',
        status: data.status || 'draft',
        release_date: data.release_date || '',
        cover_art_url: data.cover_art_url || '',
        upc_code: data.upc_code || '',
        genre: data.genre || '',
        description: data.description || '',
      })
      setIsLoading(false)
    }

    fetchRelease()
  }, [releaseId])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `release-${releaseId}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('releases')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      const { data: publicUrl } = supabase.storage
        .from('releases')
        .getPublicUrl(fileName)

      setFormData((prev) => ({ ...prev, cover_art_url: publicUrl.publicUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload cover art')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('releases')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', releaseId)

      if (error) throw error

      router.push(`/dashboard/artists/${id}/releases`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this release? This will also delete all associated tracks.')) {
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('releases').delete().eq('id', releaseId)

      if (error) throw error

      router.push(`/dashboard/artists/${id}/releases`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete release')
      setIsSaving(false)
    }
  }

  const canAdvanceStatus = (currentStatus: string) => {
    const currentIndex = STATUS_WORKFLOW.indexOf(currentStatus)
    return currentIndex < STATUS_WORKFLOW.length - 1
  }

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = STATUS_WORKFLOW.indexOf(currentStatus)
    return STATUS_WORKFLOW[currentIndex + 1]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/artists/${id}/releases`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Release</h1>
          <p className="text-muted-foreground">Update release information</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Cover Art Card */}
        <Card>
          <CardHeader>
            <CardTitle>Cover Art</CardTitle>
            <CardDescription>Click to upload cover artwork</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.cover_art_url ? (
                <img
                  src={formData.cover_art_url || "/placeholder.svg"}
                  alt={formData.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Disc3 className="h-16 w-16 text-primary/50" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Recommended: 3000x3000px, JPG or PNG
            </p>
          </CardContent>
        </Card>

        {/* Release Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Release Information</CardTitle>
            <CardDescription>Basic release details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="release_type">Release Type</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                {canAdvanceStatus(formData.status) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({ ...formData, status: getNextStatus(formData.status) })
                    }
                  >
                    Advance
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="upc_code">UPC Code</Label>
              <Input
                id="upc_code"
                value={formData.upc_code}
                onChange={(e) => setFormData({ ...formData, upc_code: e.target.value })}
                placeholder="e.g., 123456789012"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between lg:col-span-3">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSaving}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Release
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/dashboard/artists/${id}/releases`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
