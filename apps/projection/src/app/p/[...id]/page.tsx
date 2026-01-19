import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Markdown from 'react-markdown'
import index from '../../../../public/index.json'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string[] }>
}

export async function generateStaticParams() {
  return index.items.map((item) => ({
    id: item.id.split('/'),
  }))
}

export default async function GalleryPage({ params }: Props) {
  const { id } = await params
  const itemId = id.join('/')
  const item = index.items.find((i) => i.id === itemId)

  if (!item) notFound()

  const ROOT = path.resolve(process.cwd(), '../..')
  const surfaceFullPath = path.join(ROOT, item.surfacePath)

  let content = ''
  try {
    const raw = fs.readFileSync(surfaceFullPath, 'utf-8')
    const { content: body } = matter(raw)
    content = body
  } catch {
    content = '*Unable to load content*'
  }

  const childItems = index.items.filter((i) => item.children.includes(i.id))

  const breadcrumbParts = itemId.split('/')
  const breadcrumbs = breadcrumbParts.map((part, idx) => {
    const pathSoFar = breadcrumbParts.slice(0, idx + 1).join('/')
    const matchingItem = index.items.find((i) => i.id === pathSoFar)
    return {
      label: matchingItem?.title || part,
      path: pathSoFar,
      isLast: idx === breadcrumbParts.length - 1,
    }
  })

  return (
    <main>
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        {breadcrumbs.map((bc) => (
          <span key={bc.path}>
            {' / '}
            {bc.isLast ? (
              bc.label
            ) : (
              <Link href={`/p/${bc.path}`}>{bc.label}</Link>
            )}
          </span>
        ))}
      </div>

      <h1>{item.title}</h1>

      <div className="markdown-content">
        <Markdown>{content}</Markdown>
      </div>

      {childItems.length > 0 && (
        <div className="exhibits">
          <h2>Exhibits</h2>
          <ul className="exhibit-list">
            {childItems.map((child) => (
              <li key={child.id}>
                <Link href={`/p/${child.id}`}>{child.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
