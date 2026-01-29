import { Sensor, SensorDescriptor } from "./types.js";

/**
 * In-memory registry for sensor plugins.
 * Sensors register their descriptors here; nodes can query what's available.
 */
class SensorRegistry {
  private sensors = new Map<string, SensorDescriptor>();

  register(descriptor: SensorDescriptor): void {
    if (this.sensors.has(descriptor.id)) {
      throw new Error(`Sensor "${descriptor.id}" already registered`);
    }
    this.sensors.set(descriptor.id, descriptor);
  }

  get(id: string): SensorDescriptor | undefined {
    return this.sensors.get(id);
  }

  /**
   * Get a full Sensor with ingest/formatSummary methods.
   * Returns undefined if the sensor doesn't implement the full interface.
   */
  getSensor(id: string): Sensor | undefined {
    const s = this.sensors.get(id);
    return s && "ingest" in s && "formatSummary" in s ? (s as Sensor) : undefined;
  }

  list(): SensorDescriptor[] {
    return Array.from(this.sensors.values());
  }

  has(id: string): boolean {
    return this.sensors.has(id);
  }

  ids(): string[] {
    return Array.from(this.sensors.keys());
  }
}

// Singleton instance
export const registry = new SensorRegistry();

// Convenience function for registration
export function registerSensor(descriptor: SensorDescriptor): void {
  registry.register(descriptor);
}
