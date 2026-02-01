import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Disc3 } from 'lucide-react'
import Link from 'next/link'
import type { Release } from '@/lib/types'
import { ReleasesActions } from './releases-actions'

export default async function ReleasesPage() {
  const supabase = await createClient()
  
  let releases: (Release & { artist?: { name: string; stage_name: string | null } })[] | null = null
  let error: { message: string } | null = null
  
  try {
    const result = await supabase
      .from('releases')
      .select('*, artist:artists(id, name, stage_name)')
      .order('created_at', { ascending: false })
    
    releases = result.data
    if (result.error) {
      error = { message: result.error.message }
    }
  } catch (e) {
    error = { message: e instanceof Error ? e.message : 'Failed to fetch releases' }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success/10 text-success border-success/20'
      case 'approved':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20'
      case 'review':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'draft':
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Releases</h1>
          <p className="text-muted-foreground">Manage albums, EPs, and singles</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/releases/new">
              <Plus className="mr-2 h-4 w-4" />
              New Release
            </Link>
          </Button>
        </div>
      </div>

      <ReleasesActions releases={releases || []} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Releases</CardTitle>
              <CardDescription>
                {releases?.length || 0} releases in catalog
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search releases..."
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              Error loading releases: {error.message}
            </div>
          ) : releases && releases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Release</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                          <Disc3 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{release.title}</p>
                          <p className="text-sm text-muted-foreground">{release.genre || 'No genre'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {release.artist?.stage_name || release.artist?.name || '-'}
                    </TableCell>
                    <TableCell className="capitalize">{release.release_type}</TableCell>
                    <TableCell>
                      {release.release_date 
                        ? new Date(release.release_date).toLocaleDateString() 
                        : 'TBD'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(release.status)}>
                        {release.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/releases/${release.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/releases/${release.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Disc3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No releases yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start building your catalog by creating a new release.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/releases/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Release
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
