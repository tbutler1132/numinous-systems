'use client'

/**
 * ExploreEnvironment - The walkable 3D world within a node.
 *
 * Surfaces are placed as physical locations you can walk toward.
 * This is a basic prototype - eventually this becomes a custom-designed space.
 */

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { WorldLocation } from '@/contexts/WorldContext'

interface ExploreEnvironmentProps {
  surfaces: WorldLocation[]
}

/**
 * A surface portal - a glowing doorway you can walk toward.
 */
function SurfacePortal({
  surface,
  position,
}: {
  surface: WorldLocation
  position: [number, number, number]
}) {
  const color = surface.category === 'plaza' ? '#fbbf24' : '#2dd4bf'

  return (
    <group position={position}>
      {/* Portal frame */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* Glowing edges */}
      <lineSegments position={[0, 1.5, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(2, 3, 0.1)]} />
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>

      {/* Portal glow */}
      <pointLight color={color} intensity={2} distance={8} position={[0, 1.5, 0]} />

      {/* Label */}
      <Text
        position={[0, 3.2, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="bottom"
        font={undefined}
      >
        {surface.name}
      </Text>

      {/* Ground marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

/**
 * Ground plane with grid.
 */
function Ground() {
  return (
    <group>
      {/* Solid ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>

      {/* Grid overlay */}
      <gridHelper
        args={[100, 50, '#1a1a1a', '#1a1a1a']}
        position={[0, 0.01, 0]}
      />
    </group>
  )
}

/**
 * Simple skybox - just a color for now.
 */
function Sky() {
  return (
    <mesh>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial color="#050510" side={THREE.BackSide} />
    </mesh>
  )
}

/**
 * Main exploration environment.
 */
export function ExploreEnvironment({ surfaces }: ExploreEnvironmentProps) {
  // Position surfaces in a circle around the origin
  const surfacePositions = useMemo(() => {
    const radius = 10
    return surfaces.map((surface, i) => {
      const angle = (i / surfaces.length) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      return {
        surface,
        position: [x, 0, z] as [number, number, number],
      }
    })
  }, [surfaces])

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.3} />

      {/* Sky dome */}
      <Sky />

      {/* Ground */}
      <Ground />

      {/* Surface portals */}
      {surfacePositions.map(({ surface, position }) => (
        <SurfacePortal
          key={surface.path}
          surface={surface}
          position={position}
        />
      ))}

      {/* Center marker - "you are here" */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
    </>
  )
}
