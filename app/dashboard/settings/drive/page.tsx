'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Cloud,
  CloudOff,
  RefreshCw,
  Save,
  Link2,
  Unlink,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface DriveStatus {
  connected: boolean
  email?: string
  error?: string
}

export default function DriveSettingsPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [driveStatus, setDriveStatus] = useState<DriveStatus>({ connected: false })
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    refreshToken: '',
    folderId: '',
  })

  useEffect(() => {
    checkAdminAndLoadConfig()
  }, [])

  const checkAdminAndLoadConfig = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)

      // Load settings from database
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'google_drive_client_id',
          'google_drive_client_secret',
          'google_drive_redirect_uri',
          'google_drive_refresh_token',
          'google_drive_folder_id',
        ])

      if (settings) {
        const settingsMap = settings.reduce((acc, s) => {
          acc[s.key] = s.value
          return acc
        }, {} as Record<string, string>)

        setConfig({
          clientId: settingsMap.google_drive_client_id || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          clientSecret: settingsMap.google_drive_client_secret || '',
          redirectUri: settingsMap.google_drive_redirect_uri || `${window.location.origin}/api/auth/google/callback`,
          refreshToken: settingsMap.google_drive_refresh_token || '',
          folderId: settingsMap.google_drive_folder_id || '',
        })
      }

      // Check Drive connection status
      await checkDriveConnection()
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkDriveConnection = async () => {
    try {
      const response = await fetch('/api/drive/status')
      const data = await response.json()
      setDriveStatus(data)
    } catch {
      setDriveStatus({ connected: false, error: 'Failed to check connection' })
    }
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    setMessage(null)
    
    try {
      const supabase = createClient()
      
      const settingsToSave = [
        { key: 'google_drive_client_id', value: config.clientId },
        { key: 'google_drive_client_secret', value: config.clientSecret },
        { key: 'google_drive_redirect_uri', value: config.redirectUri },
        { key: 'google_drive_refresh_token', value: config.refreshToken },
        { key: 'google_drive_folder_id', value: config.folderId },
      ]

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('settings')
          .upsert(
            { key: setting.key, value: setting.value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )
        
        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Configuration saved successfully!' })
      await checkDriveConnection()
    } catch (error) {
      console.error('Failed to save config:', error)
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnectDrive = async () => {
    if (!config.clientId || !config.redirectUri) {
      setMessage({ type: 'error', text: 'Please save Client ID and Redirect URI first' })
      return
    }

    setIsConnecting(true)
    
    // Build OAuth URL
    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly')
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${config.clientId}` +
      `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=drive_settings`

    // Open OAuth in new window
    window.open(oauthUrl, 'google_oauth', 'width=600,height=700')
    setShowConnectDialog(false)
    setIsConnecting(false)
  }

  const handleDisconnect = async () => {
    try {
      const supabase = createClient()
      await supabase
        .from('settings')
        .update({ value: '' })
        .eq('key', 'google_drive_refresh_token')
      
      setConfig(prev => ({ ...prev, refreshToken: '' }))
      setDriveStatus({ connected: false })
      setMessage({ type: 'success', text: 'Google Drive disconnected' })
    } catch (error) {
      console.error('Failed to disconnect:', error)
      setMessage({ type: 'error', text: 'Failed to disconnect Google Drive' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Google Drive Settings</h1>
          <p className="text-muted-foreground">
            Configure Google Drive integration for track uploads
          </p>
        </div>
      </div>

      {/* Status Alert */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {driveStatus.connected ? (
                <Cloud className="h-6 w-6 text-primary" />
              ) : (
                <CloudOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>
                  {driveStatus.connected
                    ? `Connected as ${driveStatus.email}`
                    : 'Not connected to Google Drive'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={driveStatus.connected ? 'default' : 'secondary'}>
              {driveStatus.connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {driveStatus.connected ? (
              <>
                <Button variant="outline" onClick={checkDriveConnection}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Unlink className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Disconnect Google Drive?</DialogTitle>
                      <DialogDescription>
                        This will remove the connection to Google Drive. Existing uploaded
                        tracks will remain accessible, but new uploads will fail.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect Google Drive
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect Google Drive</DialogTitle>
                    <DialogDescription>
                      You will be redirected to Google to authorize access to your Drive.
                      Make sure you have saved your Client ID and Redirect URI first.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Ensure your Google Cloud Console OAuth consent screen is configured
                        and the redirect URI is added to authorized redirect URIs.
                      </AlertDescription>
                    </Alert>
                    <Button
                      className="w-full"
                      onClick={handleConnectDrive}
                      disabled={isConnecting || !config.clientId}
                    >
                      {isConnecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      )}
                      Authorize with Google
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OAuth Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Configuration</CardTitle>
          <CardDescription>
            Configure Google Cloud OAuth credentials for Drive access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={config.clientId}
                onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder="Your Google OAuth Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={config.clientSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder="Your Google OAuth Client Secret"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="redirectUri">Redirect URI</Label>
            <Input
              id="redirectUri"
              value={config.redirectUri}
              onChange={(e) => setConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
              placeholder="https://your-domain.com/api/auth/google/callback"
            />
            <p className="text-xs text-muted-foreground">
              Add this URI to your Google Cloud Console OAuth settings
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refreshToken">Refresh Token</Label>
            <Input
              id="refreshToken"
              type="password"
              value={config.refreshToken}
              onChange={(e) => setConfig(prev => ({ ...prev, refreshToken: e.target.value }))}
              placeholder="Automatically set after connecting"
              readOnly={driveStatus.connected}
            />
            <p className="text-xs text-muted-foreground">
              This is automatically set when you connect your Google account
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Folder Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Upload Folder
          </CardTitle>
          <CardDescription>
            Specify a Google Drive folder ID where tracks will be uploaded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folderId">Folder ID (Optional)</Label>
            <Input
              id="folderId"
              value={config.folderId}
              onChange={(e) => setConfig(prev => ({ ...prev, folderId: e.target.value }))}
              placeholder="e.g., 1abc123XYZ..."
            />
            <p className="text-xs text-muted-foreground">
              Find the folder ID in the URL when viewing a folder in Google Drive.
              Leave empty to upload to root.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveConfig} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
