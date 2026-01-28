/**
 * @file GET /api/auth/check - Authentication status check endpoint.
 *
 * Returns whether the current request is authenticated. Used by the
 * useAuth hook to re-check auth status on the client.
 *
 * Response: { authenticated: boolean }
 *
 * In dev mode, returns authenticated=true unless ?locked param is present.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

/** Cookie name for authentication token */
const AUTH_COOKIE_NAME = 'auth_token'
/** Whether we're in development mode */
const isDev = process.env.NODE_ENV === 'development'

/**
 * Checks authentication status and returns result as JSON.
 */
export async function GET(request: NextRequest) {
  // In dev mode, bypass auth unless ?locked is in the URL
  if (isDev && !request.nextUrl.searchParams.has('locked')) {
    return NextResponse.json({ authenticated: true })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const expectedToken = process.env.DASHBOARD_TOKEN

  const authenticated = !!(token && expectedToken && token === expectedToken)
  return NextResponse.json({ authenticated })
}
