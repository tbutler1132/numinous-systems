/**
 * @file Next.js middleware for route protection.
 *
 * Intercepts requests to check authentication for private surfaces.
 * Private surfaces are determined from the generated surfaces.json data.
 *
 * Behavior:
 * - Public surfaces: Allow through
 * - Private surfaces: Redirect to login if unauthenticated
 * - Login pages: Always allow through
 * - Dev mode: Bypasses auth unless ?locked param is present
 *
 * @see surfaces.json - Defines which paths are private
 * @see lib/auth.ts - Token validation utilities
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import surfacesData from './public/data/surfaces.json'
import { AUTH_COOKIE_NAME, shouldBypassAuth } from './src/lib/auth'

/**
 * Private surface paths extracted from surfaces.json.
 * These paths require authentication to access.
 */
const privatePaths = surfacesData
  .filter((s) => s.visibility === 'private' && s.type === 'internal')
  .map((s) => s.path.replace(/\/$/, '')) // normalize trailing slashes

/**
 * Checks if a pathname requires authentication.
 *
 * @param pathname - URL pathname to check
 * @returns True if the path is a private surface
 */
function isPrivatePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '')
  return privatePaths.some(
    (privatePath) => normalized === privatePath || normalized.startsWith(privatePath + '/')
  )
}

/**
 * Gets the appropriate login page for a private path.
 *
 * Each private surface has its own login page (e.g., /dashboard/login).
 *
 * @param pathname - The protected path being accessed
 * @returns Login page path for that surface
 */
function getLoginPath(pathname: string): string {
  const normalized = pathname.replace(/\/$/, '')
  // Find which private surface this path belongs to
  const matchedPath = privatePaths.find(
    (p) => normalized === p || normalized.startsWith(p + '/')
  )
  return matchedPath ? `${matchedPath}/login/` : '/login/'
}

/**
 * Checks if the request is authenticated.
 *
 * In dev mode, bypasses auth unless ?locked is in the URL.
 * In production, validates the auth cookie against DASHBOARD_TOKEN.
 *
 * @param request - Incoming Next.js request
 * @returns True if authenticated
 */
function isAuthenticated(request: NextRequest): boolean {
  if (shouldBypassAuth(request.nextUrl.searchParams)) {
    return true
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const expectedToken = process.env.DASHBOARD_TOKEN
  return !!(token && expectedToken && token === expectedToken)
}

/**
 * Next.js middleware handler.
 *
 * Checks authentication for private surfaces and redirects to login
 * if unauthenticated. Login pages within private surfaces are always
 * allowed through.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is a private surface
  if (!isPrivatePath(pathname)) {
    return NextResponse.next()
  }

  // Allow access to login pages within private surfaces
  if (pathname.endsWith('/login') || pathname.endsWith('/login/')) {
    return NextResponse.next()
  }

  if (!isAuthenticated(request)) {
    const loginUrl = new URL(getLoginPath(pathname), request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes that don't need protection
    '/((?!_next/static|_next/image|favicon.ico|api/auth/).*)',
  ],
}
