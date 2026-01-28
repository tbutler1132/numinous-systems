# components/

Reusable React components for the Projection app.

## Structure

```
components/
└── prism/    # Spatial navigation system (main component system)
```

## Prism

The primary component system in this app. Provides a game-like navigation overlay with:
- Minimap location indicator
- Zoomable/pannable map view
- Device feature panels (Dashboard)
- Mouse-tracking crosshairs

See `prism/about.md` for details.

## Adding Components

New shared components should go directly in `components/` or in a subfolder if they're a system (multiple related components working together).
