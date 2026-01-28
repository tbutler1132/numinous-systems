'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const surfaces = [
  { name: 'Home', path: '/' },
  { name: "Hero's Journey", path: '/heros-journey/' },
]

export default function SpatialNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const current = surfaces.find(
    (s) => s.path === pathname || (s.path !== '/' && pathname.startsWith(s.path))
  ) ?? surfaces[0]

  return (
    <>
      <button
        className="spatial-nav-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        {current.name}
      </button>

      {open && (
        <div className="spatial-nav-overlay" onClick={() => setOpen(false)}>
          <button
            className="spatial-nav-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            &times;
          </button>
          <nav className="spatial-nav-map" onClick={(e) => e.stopPropagation()}>
            {surfaces.map((surface) => (
              <Link
                key={surface.path}
                href={surface.path}
                className={`spatial-nav-surface${surface.path === current.path ? ' active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {surface.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
