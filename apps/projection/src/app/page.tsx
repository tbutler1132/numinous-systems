import Link from 'next/link'
import index from '../../public/index.json'

export default function Home() {
  return (
    <main>
      <h1>Projection</h1>
      <p>A navigable interface for exploring the system.</p>

      <div style={{ marginTop: '2rem' }}>
        {index.sections.map((section) => (
          <Link
            key={section.path}
            href={`/s/${section.path}`}
            className="section-card"
          >
            <h2>{section.name}</h2>
          </Link>
        ))}
      </div>
    </main>
  )
}
