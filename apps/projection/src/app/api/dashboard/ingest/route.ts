import { NextResponse } from 'next/server'
import { ingestChaseCSV } from '@/services/dashboard'

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
    const result = await ingestChaseCSV(content, file.name)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: `Error: ${err instanceof Error ? err.message : err}`,
    })
  }
}
