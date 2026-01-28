'use client'

import Link from 'next/link'
import type { Surface } from '@/lib/data'

interface MapProps {
  locations: Surface[]
  externalSurfaces: Surface[]
  currentPath: string
  currentNodeId: string
  currentNodeName: string
  isAuthenticated: boolean
  onNavigate: (path: string) => void
}

const POSITIONS = [
  { left: '10%', top: '14%' },
  { left: '26%', top: '36%' },
  { left: '14%', top: '55%' },
  { left: '38%', top: '68%' },
]

export function Map({
  locations,
  externalSurfaces,
  currentPath,
  currentNodeId,
  currentNodeName,
  isAuthenticated,
  onNavigate,
}: MapProps) {
  return (
    <div className="spatial-nav-map">
      <div className="map-node-context">
        <span className="map-node-name">{currentNodeName} map</span>
      </div>
      {locations.map((surface, i) => {
        const isActive = surface.path === currentPath
        const isLocked = surface.requiredAccess !== 'anonymous' && !isAuthenticated
        const pos = POSITIONS[i] ?? { left: `${10 + i * 12}%`, top: `${14 + i * 18}%` }

        return (
          <Link
            key={surface.path}
            href={surface.path}
            className={`spatial-nav-surface${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}`}
            style={pos}
            onClick={() => onNavigate(surface.path)}
          >
            <span
              className={`spatial-nav-marker${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}${surface.category ? ` category-${surface.category}` : ''}`}
            />
            <span className="spatial-nav-label">{surface.name}</span>
            {isLocked && <span className="spatial-nav-lock">⟠</span>}
          </Link>
        )
      })}

      {externalSurfaces.length > 0 && (
        <div className="map-exit-zone">
          <span className="map-exit-label">External</span>
          {externalSurfaces.map((surface) => (
            <a
              key={surface.path}
              href={surface.path}
              className="map-exit-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {surface.name} <span className="spatial-nav-arrow">↗</span>
            </a>
          ))}
        </div>
      )}

      <div className="map-legend">
        <span className="map-legend-item">
          <span className="map-legend-dot category-exhibit" />
          <span className="map-legend-label">Exhibit</span>
        </span>
        <span className="map-legend-item">
          <span className="map-legend-dot category-external" />
          <span className="map-legend-label">External</span>
        </span>
      </div>
    </div>
  )
}
