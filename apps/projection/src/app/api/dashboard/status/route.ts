import { NextResponse } from 'next/server'
import { getDashboardStatus } from '@/services/dashboard'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const status = await getDashboardStatus()
    return NextResponse.json(status)
  } catch (err) {
    console.error('Dashboard status error:', err)
    return NextResponse.json({
      exists: false,
      domains: [],
      recent: [],
      error: String(err),
    })
  }
}
