import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = 'auth_token'
const isDev = process.env.NODE_ENV === 'development'

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
