/**
 * @file Prism component exports.
 *
 * The Prism system provides spatial navigation - a game-like overlay
 * for navigating between surfaces (pages) in the application.
 *
 * Main component: Prism (default export)
 * Supporting components: Map, Minimap, Menu, Crosshair
 * Hooks: useAuth, useCursor, useCrosshair
 */
export { default } from './Prism'
export { default as Prism } from './Prism'
export { Minimap } from './Minimap'
export { Menu, buildMenuPages } from './Menu'
export { Map } from './Map'
export { Crosshair, useCrosshair } from './Crosshair'
export { useAuth } from './useAuth'
export { useCursor } from './useCursor'
