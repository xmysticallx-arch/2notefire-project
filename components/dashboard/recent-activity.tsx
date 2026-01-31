'use client'

import { Disc3, Users, FileText, DollarSign, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

const activities = [
  {
    id: '1',
    type: 'release',
    title: 'New Album Released',
    description: 'FireStorm - "Eternal Flames" is now live on all platforms',
    timestamp: '2 hours ago',
    icon: Disc3,
  },
  {
    id: '2',
    type: 'artist',
    title: 'Artist Signed',
    description: 'Nova Beats has joined the label roster',
    timestamp: '5 hours ago',
    icon: Users,
  },
  {
    id: '3',
    type: 'contract',
    title: 'Contract Approved',
    description: 'Distribution agreement with Echo Wave finalized',
    timestamp: '1 day ago',
    icon: FileText,
  },
  {
    id: '4',
    type: 'payment',
    title: 'Royalty Payment',
    description: 'Q4 royalties distributed to 12 artists',
    timestamp: '2 days ago',
    icon: DollarSign,
  },
  {
    id: '5',
    type: 'track',
    title: 'Track Approved',
    description: '"Summer Heat" by Blaze Runner approved for release',
    timestamp: '3 days ago',
    icon: Music,
  },
]

const typeColors: Record<string, string> = {
  release: 'bg-chart-1/10 text-chart-1',
  artist: 'bg-chart-2/10 text-chart-2',
  contract: 'bg-chart-3/10 text-chart-3',
  payment: 'bg-success/10 text-success',
  track: 'bg-chart-4/10 text-chart-4',
}

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            typeColors[activity.type] || 'bg-muted text-muted-foreground'
          )}>
            <activity.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.title}</p>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.timestamp}</p>
        </div>
      ))}
    </div>
  )
}
