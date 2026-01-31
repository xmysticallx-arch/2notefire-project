import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// Google Drive OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
})

const drive = google.drive({ version: 'v3', auth: oauth2Client })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    // Check if Google Drive credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return NextResponse.json(
        { message: 'Google Drive not configured' },
        { status: 503 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName || file.name,
        mimeType: file.type,
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID 
          ? [process.env.GOOGLE_DRIVE_FOLDER_ID] 
          : undefined,
      },
      media: {
        mimeType: file.type,
        body: require('stream').Readable.from(buffer),
      },
      fields: 'id, webViewLink, webContentLink',
    })

    // Make file publicly accessible for streaming
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Get updated file info with public links
    const fileInfo = await drive.files.get({
      fileId: response.data.id!,
      fields: 'id, webViewLink, webContentLink',
    })

    return NextResponse.json({
      fileId: fileInfo.data.id,
      webViewLink: fileInfo.data.webViewLink,
      webContentLink: fileInfo.data.webContentLink,
    })
  } catch (error) {
    console.error('Google Drive upload error:', error)
    return NextResponse.json(
      { message: 'Failed to upload to Google Drive' },
      { status: 500 }
    )
  }
}
