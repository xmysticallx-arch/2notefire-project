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
import type { Release } from '@/lib/types'

interface ReleasesActionsProps {
  releases: (Release & { artist?: { name: string; stage_name: string | null } })[]
  onImportSuccess?: () => void
}

export function ReleasesActions({ releases, onImportSuccess }: ReleasesActionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  // Export columns configuration
  const exportColumns = [
    { key: 'title' as const, label: 'Title' },
    { key: 'artist_name' as const, label: 'Artist' },
    { key: 'release_type' as const, label: 'Type' },
    { key: 'genre' as const, label: 'Genre' },
    { key: 'release_date' as const, label: 'Release Date' },
    { key: 'status' as const, label: 'Status' },
    { key: 'label' as const, label: 'Label' },
    { key: 'catalog_number' as const, label: 'Catalog #' },
    { key: 'upc' as const, label: 'UPC' },
  ]

  // Prepare data for export
  const getExportData = () => {
    return releases.map(r => ({
      title: r.title,
      artist_name: r.artist?.stage_name || r.artist?.name || '',
      release_type: r.release_type,
      genre: r.genre || '',
      release_date: r.release_date ? new Date(r.release_date).toLocaleDateString() : '',
      status: r.status,
      label: r.label || '',
      catalog_number: r.catalog_number || '',
      upc: r.upc || '',
    }))
  }

  // Export handlers
  const handleExportExcel = () => {
    setIsExporting(true)
    try {
      exportToExcel(getExportData(), `releases_${new Date().toISOString().split('T')[0]}`, exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportXLSX = async () => {
    setIsExporting(true)
    try {
      await exportToXLSX(getExportData(), `releases_${new Date().toISOString().split('T')[0]}`, exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportDocx = () => {
    setIsExporting(true)
    try {
      exportToDocx(getExportData(), `releases_${new Date().toISOString().split('T')[0]}`, '2NoteFireRecord - Releases Catalog', exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    setIsExporting(true)
    try {
      printData(getExportData(), '2NoteFireRecord - Releases Catalog', exportColumns)
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
      
      // Required columns
      const requiredColumns = ['title', 'type']
      const missingColumns = requiredColumns.filter(col => 
        !headers.some(h => h.includes(col))
      )
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
      }

      // Find column indices
      const titleIdx = headers.findIndex(h => h.includes('title'))
      const artistNameIdx = headers.findIndex(h => h.includes('artist'))
      const typeIdx = headers.findIndex(h => h.includes('type'))
      const genreIdx = headers.findIndex(h => h.includes('genre'))
      const dateIdx = headers.findIndex(h => h.includes('date'))
      const statusIdx = headers.findIndex(h => h.includes('status'))
      const labelIdx = headers.findIndex(h => h.includes('label'))
      const catalogIdx = headers.findIndex(h => h.includes('catalog'))
      const upcIdx = headers.findIndex(h => h.includes('upc'))

      const supabase = createClient()

      // Get all artists to match by name
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name, stage_name')

      // Parse rows
      const importedReleases = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        
        if (cols.length < 1 || !cols[titleIdx]) continue

        const releaseType = cols[typeIdx]?.toLowerCase()
        if (!['album', 'single', 'ep'].includes(releaseType)) continue

        // Try to match artist
        let artistId = null
        if (artistNameIdx >= 0 && cols[artistNameIdx] && artists) {
          const artistName = cols[artistNameIdx].toLowerCase()
          const matchedArtist = artists.find(
            a => a.name.toLowerCase() === artistName || 
                 a.stage_name?.toLowerCase() === artistName
          )
          if (matchedArtist) {
            artistId = matchedArtist.id
          }
        }

        importedReleases.push({
          title: cols[titleIdx],
          artist_id: artistId,
          release_type: releaseType,
          genre: genreIdx >= 0 ? cols[genreIdx] : null,
          release_date: dateIdx >= 0 && cols[dateIdx] ? cols[dateIdx] : null,
          status: statusIdx >= 0 && cols[statusIdx] ? cols[statusIdx].toLowerCase() : 'draft',
          label: labelIdx >= 0 ? cols[labelIdx] : null,
          catalog_number: catalogIdx >= 0 ? cols[catalogIdx] : null,
          upc: upcIdx >= 0 ? cols[upcIdx] : null,
        })
      }

      if (importedReleases.length === 0) {
        throw new Error('No valid releases found in file')
      }

      // Insert into database
      const { error } = await supabase
        .from('releases')
        .insert(importedReleases)

      if (error) throw error

      setImportSuccess(`Successfully imported ${importedReleases.length} releases`)
      
      // Trigger refresh
      if (onImportSuccess) onImportSuccess()
      
      // Clear the file input
      e.target.value = ''
      
      // Reload the page to show new releases
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
            <Button variant="outline" disabled={isExporting || releases.length === 0}>
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
