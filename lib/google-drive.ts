'use server'

import { google, drive_v3 } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

// Google Drive configuration types
export interface DriveConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  refreshToken: string
  folderId?: string
}

export interface DriveUploadResult {
  fileId: string
  name: string
  size: number
  mimeType: string
  webViewLink: string
  webContentLink: string
  thumbnailLink?: string
}

export interface DriveFileMetadata {
  id: string
  name: string
  mimeType: string
  size: string
  createdTime: string
  modifiedTime: string
  webViewLink: string
  webContentLink: string
  owners?: { displayName: string; emailAddress: string }[]
}

// Get Google Drive configuration from environment or database
export async function getDriveConfig(): Promise<DriveConfig | null> {
  // First try environment variables
  const envConfig: DriveConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || undefined,
  }

  // Check if env config is complete
  if (envConfig.clientId && envConfig.clientSecret && envConfig.refreshToken) {
    return envConfig
  }

  // Fallback: Try to get from Supabase settings table
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('settings')
      .select('*')
      .in('key', [
        'google_drive_client_id',
        'google_drive_client_secret',
        'google_drive_redirect_uri',
        'google_drive_refresh_token',
        'google_drive_folder_id',
      ])

    if (data && data.length > 0) {
      const settingsMap = data.reduce((acc, s) => {
        acc[s.key] = s.value
        return acc
      }, {} as Record<string, string>)

      if (settingsMap.google_drive_client_id && settingsMap.google_drive_refresh_token) {
        return {
          clientId: settingsMap.google_drive_client_id,
          clientSecret: settingsMap.google_drive_client_secret || '',
          redirectUri: settingsMap.google_drive_redirect_uri || '',
          refreshToken: settingsMap.google_drive_refresh_token,
          folderId: settingsMap.google_drive_folder_id,
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch Drive config from database:', error)
  }

  return null
}

// Create authenticated Drive client
export async function getDriveClient(): Promise<drive_v3.Drive | null> {
  const config = await getDriveConfig()
  if (!config) return null

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  )

  oauth2Client.setCredentials({
    refresh_token: config.refreshToken,
  })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

// Get OAuth URL for connecting Google Drive account
export function getOAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const oauth2Client = new google.auth.OAuth2(clientId, '', redirectUri)
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
    prompt: 'consent',
    state: state || 'drive_connect',
  })
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)
    
    if (tokens.access_token && tokens.refresh_token) {
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      }
    }
    return null
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error)
    return null
  }
}

// Upload file to Google Drive
export async function uploadToDrive(
  file: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<DriveUploadResult | null> {
  const drive = await getDriveClient()
  if (!drive) {
    throw new Error('Google Drive not configured')
  }

  const config = await getDriveConfig()
  const targetFolderId = folderId || config?.folderId

  try {
    // Create file on Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
        parents: targetFolderId ? [targetFolderId] : undefined,
      },
      media: {
        mimeType: mimeType,
        body: require('stream').Readable.from(file),
      },
      fields: 'id, name, size, mimeType, webViewLink, webContentLink, thumbnailLink',
    })

    // Make file publicly accessible for streaming
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Get updated file info
    const fileInfo = await drive.files.get({
      fileId: response.data.id!,
      fields: 'id, name, size, mimeType, webViewLink, webContentLink, thumbnailLink',
    })

    return {
      fileId: fileInfo.data.id!,
      name: fileInfo.data.name!,
      size: parseInt(fileInfo.data.size || '0'),
      mimeType: fileInfo.data.mimeType!,
      webViewLink: fileInfo.data.webViewLink!,
      webContentLink: fileInfo.data.webContentLink!,
      thumbnailLink: fileInfo.data.thumbnailLink || undefined,
    }
  } catch (error) {
    console.error('Drive upload error:', error)
    throw error
  }
}

// Get file metadata from Drive
export async function getFileMetadata(fileId: string): Promise<DriveFileMetadata | null> {
  const drive = await getDriveClient()
  if (!drive) return null

  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, owners',
    })

    return {
      id: response.data.id!,
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      size: response.data.size || '0',
      createdTime: response.data.createdTime!,
      modifiedTime: response.data.modifiedTime!,
      webViewLink: response.data.webViewLink!,
      webContentLink: response.data.webContentLink!,
      owners: response.data.owners?.map(o => ({
        displayName: o.displayName || '',
        emailAddress: o.emailAddress || '',
      })),
    }
  } catch (error) {
    console.error('Failed to get file metadata:', error)
    return null
  }
}

// Delete file from Drive
export async function deleteFromDrive(fileId: string): Promise<boolean> {
  const drive = await getDriveClient()
  if (!drive) return false

  try {
    await drive.files.delete({ fileId })
    return true
  } catch (error) {
    console.error('Failed to delete file from Drive:', error)
    return false
  }
}

// List files in folder
export async function listDriveFiles(
  folderId?: string,
  pageSize: number = 50
): Promise<DriveFileMetadata[]> {
  const drive = await getDriveClient()
  if (!drive) return []

  const config = await getDriveConfig()
  const targetFolderId = folderId || config?.folderId

  try {
    const query = targetFolderId 
      ? `'${targetFolderId}' in parents and trashed = false`
      : 'trashed = false'

    const response = await drive.files.list({
      q: query,
      pageSize,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, owners)',
      orderBy: 'createdTime desc',
    })

    return (response.data.files || []).map(f => ({
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      size: f.size || '0',
      createdTime: f.createdTime!,
      modifiedTime: f.modifiedTime!,
      webViewLink: f.webViewLink!,
      webContentLink: f.webContentLink!,
      owners: f.owners?.map(o => ({
        displayName: o.displayName || '',
        emailAddress: o.emailAddress || '',
      })),
    }))
  } catch (error) {
    console.error('Failed to list Drive files:', error)
    return []
  }
}

// Get streaming URL for audio file
export function getStreamingUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}

// Verify Drive connection
export async function verifyDriveConnection(): Promise<{
  connected: boolean
  email?: string
  error?: string
}> {
  const drive = await getDriveClient()
  if (!drive) {
    return { connected: false, error: 'Drive not configured' }
  }

  try {
    const about = await drive.about.get({ fields: 'user' })
    return {
      connected: true,
      email: about.data.user?.emailAddress || undefined,
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}
