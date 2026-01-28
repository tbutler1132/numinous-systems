import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import surfacesData from './public/data/surfaces.json'

const AUTH_COOKIE_NAME = 'auth_token'

// Extract private surface paths from the generated surfaces data
const privatePaths = surfacesData
  .filter((s) => s.visibility === 'private' && s.type === 'internal')
  .map((s) => s.path.replace(/\/$/, '')) // normalize trailing slashes

function isPrivatePath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '')
  return privatePaths.some(
    (privatePath) => normalized === privatePath || normalized.startsWith(privatePath + '/')
  )
}

function getLoginPath(pathname: string): string {
  const normalized = pathname.replace(/\/$/, '')
  // Find which private surface this path belongs to
  const matchedPath = privatePaths.find(
    (p) => normalized === p || normalized.startsWith(p + '/')
  )
  return matchedPath ? `${matchedPath}/login/` : '/login/'
}

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

  // Check auth token
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const expectedToken = process.env.DASHBOARD_TOKEN

  if (!token || !expectedToken || token !== expectedToken) {
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
