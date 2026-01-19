import * as fs from 'fs'
import * as path from 'path'
import { parse as parseYaml } from 'yaml'
import { globSync } from 'glob'
import matter from 'gray-matter'

const ROOT = path.resolve(__dirname, '../../..')
const CONFIG_PATH = path.resolve(__dirname, '../projection.yml')
const OUTPUT_PATH = path.resolve(__dirname, '../public/index.json')

interface Section {
  name: string
  path: string
}

interface Config {
  sections: Section[]
  exclude: string[]
  surfaceFiles: string[]
  maxDepth: number
}

interface Item {
  id: string
  section: string
  title: string
  path: string
  surfacePath: string
  children: string[]
}

interface Index {
  generatedAt: string
  sections: Section[]
  items: Item[]
}

function loadConfig(): Config {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
  return parseYaml(raw) as Config
}

function findSurface(dirPath: string, surfaceFiles: string[]): string | null {
  for (const sf of surfaceFiles) {
    const fullPath = path.join(dirPath, sf)
    if (fs.existsSync(fullPath)) {
      return sf
    }
  }
  return null
}

function extractTitle(filePath: string, fallback: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data, content: body } = matter(content)

    if (data.title) return data.title

    const h1Match = body.match(/^#\s+(.+)$/m)
    if (h1Match) return h1Match[1]

    return fallback
  } catch {
    return fallback
  }
}

function isExcluded(p: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
    return regex.test(p)
  })
}

function walkSection(
  sectionName: string,
  sectionPath: string,
  config: Config
): Item[] {
  const items: Item[] = []
  const fullSectionPath = path.join(ROOT, sectionPath)

  if (!fs.existsSync(fullSectionPath)) return items

  function walk(dirPath: string, depth: number, parentId: string | null) {
    if (depth > config.maxDepth) return

    const relativePath = path.relative(ROOT, dirPath)
    if (isExcluded(relativePath, config.exclude)) return

    const surface = findSurface(dirPath, config.surfaceFiles)
    if (!surface) return

    const id = relativePath
    const surfacePath = path.join(relativePath, surface)
    const title = extractTitle(path.join(ROOT, surfacePath), path.basename(dirPath))

    const item: Item = {
      id,
      section: sectionName,
      title,
      path: relativePath,
      surfacePath,
      children: []
    }

    items.push(item)

    // Find children
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const childPath = path.join(dirPath, entry.name)
      const childRelative = path.relative(ROOT, childPath)

      if (isExcluded(childRelative, config.exclude)) continue

      const childSurface = findSurface(childPath, config.surfaceFiles)
      if (childSurface) {
        item.children.push(childRelative)
        walk(childPath, depth + 1, id)
      }
    }
  }

  walk(fullSectionPath, 1, null)
  return items
}

function generate() {
  const config = loadConfig()
  const allItems: Item[] = []

  for (const section of config.sections) {
    const items = walkSection(section.name, section.path, config)
    allItems.push(...items)
  }

  const index: Index = {
    generatedAt: new Date().toISOString(),
    sections: config.sections,
    items: allItems
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2))

  console.log(`Generated index with ${allItems.length} items`)
}

generate()
