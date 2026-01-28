import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const scriptPath = join(process.cwd(), 'scripts/dashboard-status.ts')
    const { stdout } = await execAsync(`npx tsx "${scriptPath}"`, {
      cwd: process.cwd(),
      timeout: 10000,
    })

    const data = JSON.parse(stdout.trim())
    return NextResponse.json(data)
  } catch (err) {
    console.error('Dashboard status error:', err)
    return NextResponse.json({ exists: false, domains: [], recent: [], error: String(err) })
  }
}
