import { NextRequest, NextResponse } from 'next/server'
import { uploadToDrive, getDriveConfig, getStreamingUrl, getOrCreateArtistFolder } from '@/lib/google-drive'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user role (admin or user can upload)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'user'].includes(profile.role)) {
      return NextResponse.json(
        { message: 'You do not have permission to upload files' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const artistId = formData.get('artistId') as string | null
    const trackId = formData.get('trackId') as string | null

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    // Check if Google Drive is configured
    const config = await getDriveConfig()
    if (!config) {
      return NextResponse.json(
        { message: 'Google Drive not configured. Please contact an administrator.' },
        { status: 503 }
      )
    }

    // Validate file type for .wav files
    const allowedTypes = ['audio/wav', 'audio/x-wav', 'audio/wave']
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.wav')) {
      return NextResponse.json(
        { message: 'Only .wav files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size must be less than 500MB' },
        { status: 400 }
      )
    }

    // Determine target folder
    let targetFolderId = config.folderId
    let artistFolderCreated = false
    let artistFolderData: { folderId: string; folderName: string } | null = null

    // If artist is specified, create/get artist-specific folder
    if (artistId) {
      const { data: artist } = await supabase
        .from('artists')
        .select('id, name, stage_name, drive_folder_id')
        .eq('id', artistId)
        .single()

      if (artist) {
        try {
          artistFolderData = await getOrCreateArtistFolder(
            artist.id,
            artist.stage_name || artist.name,
            artist.drive_folder_id
          )

          if (artistFolderData) {
            targetFolderId = artistFolderData.folderId

            // Update artist with folder ID if newly created
            if (!artist.drive_folder_id || artist.drive_folder_id !== artistFolderData.folderId) {
              await supabase
                .from('artists')
                .update({
                  drive_folder_id: artistFolderData.folderId,
                  drive_folder_name: artistFolderData.folderName,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', artist.id)
              artistFolderCreated = true
            }
          }
        } catch (folderError) {
          console.error('Failed to create artist folder, using root folder:', folderError)
          // Continue with root folder if artist folder creation fails
        }
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Drive
    const result = await uploadToDrive(
      buffer,
      fileName || file.name,
      file.type || 'audio/wav',
      targetFolderId
    )

    if (!result) {
      return NextResponse.json(
        { message: 'Failed to upload to Google Drive' },
        { status: 500 }
      )
    }

    // If trackId provided, update the track with Drive metadata
    if (trackId) {
      await supabase
        .from('tracks')
        .update({
          audio_url: getStreamingUrl(result.fileId),
          audio_file_url: result.webContentLink,
          audio_file_id: result.fileId,
          drive_file_id: result.fileId,
          drive_file_name: result.name,
          drive_file_size: result.size,
          drive_mime_type: result.mimeType,
          drive_web_view_link: result.webViewLink,
          drive_web_content_link: result.webContentLink,
          drive_upload_status: 'completed',
          drive_uploaded_at: new Date().toISOString(),
          drive_owner_email: user.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trackId)
    }

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      name: result.name,
      size: result.size,
      mimeType: result.mimeType,
      webViewLink: result.webViewLink,
      webContentLink: result.webContentLink,
      streamingUrl: getStreamingUrl(result.fileId),
      artistFolder: artistFolderData ? {
        folderId: artistFolderData.folderId,
        folderName: artistFolderData.folderName,
        newlyCreated: artistFolderCreated,
      } : null,
      uploadedBy: user.id,
    })
  } catch (error) {
    console.error('Google Drive upload error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to upload to Google Drive' },
      { status: 500 }
    )
  }
}
