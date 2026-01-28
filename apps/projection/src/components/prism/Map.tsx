'use client'

import Link from 'next/link'
import type { Surface } from '@/lib/data'

export type MapView = 'local' | 'world'

export interface MapNode {
  id: string
  name: string
  description?: string
  isCurrentNode: boolean
}

interface MapProps {
  view: MapView
  nodes: MapNode[]
  locations: Surface[]
  externalSurfaces: Surface[]
  currentPath: string
  currentNodeId: string
  currentNodeName: string
  isAuthenticated: boolean
  onNavigate: (path: string) => void
  onToggleView: () => void
  onSelectNode: (nodeId: string) => void
}

const POSITIONS = [
  { left: '10%', top: '14%' },
  { left: '26%', top: '36%' },
  { left: '14%', top: '55%' },
  { left: '38%', top: '68%' },
]

const NODE_POSITIONS = [
  { left: '35%', top: '40%' },
  { left: '55%', top: '25%' },
  { left: '20%', top: '60%' },
]

export function Map({
  view,
  nodes,
  locations,
  externalSurfaces,
  currentPath,
  currentNodeId,
  currentNodeName,
  isAuthenticated,
  onNavigate,
  onToggleView,
  onSelectNode,
}: MapProps) {
  return (
    <div className="spatial-nav-map">
      <button className="map-node-context" onClick={onToggleView}>
        <span className="map-node-name">
          {view === 'local' ? `${currentNodeName} map` : 'World map'}
        </span>
        <span className="map-view-toggle">{view === 'local' ? '↑' : '↓'}</span>
      </button>

      {view === 'local' && (
        <>
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
        </>
      )}

      {view === 'world' && (
        <>
          {nodes.map((node, i) => {
            const pos = NODE_POSITIONS[i] ?? { left: `${25 + i * 15}%`, top: `${30 + i * 12}%` }

            return (
              <button
                key={node.id}
                className={`spatial-nav-node${node.isCurrentNode ? ' current' : ''}${node.id === currentNodeId ? ' active' : ''}`}
                style={pos}
                onClick={() => onSelectNode(node.id)}
              >
                <span className="spatial-nav-node-marker" />
                <span className="spatial-nav-node-label">{node.name}</span>
                {node.isCurrentNode && <span className="spatial-nav-node-you">You are here</span>}
              </button>
            )
          })}

          <div className="map-legend">
            <span className="map-legend-item">
              <span className="map-legend-dot category-node" />
              <span className="map-legend-label">Node</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}
