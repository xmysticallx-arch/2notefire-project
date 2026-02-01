import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Define route permissions
const routePermissions: Record<string, string[]> = {
  '/dashboard': ['admin', 'user', 'artist', 'finance'],
  '/dashboard/artists': ['admin', 'user'],
  '/dashboard/releases': ['admin', 'user', 'artist'],
  '/dashboard/tracks': ['admin', 'user', 'artist'],
  '/dashboard/accounting': ['admin', 'finance'],
  '/dashboard/royalties': ['admin', 'finance', 'artist'],
  '/dashboard/analytics': ['admin', 'user', 'finance'],
  '/dashboard/contracts': ['admin'],
  '/dashboard/notifications': ['admin', 'user', 'artist', 'finance'],
  '/dashboard/settings': ['admin', 'user', 'artist', 'finance'],
  '/dashboard/settings/users': ['admin'],
  '/dashboard/settings/features': ['admin'],
  '/dashboard/settings/drive': ['admin'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for non-dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Create supabase client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'user'

  // Check route permissions
  for (const [route, allowedRoles] of Object.entries(routePermissions)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect to dashboard with error
        const redirectUrl = new URL('/dashboard', request.url)
        redirectUrl.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(redirectUrl)
      }
      break
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes
     * - auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|auth).*)',
  ],
}
