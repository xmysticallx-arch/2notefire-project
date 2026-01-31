import { NextResponse } from 'next/server'
import { verifyDriveConnection } from '@/lib/google-drive'

export async function GET() {
  try {
    const status = await verifyDriveConnection()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Drive status check error:', error)
    return NextResponse.json({
      connected: false,
      error: 'Failed to check connection',
    })
  }
}
