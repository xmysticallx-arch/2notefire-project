import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Artist } from '@/lib/types'
import { ArtistsActions } from './artists-actions'

export default async function ArtistsPage() {
  const supabase = await createClient()
  
  const { data: artists, error } = await supabase
    .from('artists')
    .select('*')
    .order('created_at', { ascending: false })

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20'
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border'
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artists</h1>
          <p className="text-muted-foreground">Manage your label&apos;s artist roster</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/artists/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Artist
            </Link>
          </Button>
        </div>
      </div>

      <ArtistsActions artists={artists || []} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Artists</CardTitle>
              <CardDescription>
                {artists?.length || 0} artists in your roster
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search artists..."
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              Error loading artists: {error.message}
            </div>
          ) : artists && artists.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artist</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artists.map((artist: Artist) => (
                  <TableRow key={artist.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={artist.image_url || ''} alt={artist.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(artist.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{artist.stage_name || artist.name}</p>
                          {artist.stage_name && (
                            <p className="text-sm text-muted-foreground">{artist.name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{artist.genre || '-'}</TableCell>
                    <TableCell>{artist.country || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(artist.contract_status)}>
                        {artist.contract_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(artist.created_at).toLocaleDateString()}
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
                            <Link href={`/dashboard/artists/${artist.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/artists/${artist.id}/edit`}>
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
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No artists yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by adding your first artist to the roster.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/artists/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Artist
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
