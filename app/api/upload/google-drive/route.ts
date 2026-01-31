import { NextRequest, NextResponse } from 'next/server'
import { uploadToDrive, getDriveConfig, getStreamingUrl } from '@/lib/google-drive'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Drive
    const result = await uploadToDrive(
      buffer,
      fileName || file.name,
      file.type || 'audio/wav',
      config.folderId
    )

    if (!result) {
      return NextResponse.json(
        { message: 'Failed to upload to Google Drive' },
        { status: 500 }
      )
    }

    // If trackId provided, update the track with Drive metadata
    if (trackId) {
      const supabase = await createClient()
      await supabase
        .from('tracks')
        .update({
          audio_url: getStreamingUrl(result.fileId),
          drive_file_id: result.fileId,
          drive_file_name: result.name,
          drive_file_size: result.size,
          drive_mime_type: result.mimeType,
          drive_web_view_link: result.webViewLink,
          drive_web_content_link: result.webContentLink,
          drive_upload_status: 'completed',
          drive_uploaded_at: new Date().toISOString(),
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
    })
  } catch (error) {
    console.error('Google Drive upload error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to upload to Google Drive' },
      { status: 500 }
    )
  }
}
