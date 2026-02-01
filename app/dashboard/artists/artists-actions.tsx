'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Upload, FileSpreadsheet, FileText, Printer, Loader2 } from 'lucide-react'
import { exportToExcel, exportToXLSX, exportToDocx, printData } from '@/lib/export-utils'
import { createClient } from '@/lib/supabase/client'
import type { Artist } from '@/lib/types'

interface ArtistsActionsProps {
  artists: Artist[]
  onImportSuccess?: () => void
}

export function ArtistsActions({ artists, onImportSuccess }: ArtistsActionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  // Export columns configuration
  const exportColumns = [
    { key: 'name' as const, label: 'Name' },
    { key: 'stage_name' as const, label: 'Stage Name' },
    { key: 'email' as const, label: 'Email' },
    { key: 'phone' as const, label: 'Phone' },
    { key: 'genre' as const, label: 'Genre' },
    { key: 'country' as const, label: 'Country' },
    { key: 'contract_status' as const, label: 'Status' },
    { key: 'spotify_url' as const, label: 'Spotify URL' },
    { key: 'instagram_url' as const, label: 'Instagram URL' },
  ]

  // Prepare data for export
  const getExportData = () => {
    return artists.map(a => ({
      name: a.name,
      stage_name: a.stage_name || '',
      email: a.email || '',
      phone: a.phone || '',
      genre: a.genre || '',
      country: a.country || '',
      contract_status: a.contract_status,
      spotify_url: a.spotify_url || '',
      instagram_url: a.instagram_url || '',
    }))
  }

  // Export handlers
  const handleExportExcel = () => {
    setIsExporting(true)
    try {
      exportToExcel(getExportData(), `artists_${new Date().toISOString().split('T')[0]}`, exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportXLSX = async () => {
    setIsExporting(true)
    try {
      await exportToXLSX(getExportData(), `artists_${new Date().toISOString().split('T')[0]}`, exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportDocx = () => {
    setIsExporting(true)
    try {
      exportToDocx(getExportData(), `artists_${new Date().toISOString().split('T')[0]}`, '2NoteFireRecord - Artists Roster', exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    setIsExporting(true)
    try {
      printData(getExportData(), '2NoteFireRecord - Artists Roster', exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  // Import handler
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)
    setImportSuccess(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('File is empty or has no data rows')
      }

      // Parse CSV header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Required column
      if (!headers.some(h => h.includes('name'))) {
        throw new Error('Missing required column: name')
      }

      // Find column indices
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'artist name')
      const stageNameIdx = headers.findIndex(h => h.includes('stage'))
      const emailIdx = headers.findIndex(h => h.includes('email'))
      const phoneIdx = headers.findIndex(h => h.includes('phone'))
      const genreIdx = headers.findIndex(h => h.includes('genre'))
      const countryIdx = headers.findIndex(h => h.includes('country'))
      const statusIdx = headers.findIndex(h => h.includes('status'))
      const spotifyIdx = headers.findIndex(h => h.includes('spotify'))
      const instagramIdx = headers.findIndex(h => h.includes('instagram'))
      const bioIdx = headers.findIndex(h => h.includes('bio'))

      const supabase = createClient()

      // Parse rows
      const importedArtists = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        
        if (cols.length < 1 || !cols[nameIdx]) continue

        importedArtists.push({
          name: cols[nameIdx],
          stage_name: stageNameIdx >= 0 ? cols[stageNameIdx] : null,
          email: emailIdx >= 0 ? cols[emailIdx] : null,
          phone: phoneIdx >= 0 ? cols[phoneIdx] : null,
          genre: genreIdx >= 0 ? cols[genreIdx] : null,
          country: countryIdx >= 0 ? cols[countryIdx] : null,
          contract_status: statusIdx >= 0 && cols[statusIdx] ? cols[statusIdx] : 'pending',
          spotify_url: spotifyIdx >= 0 ? cols[spotifyIdx] : null,
          instagram_url: instagramIdx >= 0 ? cols[instagramIdx] : null,
          bio: bioIdx >= 0 ? cols[bioIdx] : null,
        })
      }

      if (importedArtists.length === 0) {
        throw new Error('No valid artists found in file')
      }

      // Insert into database
      const { error } = await supabase
        .from('artists')
        .insert(importedArtists)

      if (error) throw error

      setImportSuccess(`Successfully imported ${importedArtists.length} artists`)
      
      // Trigger refresh
      if (onImportSuccess) onImportSuccess()
      
      // Clear the file input
      e.target.value = ''
      
      // Reload the page to show new artists
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import file')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Notifications */}
      {importError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          <strong>Import Error:</strong> {importError}
        </div>
      )}
      {importSuccess && (
        <div className="rounded-lg bg-success/10 p-3 text-sm text-success border border-success/20">
          <strong>Success:</strong> {importSuccess}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" disabled={isImporting} asChild>
          <label className="cursor-pointer">
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleImportFile}
              disabled={isImporting}
            />
          </label>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isExporting || artists.length === 0}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export to Excel (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportXLSX}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export to Excel (XLS)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportDocx}>
              <FileText className="mr-2 h-4 w-4" />
              Export to Word (DOC)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print / PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
