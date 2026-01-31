"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { ArrowLeft, Loader2, Upload, FileText, X } from "lucide-react"
import Link from "next/link"
import type { Artist } from "@/lib/types"

const CONTRACT_TYPES = [
  { value: "recording", label: "Recording Agreement" },
  { value: "distribution", label: "Distribution Agreement" },
  { value: "publishing", label: "Publishing Agreement" },
  { value: "licensing", label: "Licensing Agreement" },
  { value: "management", label: "Management Agreement" },
  { value: "sync", label: "Sync License" },
  { value: "work_for_hire", label: "Work for Hire" },
  { value: "collaboration", label: "Collaboration Agreement" },
]

export default function NewContractPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [artists, setArtists] = useState<Artist[]>([])
  const [contractFile, setContractFile] = useState<File | null>(null)
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
    const fetchArtists = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("artists")
        .select("*")
        .order("name")
      if (data) setArtists(data)
    }
    fetchArtists()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setContractFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      let document_url = null

      // Upload contract file if provided
      if (contractFile) {
        const fileExt = contractFile.name.split('.').pop()
        const fileName = `contract-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(fileName, contractFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('contracts')
            .getPublicUrl(fileName)
          document_url = publicUrl
        }
      }

      const { error } = await supabase.from("contracts").insert({
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        document_url,
        created_by: user?.id,
      })

      if (error) throw error
      router.push("/dashboard/contracts")
    } catch (error) {
      console.error("Error creating contract:", error)
      alert("Failed to create contract")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contracts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">New Contract</h1>
          <p className="text-muted-foreground">Create a new contract or agreement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Contract Details</CardTitle>
            <CardDescription>Enter the contract information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Contract Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Recording Agreement - Album X"
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
              <div className="space-y-2">
                <Label htmlFor="contract_type">Contract Type *</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="value">Contract Value (USD)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Contract terms and conditions..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes (not visible to artist)..."
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Contract Document</Label>
              {contractFile ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{contractFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setContractFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="contract_file"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/30 p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload contract document</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX (max 10MB)</p>
                  <input
                    id="contract_file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Contract
              </Button>
              <Link href="/dashboard/contracts">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
