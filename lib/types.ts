export type UserRole = 'admin' | 'user' | 'artist' | 'finance'
export type Department = 'management' | 'ar' | 'marketing' | 'finance' | 'legal' | 'production' | 'distribution'
export type ReleaseStatus = 'draft' | 'review' | 'approved' | 'published'
export type TrackStatus = 'pending' | 'review' | 'approved' | 'rejected'
export type TransactionType = 'income' | 'expense'
export type ContractStatus = 'draft' | 'pending_approval' | 'approved' | 'signed' | 'expired' | 'cancelled'

export interface Profile {
  id: string
  email: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  department: Department | null
  phone: string | null
  language: string
  currency: string
  created_at: string
  updated_at: string
}

export interface Artist {
  id: string
  name: string
  stage_name: string | null
  email: string | null
  phone: string | null
  bio: string | null
  image_url: string | null
  genre: string | null
  country: string | null
  social_links: Record<string, string>
  contract_status: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Release {
  id: string
  artist_id: string | null
  title: string
  release_type: string
  status: ReleaseStatus
  release_date: string | null
  cover_art_url: string | null
  upc_code: string | null
  label: string
  genre: string | null
  description: string | null
  total_tracks: number
  created_by: string | null
  created_at: string
  updated_at: string
  artist?: Artist
}

export interface Track {
  id: string
  release_id: string | null
  artist_id: string | null
  title: string
  track_number: number | null
  duration_seconds: number | null
  isrc_code: string | null
  file_url: string | null
  preview_url: string | null
  lyrics: string | null
  composers: string[] | null
  producers: string[] | null
  status: TrackStatus
  explicit_content: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  artist?: Artist
  release?: Release
}

export interface Transaction {
  id: string
  type: TransactionType
  category: string
  amount: number
  currency: string
  description: string | null
  reference_number: string | null
  artist_id: string | null
  release_id: string | null
  transaction_date: string
  status: string
  payment_method: string | null
  notes: string | null
  attachments: unknown[]
  created_by: string | null
  created_at: string
  updated_at: string
  artist?: Artist
  release?: Release
}

export interface Royalty {
  id: string
  artist_id: string | null
  track_id: string | null
  release_id: string | null
  platform: string
  streams: number
  downloads: number
  revenue: number
  currency: string
  period_start: string | null
  period_end: string | null
  royalty_rate: number
  artist_share: number
  label_share: number
  status: string
  paid_at: string | null
  created_at: string
  updated_at: string
  artist?: Artist
  track?: Track
  release?: Release
}

export interface Contract {
  id: string
  artist_id: string | null
  title: string
  contract_type: string
  status: ContractStatus
  start_date: string | null
  end_date: string | null
  value: number | null
  currency: string
  terms: string | null
  file_url: string | null
  signed_at: string | null
  signed_by: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  artist?: Artist
}

export interface Analytics {
  id: string
  artist_id: string | null
  track_id: string | null
  release_id: string | null
  platform: string
  metric_type: string
  metric_value: number
  country: string | null
  city: string | null
  demographic: Record<string, unknown>
  recorded_at: string
  created_at: string
  artist?: Artist
  track?: Track
  release?: Release
}

export interface Notification {
  id: string
  user_id: string | null
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Setting {
  id: string
  key: string
  value: unknown
  description: string | null
  category: string
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
  created_at: string
}

export interface RolePermission {
  id: string
  role: UserRole
  permission_id: string
  created_at: string
}

export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted: boolean
  created_at: string
}

export interface FeatureSetting {
  id: string
  feature_key: string
  feature_name: string
  description?: string
  enabled: boolean
  visible_to_roles: UserRole[]
  sidebar_order: number
  icon?: string
  route?: string
  created_at: string
  updated_at: string
}

export interface UserFeatureSetting {
  id: string
  user_id: string
  feature_key: string
  enabled: boolean
  created_at: string
  updated_at: string
}

// Dashboard stats types
export interface DashboardStats {
  totalArtists: number
  totalReleases: number
  totalTracks: number
  totalRevenue: number
  pendingPayouts: number
  activeContracts: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'release' | 'artist' | 'contract' | 'payment' | 'track'
  title: string
  description: string
  timestamp: string
}

// Chart data types
export interface RevenueChartData {
  month: string
  revenue: number
  expenses: number
}

export interface StreamsChartData {
  platform: string
  streams: number
  fill: string
}
