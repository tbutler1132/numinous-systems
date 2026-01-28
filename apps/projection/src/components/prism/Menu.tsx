/**
 * @file Menu - Sidebar navigation within the Prism overlay.
 *
 * Displays tabs for:
 * - Map: The main navigation view
 * - Device features: Dashboard, etc. (from surfaces with kind='device')
 *
 * Shows lock icons for features requiring authentication.
 */
'use client'

import type { AccessLevel } from '@numinous-systems/identity'
import type { Surface } from '@/lib/data'

/** Tab identifier - 'map' or a device surface path */
export type FacetId = 'map' | string

/** Configuration for a menu tab */
export interface MenuPage {
  /** Unique identifier (matches FacetId) */
  id: FacetId
  /** Display label for the tab */
  label: string
  /** Optional path for device surfaces */
  path?: string
  /** Access level required to use this tab */
  requiredAccess?: AccessLevel
}

/** Props for the Menu component */
/** Props for the Menu component */
interface MenuProps {
  /** Available menu tabs */
  pages: MenuPage[]
  /** Currently active tab */
  activePage: FacetId
  /** Whether user is authenticated (affects locked tabs) */
  isAuthenticated: boolean
  /** Called when user switches tabs */
  onPageChange: (page: FacetId) => void
  /** Called on mouse enter (used to hide crosshairs) */
  onMouseEnter?: () => void
  /** Called on mouse leave (used to show crosshairs) */
  onMouseLeave?: () => void
}

/**
 * Menu component - sidebar tab navigation.
 *
 * Displays tabs for Map and device features. Locked tabs (requiring
 * authentication) are disabled with a lock icon.
 */
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
        const isLocked = page.requiredAccess !== undefined && page.requiredAccess !== 'anonymous' && !isAuthenticated

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

      <div className="prism-status">
        <span className="prism-status-dot" />
        <span className="prism-status-text">Online</span>
      </div>
    </nav>
  )
}

/**
 * Builds the menu page configuration from device surfaces.
 *
 * Creates a MenuPage for the Map tab plus one for each device surface.
 *
 * @param deviceFeatures - Surfaces with kind='device'
 * @returns Array of MenuPage configurations
 */
export function buildMenuPages(deviceFeatures: Surface[]): MenuPage[] {
  return [
    { id: 'map', label: 'Map' },
    ...deviceFeatures.map(d => ({
      id: d.path,
      label: d.name,
      path: d.path,
      requiredAccess: d.requiredAccess,
    })),
  ]
}
