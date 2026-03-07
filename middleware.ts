import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  const sessionCookie = 
    request.cookies.get('laravel-session') ||   
    request.cookies.get('laravel_session') ||
    request.cookies.get('XSRF-TOKEN')

  if (isDashboard && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}