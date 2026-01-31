import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle errors from Google
  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings/drive?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/settings/drive?error=no_code', request.url)
    )
  }

  try {
    const supabase = await createClient()

    // Get OAuth config from settings or env
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'google_drive_client_id',
        'google_drive_client_secret',
        'google_drive_redirect_uri',
      ])

    const settingsMap = (settings || []).reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    const clientId = settingsMap.google_drive_client_id || process.env.GOOGLE_CLIENT_ID
    const clientSecret = settingsMap.google_drive_client_secret || process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = settingsMap.google_drive_redirect_uri || process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/drive?error=missing_config', request.url)
      )
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/drive?error=no_refresh_token', request.url)
      )
    }

    // Save refresh token to database
    await supabase
      .from('settings')
      .upsert(
        {
          key: 'google_drive_refresh_token',
          value: tokens.refresh_token,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/dashboard/settings/drive?success=connected', request.url)
    )
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard/settings/drive?error=token_exchange_failed', request.url)
    )
  }
}
