'use client'

import type { Surface } from '@/lib/data'

export type FacetId = 'map' | string

export interface MenuPage {
  id: FacetId
  label: string
  path?: string
  visibility?: 'public' | 'private'
}

interface MenuProps {
  pages: MenuPage[]
  activePage: FacetId
  isAuthenticated: boolean
  onPageChange: (page: FacetId) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function Menu({
  pages,
  activePage,
  isAuthenticated,
  onPageChange,
  onMouseEnter,
  onMouseLeave,
}: MenuProps) {
  return (
    <nav
      className="game-menu-sidebar"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {pages.map((page) => {
        const isLocked = page.visibility === 'private' && !isAuthenticated

        return (
          <button
            key={page.id}
            className={`game-menu-tab${activePage === page.id ? ' active' : ''}${isLocked ? ' locked' : ''}`}
            onClick={() => onPageChange(page.id)}
            disabled={isLocked}
          >
            {page.label}
            {isLocked && <span className="game-menu-lock">⟠</span>}
          </button>
        )
      })}
    </nav>
  )
}

export function buildMenuPages(deviceFeatures: Surface[]): MenuPage[] {
  return [
    { id: 'map', label: 'Map' },
    ...deviceFeatures.map(d => ({
      id: d.path,
      label: d.name,
      path: d.path,
      visibility: d.visibility,
    })),
  ]
}
