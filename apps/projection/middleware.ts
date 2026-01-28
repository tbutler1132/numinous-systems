import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = 'auth_token'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /dashboard/* routes, except /dashboard/login
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Allow access to login page
  if (pathname === '/dashboard/login' || pathname === '/dashboard/login/') {
    return NextResponse.next()
  }

  // Check auth token
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const expectedToken = process.env.DASHBOARD_TOKEN

  if (!token || !expectedToken || token !== expectedToken) {
    const loginUrl = new URL('/dashboard/login/', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}
