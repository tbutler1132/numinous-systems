import Link from 'next/link'
import index from '../../../../public/index.json'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ section: string }>
}

export async function generateStaticParams() {
  return index.sections.map((s) => ({ section: s.path }))
}

export default async function SectionPage({ params }: Props) {
  const { section } = await params
  const sectionMeta = index.sections.find((s) => s.path === section)
  if (!sectionMeta) notFound()

  const topLevelItems = index.items.filter(
    (item) => item.section === sectionMeta.name && item.path === section
  )

  const sectionRoot = topLevelItems[0]
  const childItems = sectionRoot
    ? index.items.filter((item) => sectionRoot.children.includes(item.id))
    : []

  return (
    <main>
      <div className="breadcrumb">
        <Link href="/">Home</Link> / {sectionMeta.name}
      </div>

      <h1>{sectionMeta.name}</h1>

      {sectionRoot && (
        <p style={{ marginTop: '1rem' }}>
          <Link href={`/p/${sectionRoot.id}`}>Read {sectionMeta.name} overview →</Link>
        </p>
      )}

      {childItems.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Exhibits</h2>
          <ul className="exhibit-list">
            {childItems.map((item) => (
              <li key={item.id}>
                <Link href={`/p/${item.id}`}>{item.title}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
