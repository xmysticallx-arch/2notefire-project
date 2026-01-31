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
import { ArrowLeft, Loader2, Upload, FileText, X } from "lucide-react"
import Link from "next/link"
import type { Contract, Artist } from "@/lib/types"

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [artists, setArtists] = useState<Artist[]>([])
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    artist_id: "",
    contract_type: "",
    status: "draft",
    start_date: "",
    end_date: "",
    value: "",
    terms: "",
    notes: "",
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const [contractRes, artistsRes] = await Promise.all([
        supabase.from("contracts").select("*").eq("id", params.id).single(),
        supabase.from("artists").select("*").order("name"),
      ])

      if (contractRes.data) {
        const c = contractRes.data as Contract
        setFormData({
          title: c.title,
          artist_id: c.artist_id || "",
          contract_type: c.contract_type,
          status: c.status,
          start_date: c.start_date || "",
          end_date: c.end_date || "",
          value: c.value?.toString() || "",
          terms: c.terms || "",
          notes: c.notes || "",
        })
        if (c.file_url) setExistingFileUrl(c.file_url)
      }
      if (artistsRes.data) setArtists(artistsRes.data as Artist[])
      setFetching(false)
    }

    fetchData()
  }, [params.id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setContractFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      let file_url = existingFileUrl

      if (contractFile) {
        const fileExt = contractFile.name.split(".").pop()
        const fileName = `contract-${params.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(fileName, contractFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("contracts").getPublicUrl(fileName)
          file_url = publicUrl
        }
      }

      const { error } = await supabase
        .from("contracts")
        .update({
          ...formData,
          value: formData.value ? parseFloat(formData.value) : null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          file_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error
      router.push(`/dashboard/contracts/${params.id}`)
    } catch (error) {
      console.error("Error updating contract:", error)
      alert("Failed to update contract")
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
        <Link href={`/dashboard/contracts/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Contract</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title *</Label>
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
                <Label>Contract Type *</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recording">Recording</SelectItem>
                    <SelectItem value="publishing">Publishing</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="licensing">Licensing</SelectItem>
                    <SelectItem value="sync">Sync</SelectItem>
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
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Contract Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Contract Document</Label>
              {contractFile ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{contractFile.name}</p>
                    <p className="text-sm text-muted-foreground">New file selected</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setContractFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : existingFileUrl ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Existing document</p>
                    <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      View document
                    </a>
                  </div>
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>Replace</span>
                    </Button>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/30 p-8 transition-colors hover:border-primary/50">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload contract document</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX</p>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Link href={`/dashboard/contracts/${params.id}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
