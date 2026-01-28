/**
 * @file POST /api/auth/logout - Logout endpoint.
 *
 * Clears the auth cookie, ending the session. Redirects to login
 * are handled client-side after calling this endpoint.
 *
 * Response: { success: true }
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

/**
 * Clears the auth cookie to log out the user.
 */
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
  return NextResponse.json({ success: true })
}
