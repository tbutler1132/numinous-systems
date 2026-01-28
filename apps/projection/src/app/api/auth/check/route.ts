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
import { AUTH_COOKIE_NAME, shouldBypassAuth } from '@/lib/auth'

/**
 * Checks authentication status and returns result as JSON.
 */
export async function GET(request: NextRequest) {
  if (shouldBypassAuth(request.nextUrl.searchParams)) {
    return NextResponse.json({ authenticated: true })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const expectedToken = process.env.DASHBOARD_TOKEN

  const authenticated = !!(token && expectedToken && token === expectedToken)
  return NextResponse.json({ authenticated })
}
