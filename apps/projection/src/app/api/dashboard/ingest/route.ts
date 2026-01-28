import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ success: false, message: 'Only CSV files are supported' })
    }

    const content = await file.text()
    const scriptPath = join(process.cwd(), 'scripts/dashboard-ingest.ts')

    // Spawn the script and pipe content to stdin
    const result = await new Promise<string>((resolve, reject) => {
      const proc = spawn('npx', ['tsx', scriptPath, file.name], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0 || stdout.includes('"success"')) {
          resolve(stdout)
        } else {
          reject(new Error(stderr || stdout || `Process exited with code ${code}`))
        }
      })

      proc.on('error', reject)

      // Write content to stdin
      proc.stdin.write(content)
      proc.stdin.end()
    })

    const data = JSON.parse(result.trim())
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: `Error: ${err instanceof Error ? err.message : err}`,
    })
  }
}
