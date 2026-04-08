import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isPpdbProtected =
    pathname.startsWith('/ppdb/dashboard') ||
    pathname.startsWith('/ppdb/tes')

  const configuredSessionCookieName =
    process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME?.trim() ||
    process.env.SESSION_COOKIE?.trim()

  const possibleSessionCookieNames = [
    configuredSessionCookieName,
    'laravel-session',
    'laravel_session',
    '__session',
  ].filter((name): name is string => Boolean(name && name.length > 0))

  const hasConfiguredSessionCookie = possibleSessionCookieNames.some((cookieName) =>
    Boolean(request.cookies.get(cookieName)?.value),
  )

  const hasGenericSessionCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        /laravel[_-]?session/i.test(cookie.name) ||
        /(?:^|[_-])session$/i.test(cookie.name),
    )

  const hasSessionCookie = hasConfiguredSessionCookie || hasGenericSessionCookie
  const ppdbAuthMarker = request.cookies.get('ppdb_auth')?.value
  const hasPpdbAuthMarker = ppdbAuthMarker === '1' || ppdbAuthMarker === 'true'

  if (isDashboard && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPpdbProtected && !hasSessionCookie && !hasPpdbAuthMarker) {
    return NextResponse.redirect(new URL('/ppdb/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/ppdb/dashboard/:path*',
    '/ppdb/tes/:path*',
  ],
}