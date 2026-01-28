import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidToken, getAuthCookieOptions, AUTH_COOKIE_NAME } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body as { token?: string }

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const options = getAuthCookieOptions()
    cookieStore.set(AUTH_COOKIE_NAME, token, options)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
