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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Camera, Loader2, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

interface ArtistFormData {
  name: string
  stage_name: string
  email: string
  phone: string
  bio: string
  image_url: string
  genre: string
  country: string
  contract_status: string
  social_links: {
    spotify?: string
    apple_music?: string
    instagram?: string
    twitter?: string
    youtube?: string
  }
}

export default function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ArtistFormData>({
    name: '',
    stage_name: '',
    email: '',
    phone: '',
    bio: '',
    image_url: '',
    genre: '',
    country: '',
    contract_status: 'active',
    social_links: {},
  })

  useEffect(() => {
    const fetchArtist = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError('Failed to load artist')
        setIsLoading(false)
        return
      }

      setFormData({
        name: data.name || '',
        stage_name: data.stage_name || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        image_url: data.image_url || '',
        genre: data.genre || '',
        country: data.country || '',
        contract_status: data.contract_status || 'active',
        social_links: data.social_links || {},
      })
      setIsLoading(false)
    }

    fetchArtist()
  }, [id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `artist-${id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('artists')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data: publicUrl } = supabase.storage
        .from('artists')
        .getPublicUrl(fileName)

      setFormData((prev) => ({ ...prev, image_url: publicUrl.publicUrl }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
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
        .from('artists')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      router.push(`/dashboard/artists/${id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this artist? This action cannot be undone.')) {
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('artists').delete().eq('id', id)

      if (error) throw error

      router.push('/dashboard/artists')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete artist')
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
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
          <Link href={`/dashboard/artists/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Artist</h1>
          <p className="text-muted-foreground">Update artist information</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Profile Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Click the photo to upload a new image</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative">
              <Avatar
                className="h-32 w-32 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <AvatarImage src={formData.image_url || "/placeholder.svg"} alt={formData.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {getInitials(formData.name || 'A')}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Recommended: Square image, at least 400x400px
            </p>
          </CardContent>
        </Card>

        {/* Basic Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Artist name and contact details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Legal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stage_name">Stage Name</Label>
              <Input
                id="stage_name"
                value={formData.stage_name}
                onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="e.g., Hip-Hop, R&B, Pop"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contract_status">Contract Status</Label>
              <Select
                value={formData.contract_status}
                onValueChange={(value) => setFormData({ ...formData, contract_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                placeholder="Tell the artist's story..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Artist social media and streaming profiles</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="spotify">Spotify</Label>
              <Input
                id="spotify"
                value={formData.social_links.spotify || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, spotify: e.target.value },
                  })
                }
                placeholder="https://open.spotify.com/artist/..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apple_music">Apple Music</Label>
              <Input
                id="apple_music"
                value={formData.social_links.apple_music || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, apple_music: e.target.value },
                  })
                }
                placeholder="https://music.apple.com/artist/..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.social_links.instagram || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, instagram: e.target.value },
                  })
                }
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input
                id="twitter"
                value={formData.social_links.twitter || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, twitter: e.target.value },
                  })
                }
                placeholder="https://twitter.com/..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={formData.social_links.youtube || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, youtube: e.target.value },
                  })
                }
                placeholder="https://youtube.com/..."
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
            Delete Artist
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/dashboard/artists/${id}`}>Cancel</Link>
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
