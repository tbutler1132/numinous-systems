import { readFileSync } from 'fs'
import { join } from 'path'
import ProcessClient, { type ProcessTab } from './ProcessClient'

export const dynamic = 'force-dynamic'

/**
 * Reads a markdown file from nodes/org/process/
 */
function readProcessFile(filename: string): string {
  try {
    const path = join(process.cwd(), '../../nodes/org/process', filename)
    return readFileSync(path, 'utf-8')
  } catch {
    return `*File not found: ${filename}*`
  }
}

export default function ProcessPage() {
  const tabs: ProcessTab[] = [
    { id: 'about', label: 'About', content: readProcessFile('about.md') },
    { id: 'models', label: 'Models', content: readProcessFile('models.md') },
    { id: 'episodes', label: 'Episodes', content: readProcessFile('episodes.md') },
    { id: 'retros', label: 'Retros', content: readProcessFile('retros.md') },
  ]

  return <ProcessClient tabs={tabs} />
}
