/**
 * @file GET /api/sensors/registry - Sensor registry endpoint.
 *
 * Returns available sensors from the registry and which sensors
 * are enabled for the requested node.
 *
 * Query params:
 * - node: Node ID to check enabled sensors for (default: 'personal')
 *
 * Used by SensorsClient to display sensor availability.
 */

import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import {
  registry,
  registerSensor,
  loadNodeSensorConfig,
  type SensorDescriptor,
} from '@numinous-systems/sensor'
import { sensor as financeSensor } from '@numinous-systems/finance'
import { findWorkspaceRoot } from '@/lib/workspace'

/** Disable Next.js caching for this route */
export const dynamic = 'force-dynamic'

// Register known sensors on module load
// This is idempotent - if already registered, it will throw, so we catch
try {
  registerSensor(financeSensor)
} catch {
  // Already registered
}

/** Response shape for the registry endpoint */
export interface RegistryResponse {
  /** All registered sensors */
  sensors: SensorDescriptor[]
  /** Sensor IDs enabled for the requested node */
  enabled: string[]
}

/**
 * Returns the sensor registry and node configuration.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const nodeId = searchParams.get('node') ?? 'personal'

    const workspaceRoot = findWorkspaceRoot()
    const nodePath = join(workspaceRoot, 'nodes', nodeId)

    const sensors = registry.list()
    const config = loadNodeSensorConfig(nodePath)

    const response: RegistryResponse = {
      sensors,
      enabled: config.sensors,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('Sensor registry error:', err)
    return NextResponse.json(
      { sensors: [], enabled: [], error: String(err) },
      { status: 500 }
    )
  }
}
