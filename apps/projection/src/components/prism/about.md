# prism/

Spatial navigation system - a game-like overlay for navigating between surfaces.

## Concept

The "Prism" metaphor: light enters and splits into different surfaces (locations, devices). Users navigate between these surfaces through an interactive map interface.

## Components

- **Prism.tsx** - Root component that orchestrates the navigation overlay
- **Map.tsx** - Interactive zoomable/pannable map (local and world views)
- **Minimap.tsx** - Always-visible location indicator and trigger button
- **Menu.tsx** - Sidebar tabs for Map and device features
- **Crosshair.tsx** - Mouse-tracking visual overlay

## Hooks

- **useAuth.ts** - Client-side authentication state
- **useCursor.ts** - Cursor/scroll position tracking for minimap arrow
- **useCrosshair** (in Crosshair.tsx) - Crosshair position management

## Views

1. **Local view** - Shows surfaces within the current node (locations you can navigate to)
2. **World view** - Shows all available nodes (for future multi-node support)

## Interaction

- Click minimap or Menu button to open overlay
- Click surface markers to navigate
- Ctrl/Cmd + scroll to zoom
- Drag to pan when zoomed
- Pinch-to-zoom on touch devices
