'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

const topArtists = [
  { name: 'FireStorm', streams: 2500000, image: '', genre: 'Hip-Hop' },
  { name: 'Nova Beats', streams: 1800000, image: '', genre: 'Electronic' },
  { name: 'The Flames', streams: 1200000, image: '', genre: 'Rock' },
  { name: 'Echo Wave', streams: 950000, image: '', genre: 'Pop' },
  { name: 'Blaze Runner', streams: 720000, image: '', genre: 'R&B' },
]

const maxStreams = topArtists[0]?.streams || 1

export function TopArtists() {
  const formatStreams = (streams: number) => {
    if (streams >= 1000000) return `${(streams / 1000000).toFixed(1)}M`
    if (streams >= 1000) return `${(streams / 1000).toFixed(0)}K`
    return streams.toString()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-4">
      {topArtists.map((artist, index) => (
        <div key={artist.name} className="flex items-center gap-4">
          <span className="w-4 text-sm font-medium text-muted-foreground">
            {index + 1}
          </span>
          <Avatar className="h-10 w-10">
            <AvatarImage src={artist.image || "/placeholder.svg"} alt={artist.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(artist.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{artist.name}</p>
              <p className="text-sm text-muted-foreground">{formatStreams(artist.streams)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={(artist.streams / maxStreams) * 100} 
                className="h-1.5 flex-1"
              />
              <span className="text-xs text-muted-foreground">{artist.genre}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
